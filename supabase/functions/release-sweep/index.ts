import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

// H3 completion: guarantee that an owed auth-hold release actually happens.
// create-commitment-authorization records a private_pending_releases row whenever a
// base-fee-fail cancel also failed. This cron-gated sweep retries the Stripe cancel with
// the same stable idempotency key until it succeeds, then deletes the row. A lingering
// hold on a user's card can never be silently left behind.
Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.headers.get('x-cron-secret') !== Deno.env.get('RELEASE_SWEEP_SECRET')) {
    return json({ error: 'unauthorized' }, 401);
  }
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!url || !serviceKey || !stripeKey) return json({ error: 'server_not_configured' }, 503);

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const stripe = new Stripe(stripeKey);
  const { data: due } = await admin.from('private_pending_releases')
    .select('commitment_id, auth_reference, attempts')
    .lte('next_attempt_at', new Date().toISOString()).order('created_at').limit(25);

  let released = 0;
  for (const job of due ?? []) {
    try {
      await stripe.paymentIntents.cancel(job.auth_reference, {}, {
        idempotencyKey: `commitment:${job.commitment_id}:pending-release:v1`,
      });
      await admin.from('private_pending_releases').delete().eq('commitment_id', job.commitment_id);
      released += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      // A PI already canceled/expired throws; treat "cannot be canceled because it is
      // already canceled" as done — the hold is gone, which is the goal.
      if (/canceled|cancelled|no longer|expired|already/i.test(message)) {
        await admin.from('private_pending_releases').delete().eq('commitment_id', job.commitment_id);
        released += 1;
        continue;
      }
      const attempts = job.attempts + 1;
      const delaySeconds = Math.min(3600, 2 ** attempts * 15);
      console.error('release_retry_failed', JSON.stringify({ commitmentId: job.commitment_id, attempts, error: message }));
      await admin.from('private_pending_releases').update({
        attempts,
        last_error: message.slice(0, 500),
        next_attempt_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
      }).eq('commitment_id', job.commitment_id);
    }
  }
  return json({ attempted: due?.length ?? 0, released });
});
