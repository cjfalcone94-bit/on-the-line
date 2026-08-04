import { createClient } from 'npm:@supabase/supabase-js@2';
import { Webhook } from 'npm:svix@1';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

// Change delivers webhooks via svix. We verify the svix signature with CHANGE_WEBHOOK_SECRET
// before trusting anything, mirroring the fail-closed discipline of processor-webhook
// (Stripe). A forged/altered body is rejected 400 and cannot flip any disbursement state.
// The webhook reconciles provider facts only: it confirms a donation reached a
// sent/received/deposited state and stamps confirmed_at. It never initiates a payout and
// never decides a settlement outcome.
const CONFIRMED_STATES = new Set([
  'sent', 'received', 'deposited', 'complete', 'completed', 'disbursed', 'paid', 'succeeded',
]);
const FAILED_STATES = new Set(['failed', 'refunded', 'canceled', 'cancelled', 'returned']);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const webhookSecret = Deno.env.get('CHANGE_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!webhookSecret || !supabaseUrl || !serviceKey) return json({ error: 'server_not_configured' }, 503);

  const svixId = request.headers.get('svix-id');
  const svixTimestamp = request.headers.get('svix-timestamp');
  const svixSignature = request.headers.get('svix-signature');
  if (!svixId || !svixTimestamp || !svixSignature) return json({ error: 'invalid_signature' }, 400);

  const rawBody = await request.text();
  let event: Record<string, unknown>;
  try {
    const wh = new Webhook(webhookSecret);
    event = wh.verify(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as Record<string, unknown>;
  } catch {
    return json({ error: 'invalid_signature' }, 400);
  }

  // Only act on donation status updates; acknowledge everything else so svix stops retrying.
  const eventType = String(event.type ?? event.event ?? '');
  if (eventType && eventType !== 'donation.status.updated') return json({ received: true, ignored: eventType });

  const data = (event.data ?? event.donation ?? event) as Record<string, unknown>;
  const donationId = data.id !== undefined && data.id !== null ? String(data.id) : null;
  const externalId = data.external_id !== undefined && data.external_id !== null ? String(data.external_id) : null;
  const status = String(data.status ?? '').toLowerCase();
  if (!donationId && !externalId) return json({ received: true, ignored: 'no_identifier' });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  // Match by our external_id (= commitment id) first — it is stable across the whole
  // flow — then fall back to the provider donation id. Idempotent: unknown ids are 200.
  const patch: Record<string, unknown> = {
    provider_status: status || null,
    updated_at: new Date().toISOString(),
  };
  if (donationId) patch.provider_donation_id = donationId;
  if (CONFIRMED_STATES.has(status)) {
    patch.status = 'succeeded';
    patch.confirmed_at = new Date().toISOString();
    patch.last_error = null;
  } else if (FAILED_STATES.has(status)) {
    // Do not clobber a confirmed disbursement; only a non-succeeded row degrades.
    patch.status = 'failed';
  }

  let query = admin.from('charity_disbursements').update(patch);
  query = externalId ? query.eq('external_id', externalId) : query.eq('provider_donation_id', donationId!);
  // Never downgrade an already-confirmed row on a late/out-of-order failure event.
  if (patch.status === 'failed') query = query.neq('status', 'succeeded');
  const { data: updated } = await query.select('commitment_id').maybeSingle();

  return json({ received: true, matched: Boolean(updated) });
});
