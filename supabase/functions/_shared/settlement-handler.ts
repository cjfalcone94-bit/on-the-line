import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18';
import { settleForfeit, settleSuccess, type SettlementCommitment, type SettlementOutcome } from './settlement-contract.ts';
import { stripeSettlementProcessor } from './stripe-settlement.ts';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

export async function handleSettlementRequest(request: Request, outcome: SettlementOutcome): Promise<Response> {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const internalSecret = Deno.env.get('SETTLEMENT_INTERNAL_SECRET');
  if (!internalSecret || request.headers.get('x-settlement-secret') !== internalSecret) {
    return json({ error: 'server_only' }, 403);
  }
  const { submissionId } = await request.json().catch(() => ({})) as { submissionId?: string };
  if (!submissionId) return json({ error: 'invalid_request' }, 400);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!url || !serviceKey || !stripeKey) return json({ error: 'server_not_configured' }, 503);
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const { data: proof } = await admin.from('proof_submissions')
    .select('id, commitment_id, verification_status, resolution_type, appeal_status')
    .eq('id', submissionId).not('resolved_at', 'is', null).maybeSingle();
  if (!proof) return json({ error: 'resolved_verification_required' }, 409);
  const { data: row } = await admin.from('commitments')
    .select('id, owner_id, template_id, stake_cents, currency, charity_destination_id, processor_auth_reference, payment_method_reference, state, base_fee_cents')
    .eq('id', proof.commitment_id).maybeSingle();
  if (!row || !row.payment_method_reference) return json({ error: 'commitment_not_settleable' }, 409);
  if (row.state === 'settled-success' || row.state === 'settled-forfeit') return json({ status: row.state });
  if (row.state === 'voided') return json({ error: 'commitment_voided' }, 409);

  type CharityRoute = { id: string; stripe_destination_id: string; version: number };
  let declaredCharity: CharityRoute | null = {
    id: row.charity_destination_id, stripe_destination_id: '', version: 1,
  };
  let routedCharity: CharityRoute | null = declaredCharity;
  if (outcome === 'forfeit') {
    const { data } = await admin.from('charity_destinations')
      .select('id, version, stripe_destination_id')
      .eq('id', row.charity_destination_id).eq('version', 1).eq('active', true).maybeSingle();
    declaredCharity = data;
    const { data: fallbackCharity } = declaredCharity ? { data: null } : await admin.from('charity_destinations')
      .select('id, version, stripe_destination_id').eq('active', true).eq('is_fallback', true).maybeSingle();
    routedCharity = declaredCharity ?? fallbackCharity;
    if (!routedCharity) return json({ error: 'charity_destination_unavailable' }, 503);
  }

  const commitment: SettlementCommitment = {
    appealStatus: proof.appeal_status,
    charityDestinationId: routedCharity.stripe_destination_id,
    currency: row.currency,
    id: row.id,
    ownerId: row.owner_id,
    paymentMethodReference: row.payment_method_reference,
    processorAuthReference: row.processor_auth_reference,
    resolutionType: proof.resolution_type,
    stakeCents: row.stake_cents,
    state: row.state,
    verificationStatus: proof.verification_status,
  };
  const { data: claimed } = await admin.from('commitments').update({
    settlement_started_at: new Date().toISOString(), state: 'settling',
  }).eq('id', row.id).eq('state', 'authorized').select('id').maybeSingle();
  if (!claimed && row.state !== 'settling') return json({ error: 'settlement_already_claimed' }, 409);

  const processor = stripeSettlementProcessor(new Stripe(stripeKey));
  try {
    let successFee: number;
    let stakeReference: string;
    let feeReference: string | null;
    let transferReference: string | null;
    if (outcome === 'success') {
      const result = await settleSuccess(processor, { ...commitment, state: 'settling' });
      successFee = result.feeAmount;
      stakeReference = result.releasedReference;
      feeReference = result.feeReference;
      transferReference = null;
    } else {
      const result = await settleForfeit(processor, { ...commitment, state: 'settling' });
      successFee = result.feeAmount;
      stakeReference = result.capturedReference;
      feeReference = null;
      transferReference = result.transferReference;
    }
    const settledAt = new Date().toISOString();
    const receipt = {
      base_fee_cents: row.base_fee_cents,
      charity_destination_id: routedCharity.id,
      charity_destination_version: routedCharity.version,
      commitment_id: row.id,
      fallback_used: !declaredCharity,
      outcome,
      owner_id: row.owner_id,
      processor_fee_reference: feeReference,
      processor_stake_reference: stakeReference,
      processor_transfer_reference: transferReference,
      settled_at: settledAt,
      stake_cents: row.stake_cents,
      success_fee_cents: successFee,
    };
    const { error: receiptError } = await admin.from('glass_receipts').upsert(receipt, { onConflict: 'commitment_id' });
    if (receiptError) throw receiptError;
    await admin.from('commitment_record').upsert({
      base_fee_cents: row.base_fee_cents,
      charity_destination_id: row.charity_destination_id,
      commitment_id: row.id,
      outcome,
      owner_id: row.owner_id,
      settled_at: settledAt,
      stake_cents: row.stake_cents,
      success_fee_cents: successFee,
      template_id: row.template_id,
    }, { onConflict: 'commitment_id' });
    await admin.from('commitments').update({
      settled_at: settledAt, state: outcome === 'success' ? 'settled-success' : 'settled-forfeit',
    }).eq('id', row.id).eq('state', 'settling');
    await admin.from('private_settlement_jobs').delete().eq('submission_id', submissionId);
    const posthogKey = Deno.env.get('POSTHOG_API_KEY');
    const posthogHost = Deno.env.get('POSTHOG_HOST');
    if (posthogKey && posthogHost) {
      await fetch(`${posthogHost}/capture/`, {
        body: JSON.stringify({
          api_key: posthogKey,
          event: 'settlement_resolved',
          properties: { distinct_id: row.owner_id, fee_charged: successFee > 0, outcome },
        }),
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
      }).catch(() => undefined);
    }
    return json({ feeCharged: successFee > 0, outcome, status: 'settled' });
  } catch {
    // Keep `settling`: retries are safe because every processor operation uses a stable idempotency key.
    return json({ error: 'settlement_incomplete' }, 502);
  }
}
