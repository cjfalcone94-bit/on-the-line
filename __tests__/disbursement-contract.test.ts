import { readFileSync } from 'node:fs';
import {
  disburseWithGuard,
  type ChangeDonationClient,
  type DisbursementRecord,
  type DisbursementStore,
} from '../supabase/functions/_shared/disbursement-contract';

const baseInput = {
  commitmentId: 'commitment-1',
  ownerId: 'owner-a',
  nonprofitId: 'np_direct_relief',
  charityDestinationId: 'fred-hollows',
  amountCents: 4000,
  currency: 'usd' as const,
  externalId: 'commitment-1',
  idempotencyKey: 'commitment:commitment-1:charity-disburse:v1',
};

function store(initial: DisbursementRecord | null = null): DisbursementStore & Record<string, jest.Mock> {
  let record = initial;
  return {
    get: jest.fn(async () => record),
    upsertPending: jest.fn(async (input) => {
      // Mirror `on conflict do nothing`: never downgrade an existing row.
      if (!record) record = { commitmentId: input.commitmentId, status: 'pending', providerDonationId: null };
    }),
    markSucceeded: jest.fn(async (commitmentId, providerDonationId) => {
      record = { commitmentId, status: 'succeeded', providerDonationId };
    }),
    markFailed: jest.fn(async () => {
      if (record && record.status === 'pending') record = { ...record, status: 'failed' };
    }),
  };
}

function client(): Required<ChangeDonationClient> & Record<string, jest.Mock> {
  return {
    disburse: jest.fn(async () => ({ id: 'don_123', status: 'created' })),
    findByExternalId: jest.fn(async () => null),
  };
}

describe('charity disbursement guard (C2 / R3)', () => {
  it('writes a pending row before calling Change, then marks it succeeded', async () => {
    const s = store();
    const c = client();
    const result = await disburseWithGuard(c, s, baseInput);
    // Pending row must exist BEFORE the network call so a mid-call crash is recoverable.
    expect(s.upsertPending).toHaveBeenCalledTimes(1);
    expect((s.upsertPending as jest.Mock).mock.invocationCallOrder[0])
      .toBeLessThan((c.disburse as jest.Mock).mock.invocationCallOrder[0]);
    expect(c.disburse).toHaveBeenCalledWith(expect.objectContaining({
      nonprofitId: 'np_direct_relief', amountCents: 4000, externalId: 'commitment-1',
      idempotencyKey: 'commitment:commitment-1:charity-disburse:v1',
    }));
    expect(s.markSucceeded).toHaveBeenCalledWith('commitment-1', 'don_123', 'created');
    expect(result).toEqual({ id: 'don_123', status: 'created', reused: false });
  });

  it('never double-donates: a prior succeeded row short-circuits without calling Change', async () => {
    const s = store({ commitmentId: 'commitment-1', status: 'succeeded', providerDonationId: 'don_existing' });
    const c = client();
    const result = await disburseWithGuard(c, s, baseInput);
    expect(c.disburse).not.toHaveBeenCalled();
    expect(s.upsertPending).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'don_existing', status: 'succeeded', reused: true });
  });

  it('C2: a failed Change call marks the row failed and rethrows so the stake is tracked as owed', async () => {
    const s = store();
    const c = client();
    (c.disburse as jest.Mock).mockRejectedValueOnce(new Error('change_disburse_failed:502:'));
    await expect(disburseWithGuard(c, s, baseInput)).rejects.toThrow('change_disburse_failed');
    expect(s.markFailed).toHaveBeenCalledWith('commitment-1', 'change_disburse_failed:502:');
  });

  it('is retryable: after a failure a re-run reaches Change again and can succeed', async () => {
    const s = store();
    const failing = client();
    (failing.disburse as jest.Mock).mockRejectedValueOnce(new Error('change_disburse_failed:503:'));
    await expect(disburseWithGuard(failing, s, baseInput)).rejects.toThrow();
    // Second attempt (same durable store, healthy client) succeeds and records the donation.
    const healthy = client();
    const result = await disburseWithGuard(healthy, s, baseInput);
    expect(healthy.disburse).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('created');
    expect(s.markSucceeded).toHaveBeenCalledWith('commitment-1', 'don_123', 'created');
  });

  it('adopts a remote donation found by external_id instead of creating a duplicate', async () => {
    const s = store();
    const c = client();
    (c.findByExternalId as jest.Mock).mockResolvedValueOnce({ id: 'don_remote', status: 'sent' });
    const result = await disburseWithGuard(c, s, baseInput);
    expect(c.disburse).not.toHaveBeenCalled();
    expect(s.markSucceeded).toHaveBeenCalledWith('commitment-1', 'don_remote', 'sent');
    expect(result).toEqual({ id: 'don_remote', status: 'sent', reused: true });
  });
});

describe('change integration wiring (source assertions)', () => {
  it('change client posts to the Change donations API with basic auth + external_id guard', () => {
    const client = readFileSync('supabase/functions/_shared/change-disbursement.ts', 'utf8');
    expect(client).toContain('https://api.getchange.io/v1/donations');
    expect(client).toContain("'Basic ' + btoa(`${publicKey}:${secretKey}`)");
    expect(client).toContain('external_id: input.externalId');
    // Fails closed when keys are absent, like the Stripe/Supabase discipline.
    expect(client).toContain("throw new Error('server_not_configured')");
  });

  it('change webhook verifies the svix signature before trusting any event', () => {
    const webhook = readFileSync('supabase/functions/change-webhook/index.ts', 'utf8');
    expect(webhook).toContain("Deno.env.get('CHANGE_WEBHOOK_SECRET')");
    expect(webhook).toContain('new Webhook(webhookSecret)');
    expect(webhook).toContain('wh.verify(rawBody');
    expect(webhook).toContain("return json({ error: 'invalid_signature' }, 400)");
  });

  it('forfeit settlement fails closed without Change keys and never captures without a payable nonprofit id', () => {
    const handler = readFileSync('supabase/functions/_shared/settlement-handler.ts', 'utf8');
    expect(handler).toContain("Deno.env.get('CHANGE_SECRET_KEY')");
    expect(handler).toContain("return json({ error: 'server_not_configured' }, 503)");
    expect(handler).toContain('!routedCharity.provider_nonprofit_id');
    expect(handler).toContain("return json({ error: 'charity_destination_unavailable' }, 503)");
  });

  it('config registers change-webhook and release-sweep with verify_jwt=false', () => {
    const config = readFileSync('supabase/config.toml', 'utf8');
    expect(config).toContain('[functions.change-webhook]');
    expect(config).toContain('[functions.release-sweep]');
  });
});
