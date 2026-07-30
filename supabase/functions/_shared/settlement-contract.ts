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
  captureStake(reference: string, amount: number, idempotencyKey: string): Promise<{ id: string }>;
  transferToCharity(input: {
    amount: number;
    currency: 'usd';
    charityDestinationId: string;
    sourceReference: string;
    idempotencyKey: string;
  }): Promise<{ id: string }>;
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

export async function settleForfeit(processor: SettlementProcessor, commitment: SettlementCommitment) {
  assertSettleable(commitment, 'forfeit');
  const captured = await processor.captureStake(
    commitment.processorAuthReference,
    commitment.stakeCents,
    `commitment:${commitment.id}:capture:v1`,
  );
  const transfer = await processor.transferToCharity({
    amount: commitment.stakeCents,
    charityDestinationId: commitment.charityDestinationId,
    currency: commitment.currency,
    idempotencyKey: `commitment:${commitment.id}:charity-transfer:v1`,
    sourceReference: captured.id,
  });
  return Object.freeze({ capturedAmount: commitment.stakeCents, capturedReference: captured.id, feeAmount: 0, transferReference: transfer.id });
}

export function rateLimitAllows(hitCount: number, limit: number): boolean {
  return hitCount <= limit;
}
