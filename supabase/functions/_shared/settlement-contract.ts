export const BASE_FEE_CENTS = 100;
export const SUCCESS_FEE_MIN_CENTS = 100;
export const SUCCESS_FEE_MAX_CENTS = 200;

export type SettlementOutcome = 'success' | 'forfeit';
export type SettlementState = 'authorized' | 'voided' | 'settling' | 'settled-success' | 'settled-forfeit';

export type SettlementCommitment = Readonly<{
  id: string;
  ownerId: string;
  stakeCents: number;
  currency: 'usd';
  charityDestinationId: string;
  processorAuthReference: string;
  paymentMethodReference: string;
  state: SettlementState;
  verificationStatus: 'passed' | 'needs_review';
  resolutionType: string;
  appealStatus: 'none' | 'pending' | 'resolved';
}>;

export interface SettlementProcessor {
  releaseAuthorization(reference: string, idempotencyKey: string): Promise<{ id: string }>;
  chargeFee(input: {
    amount: number;
    currency: 'usd';
    paymentMethodReference: string;
    idempotencyKey: string;
    kind: 'base' | 'success';
    commitmentId: string;
  }): Promise<{ id: string }>;
  // captureStake collects the forfeited stake. H1 fix: the manual-capture auth hold
  // can expire (~7d) before the SLA + human review + appeal window + sweep timeline
  // completes. Because the authorization PaymentIntent is created with
  // setup_future_usage:'off_session', the saved payment method lets the processor
  // fall back to an off-session charge if the hold is already gone — so a verified
  // forfeit is always collectible. The fallback is gated on the hold being provably
  // dead (canceled, nothing captured) to make double-charge impossible.
  captureStake(input: {
    authReference: string;
    amount: number;
    currency: 'usd';
    paymentMethodReference: string;
    idempotencyKey: string;
    fallbackIdempotencyKey: string;
  }): Promise<{ id: string }>;
  // disburseToCharity moves the forfeited stake onward to the chosen 501(c)(3) via
  // the disbursement provider (Change). Unlike the retired Stripe Connect transfer,
  // there is no on-platform source charge to pull from — Change invoices us monthly —
  // so `sourceReference` is gone. Idempotency is preserved by our own external_id =
  // commitmentId guard plus the deterministic idempotency key.
  disburseToCharity(input: {
    amount: number;
    currency: 'usd';
    nonprofitId: string;
    idempotencyKey: string;
    commitmentId: string;
  }): Promise<{ id: string; status?: string }>;
}

export function successFeeCents(stakeCents: number): number {
  return Math.min(SUCCESS_FEE_MAX_CENTS, Math.max(SUCCESS_FEE_MIN_CENTS, Math.round(stakeCents * 0.03)));
}

export async function chargeBaseFee(
  processor: SettlementProcessor,
  input: Pick<SettlementCommitment, 'id' | 'currency' | 'paymentMethodReference'>,
) {
  return processor.chargeFee({
    amount: BASE_FEE_CENTS,
    commitmentId: input.id,
    currency: input.currency,
    idempotencyKey: `commitment:${input.id}:base-fee:v1`,
    kind: 'base',
    paymentMethodReference: input.paymentMethodReference,
  });
}

function assertSettleable(commitment: SettlementCommitment, outcome: SettlementOutcome) {
  if (commitment.state === 'voided') throw new Error('commitment_voided');
  if (commitment.state !== 'authorized' && commitment.state !== 'settling') throw new Error('already_settled');
  if (outcome === 'success' && commitment.verificationStatus !== 'passed') throw new Error('verified_success_required');
  const finalFailure = commitment.verificationStatus === 'needs_review' &&
    commitment.resolutionType === 'human_fail' &&
    commitment.appealStatus === 'resolved';
  if (outcome === 'forfeit' && !finalFailure) throw new Error('verified_failure_required');
}

export async function settleSuccess(processor: SettlementProcessor, commitment: SettlementCommitment) {
  assertSettleable(commitment, 'success');
  const released = await processor.releaseAuthorization(
    commitment.processorAuthReference,
    `commitment:${commitment.id}:release:v1`,
  );
  const feeAmount = successFeeCents(commitment.stakeCents);
  const fee = await processor.chargeFee({
    amount: feeAmount,
    commitmentId: commitment.id,
    currency: commitment.currency,
    idempotencyKey: `commitment:${commitment.id}:success-fee:v1`,
    kind: 'success',
    paymentMethodReference: commitment.paymentMethodReference,
  });
  return Object.freeze({ feeAmount, feeReference: fee.id, releasedReference: released.id });
}

// Forfeit money-flow (see docs/CHARITY-DISBURSEMENT-PLAN.md §3.7):
//   1. captureStake   — the forfeited stake lands in our Stripe balance. From here it
//                       is a LIABILITY OWED TO CHARITY, never platform fee revenue.
//   2. disburseToCharity — IMMEDIATELY earmark it to the chosen 501(c)(3) via Change
//                       (no batching/delay), so the amount is never commingled with or
//                       accounted as our fee income. The base/success fees are strictly
//                       separate off-session charges (chargeFee), so "100% to charity"
//                       stays literally true.
// Both legs are idempotent; the handler wraps disburseToCharity in a durable pending
// row so a failed Change call is retryable and captured-but-owed money is never lost.
export async function settleForfeit(processor: SettlementProcessor, commitment: SettlementCommitment) {
  assertSettleable(commitment, 'forfeit');
  const captured = await processor.captureStake({
    authReference: commitment.processorAuthReference,
    amount: commitment.stakeCents,
    currency: commitment.currency,
    paymentMethodReference: commitment.paymentMethodReference,
    idempotencyKey: `commitment:${commitment.id}:capture:v1`,
    fallbackIdempotencyKey: `commitment:${commitment.id}:stake-offsession-capture:v1`,
  });
  const disbursement = await processor.disburseToCharity({
    amount: commitment.stakeCents,
    currency: commitment.currency,
    nonprofitId: commitment.charityDestinationId,
    idempotencyKey: `commitment:${commitment.id}:charity-disburse:v1`,
    commitmentId: commitment.id,
  });
  return Object.freeze({
    capturedAmount: commitment.stakeCents,
    capturedReference: captured.id,
    feeAmount: 0,
    disbursementReference: disbursement.id,
    disbursementStatus: disbursement.status ?? 'pending',
  });
}

export function rateLimitAllows(hitCount: number, limit: number): boolean {
  return hitCount <= limit;
}
