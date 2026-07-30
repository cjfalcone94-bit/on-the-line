import Stripe from 'npm:stripe@18';
import type { SettlementProcessor } from './settlement-contract.ts';

export function stripeSettlementProcessor(stripe: Stripe): SettlementProcessor {
  return {
    async captureStake(reference, amount, idempotencyKey) {
      const intent = await stripe.paymentIntents.capture(reference, { amount_to_capture: amount }, { idempotencyKey });
      const charge = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
      if (!charge) throw new Error('captured_charge_missing');
      return { id: charge };
    },
    async chargeFee(input) {
      const intent = await stripe.paymentIntents.create({
        amount: input.amount,
        confirm: true,
        currency: input.currency,
        metadata: { commitment_id: input.commitmentId, fee_kind: input.kind, operation: 'separate_platform_fee' },
        off_session: true,
        payment_method: input.paymentMethodReference,
      }, { idempotencyKey: input.idempotencyKey });
      return { id: intent.id };
    },
    async releaseAuthorization(reference, idempotencyKey) {
      const intent = await stripe.paymentIntents.cancel(reference, {}, { idempotencyKey });
      return { id: intent.id };
    },
    async transferToCharity(input) {
      const transfer = await stripe.transfers.create({
        amount: input.amount,
        currency: input.currency,
        destination: input.charityDestinationId,
        metadata: { operation: 'full_stake_charity_forfeit' },
        source_transaction: input.sourceReference,
      }, { idempotencyKey: input.idempotencyKey });
      return { id: transfer.id };
    },
  };
}
