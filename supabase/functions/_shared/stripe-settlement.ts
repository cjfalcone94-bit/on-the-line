import Stripe from 'npm:stripe@18';
import type { SettlementProcessor } from './settlement-contract.ts';

// The Stripe processor now owns only the on-Stripe legs: release, fees, and stake
// capture. The onward charity move is no longer a Stripe Connect transfer (dead: no
// connected accounts ever existed) — it is a Change disbursement composed in the
// settlement handler. So this factory returns everything on SettlementProcessor except
// disburseToCharity.
export type StripeSettlementProcessor = Omit<SettlementProcessor, 'disburseToCharity'>;

export function stripeSettlementProcessor(stripe: Stripe): StripeSettlementProcessor {
  return {
    // H1 fix: the 7-day manual-capture hold can expire before the SLA + human review +
    // 48h appeal + sweep timeline completes. Capture normally; if the hold is provably
    // dead (PI canceled, nothing ever captured) fall back to an off-session charge on
    // the saved payment method (enabled by setup_future_usage:'off_session' at
    // authorization). The fallback is gated on status==='canceled' && amount_received===0
    // so a capture can never also succeed — double-charge is impossible.
    async captureStake(input) {
      try {
        const intent = await stripe.paymentIntents.capture(
          input.authReference,
          { amount_to_capture: input.amount },
          { idempotencyKey: input.idempotencyKey },
        );
        const charge = typeof intent.latest_charge === 'string' ? intent.latest_charge : intent.latest_charge?.id;
        if (!charge) throw new Error('captured_charge_missing');
        return { id: charge };
      } catch (captureError) {
        let pi: Stripe.PaymentIntent;
        try {
          pi = await stripe.paymentIntents.retrieve(input.authReference);
        } catch {
          // Cannot even read the PI: this is not a provable-dead-hold case. Rethrow so
          // the settlement sweep retries with the stable capture idempotency key.
          throw captureError;
        }
        const holdIsDead = pi.status === 'canceled' && pi.amount_received === 0;
        if (!holdIsDead) throw captureError;
        // Hold expired/gone and nothing was captured: collect the forfeit off-session.
        const offSession = await stripe.paymentIntents.create({
          amount: input.amount,
          confirm: true,
          currency: input.currency,
          metadata: { operation: 'stake_offsession_capture', reason: 'auth_hold_expired' },
          off_session: true,
          payment_method: input.paymentMethodReference,
        }, { idempotencyKey: input.fallbackIdempotencyKey });
        const charge = typeof offSession.latest_charge === 'string'
          ? offSession.latest_charge
          : offSession.latest_charge?.id;
        if (!charge) throw new Error('offsession_charge_missing');
        return { id: charge };
      }
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
  };
}
