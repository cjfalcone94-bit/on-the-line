import { readFileSync } from 'node:fs';
import {
  BASE_FEE_CENTS,
  chargeBaseFee,
  rateLimitAllows,
  settleForfeit,
  settleSuccess,
  successFeeCents,
  type SettlementCommitment,
  type SettlementProcessor,
} from '../supabase/functions/_shared/settlement-contract';

const success: SettlementCommitment = {
  appealStatus: 'none',
  charityDestinationId: 'acct_charity_declared',
  currency: 'usd',
  id: 'commitment-1',
  ownerId: 'owner-a',
  paymentMethodReference: 'pm_1',
  processorAuthReference: 'pi_stake',
  resolutionType: 'human_pass',
  stakeCents: 4000,
  state: 'authorized',
  verificationStatus: 'passed',
};
const failure: SettlementCommitment = {
  ...success,
  appealStatus: 'resolved',
  resolutionType: 'human_fail',
  verificationStatus: 'needs_review',
};

function processor(): SettlementProcessor & Record<string, jest.Mock> {
  return {
    captureStake: jest.fn(async () => ({ id: 'ch_stake' })),
    chargeFee: jest.fn(async ({ kind }) => ({ id: kind === 'base' ? 'pi_base' : 'pi_success' })),
    releaseAuthorization: jest.fn(async () => ({ id: 'pi_stake' })),
    disburseToCharity: jest.fn(async () => ({ id: 'don_charity', status: 'created' })),
  };
}

describe('Sprint 6 mandatory hybrid payment contracts', () => {
  it('1. never charges the stake on verified success: releases it and captures nothing', async () => {
    const stripe = processor();
    const result = await settleSuccess(stripe, success);
    expect(stripe.releaseAuthorization).toHaveBeenCalledWith('pi_stake', 'commitment:commitment-1:release:v1');
    expect(stripe.captureStake).not.toHaveBeenCalled();
    expect(result.releasedReference).toBe('pi_stake');
  });

  it('2. never charges after cancellation', async () => {
    const stripe = processor();
    await expect(settleForfeit(stripe, { ...failure, state: 'voided' })).rejects.toThrow('commitment_voided');
    expect(stripe.captureStake).not.toHaveBeenCalled();
    expect(stripe.chargeFee).not.toHaveBeenCalled();
    expect(stripe.disburseToCharity).not.toHaveBeenCalled();
  });

  it('3. settlement is server-only and a client cannot trigger capture', async () => {
    const stripe = processor();
    await expect(settleForfeit(stripe, {
      ...failure, appealStatus: 'none', resolutionType: '', verificationStatus: 'passed',
    })).rejects.toThrow('verified_failure_required');
    expect(stripe.captureStake).not.toHaveBeenCalled();
    const handler = readFileSync('supabase/functions/_shared/settlement-handler.ts', 'utf8');
    expect(handler).toContain("request.headers.get('x-settlement-secret')");
    expect(handler).toContain("not('resolved_at', 'is', null)");
    expect(handler).toContain("return json({ error: 'server_only' }, 403)");
  });

  it('4. an SLA miss is success: stake released, never charged', async () => {
    const stripe = processor();
    await settleSuccess(stripe, { ...success, resolutionType: 'sla_auto_pass' });
    expect(stripe.releaseAuthorization).toHaveBeenCalledTimes(1);
    expect(stripe.captureStake).not.toHaveBeenCalled();
    expect(stripe.disburseToCharity).not.toHaveBeenCalled();
  });

  it('5. forfeit captures the stake then disburses 100% to the immutable declared charity and keeps none', async () => {
    const stripe = processor();
    const result = await settleForfeit(stripe, failure);
    expect(stripe.captureStake).toHaveBeenCalledWith(expect.objectContaining({
      authReference: 'pi_stake',
      amount: 4000,
      paymentMethodReference: 'pm_1',
      idempotencyKey: 'commitment:commitment-1:capture:v1',
      fallbackIdempotencyKey: 'commitment:commitment-1:stake-offsession-capture:v1',
    }));
    expect(stripe.disburseToCharity).toHaveBeenCalledWith(expect.objectContaining({
      amount: 4000,
      nonprofitId: 'acct_charity_declared',
      commitmentId: 'commitment-1',
      idempotencyKey: 'commitment:commitment-1:charity-disburse:v1',
    }));
    expect(stripe.chargeFee).not.toHaveBeenCalled();
    expect(result).toEqual(expect.objectContaining({
      capturedAmount: 4000,
      feeAmount: 0,
      disbursementReference: 'don_charity',
    }));
  });

  it('5b. disburse runs only after capture: a capture failure never moves money to charity', async () => {
    const stripe = processor();
    (stripe.captureStake as jest.Mock).mockRejectedValueOnce(new Error('capture_failed'));
    await expect(settleForfeit(stripe, failure)).rejects.toThrow('capture_failed');
    expect(stripe.disburseToCharity).not.toHaveBeenCalled();
  });

  it('6. base and success fees are separate from stake; base is every commit and success fee is win-only', async () => {
    const stripe = processor();
    await chargeBaseFee(stripe, success);
    await settleSuccess(stripe, success);
    expect(stripe.chargeFee).toHaveBeenNthCalledWith(1, expect.objectContaining({
      amount: BASE_FEE_CENTS, kind: 'base',
    }));
    expect(stripe.chargeFee).toHaveBeenNthCalledWith(2, expect.objectContaining({
      amount: successFeeCents(4000), kind: 'success',
    }));
    expect(stripe.chargeFee).not.toHaveBeenCalledWith(expect.objectContaining({ amount: success.stakeCents }));

    const failedStripe = processor();
    await chargeBaseFee(failedStripe, failure);
    await settleForfeit(failedStripe, failure);
    expect(failedStripe.chargeFee).toHaveBeenCalledTimes(1);
    expect(failedStripe.chargeFee).toHaveBeenCalledWith(expect.objectContaining({ kind: 'base' }));
  });
});

