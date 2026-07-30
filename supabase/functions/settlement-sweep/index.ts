import { createClient } from 'npm:@supabase/supabase-js@2';

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' }, status });

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.headers.get('x-cron-secret') !== Deno.env.get('SETTLEMENT_SWEEP_SECRET')) {
    return json({ error: 'unauthorized' }, 401);
  }
  const url = Deno.env.get('SUPABASE_URL')!;
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: jobs } = await admin.from('private_settlement_jobs')
    .select('submission_id, outcome, attempts')
    .lte('next_attempt_at', new Date().toISOString()).order('created_at').limit(25);
  let settled = 0;
  for (const job of jobs ?? []) {
    const functionName = job.outcome === 'success' ? 'release-auth' : 'charge-on-fail';
    const result = await fetch(`${url}/functions/v1/${functionName}`, {
      body: JSON.stringify({ submissionId: job.submission_id }),
      headers: {
        'Content-Type': 'application/json',
        'x-settlement-secret': Deno.env.get('SETTLEMENT_INTERNAL_SECRET')!,
      },
      method: 'POST',
    });
    if (result.ok) {
      settled += 1;
    } else {
      const attempts = job.attempts + 1;
      const delaySeconds = Math.min(3600, 2 ** attempts * 15);
      await admin.from('private_settlement_jobs').update({
        attempts,
        next_attempt_at: new Date(Date.now() + delaySeconds * 1000).toISOString(),
      }).eq('submission_id', job.submission_id);
    }
  }
  return json({ attempted: jobs?.length ?? 0, settled });
});