describe('Sprint 6 adversarial controls', () => {
  it('RLS is forced and cross-user writes have no policies on settlement data', () => {
    const migration = readFileSync('supabase/migrations/0005_payments_custody.sql', 'utf8');
    for (const table of ['glass_receipts', 'commitment_record']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
      expect(migration).toContain(`alter table public.${table} force row level security`);
      expect(migration).toContain(`${table}_select_own`);
    }
    expect(migration).not.toMatch(/create policy "[^"]+"\s+on public\.(glass_receipts|commitment_record)\s+for (insert|update|delete)/i);
  });

  it('webhook verification fails closed on missing or invalid signatures before trusting an event', () => {
    const webhook = readFileSync('supabase/functions/processor-webhook/index.ts', 'utf8');
    expect(webhook).toContain("request.headers.get('stripe-signature')");
    expect(webhook).toContain('constructEventAsync(rawBody, signature, webhookSecret)');
    expect(webhook).toContain("return json({ error: 'invalid_signature' }, 400)");
  });

  it('rate-limit hammer rejects the sixth commitment/card authorization request with 429', () => {
    expect([1, 2, 3, 4, 5].every((hit) => rateLimitAllows(hit, 5))).toBe(true);
    expect(rateLimitAllows(6, 5)).toBe(false);
    const endpoint = readFileSync('supabase/functions/create-commitment-authorization/index.ts', 'utf8');
    expect(endpoint.match(/error: 'rate_limited'/g)).toHaveLength(2);
    expect(endpoint.match(/,\s*429\)/g)).toHaveLength(2);
  });

  it('settlement states are constrained and forfeit is the only failure state', () => {
    const migration = readFileSync('supabase/migrations/0005_payments_custody.sql', 'utf8');
    expect(migration).toContain("'settling', 'settled-success', 'settled-forfeit'");
    expect(migration).not.toMatch(/pooled|peer|escrow|fbo/i);
  });
});

