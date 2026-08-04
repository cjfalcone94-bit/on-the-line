import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { forfeitResolutionAt } from '../_shared/verification-contract.ts';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json' }, status,
});
const triggerForfeit = (submissionId: string) => fetch(
  `${Deno.env.get('SUPABASE_URL')!}/functions/v1/charge-on-fail`,
  {
    body: JSON.stringify({ submissionId }),
    headers: { 'Content-Type': 'application/json', 'x-settlement-secret': Deno.env.get('SETTLEMENT_INTERNAL_SECRET')! },
    method: 'POST',
  },
);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.headers.get('x-cron-secret') !== Deno.env.get('FORFEIT_SWEEP_SECRET')) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const { data: due, error } = await admin.from('proof_submissions')
    .select('id, appeal_deadline, appeal_status, resolution_type')
    .eq('resolution_type', 'human_fail').eq('appeal_status', 'none')
    .not('appeal_deadline', 'is', null).lte('appeal_deadline', now.toISOString());
  if (error) return json({ error: 'query_failed' }, 500);
  let forfeited = 0;
  for (const submission of due ?? []) {
    if (forfeitResolutionAt({
      id: submission.id, resolutionType: submission.resolution_type,
      appealStatus: submission.appeal_status, appealDeadline: submission.appeal_deadline,
    }, now) !== 'auto_forfeit') continue;
    // Compare-and-set on appeal_status='none': if the user appealed in the interim
    // (appeal-verification sets appeal_status='pending'), this write matches nothing
    // and we skip, so the existing appeal flow always wins.
    const { data } = await admin.from('proof_submissions').update({
      appeal_status: 'resolved',
    }).eq('id', submission.id).eq('appeal_status', 'none').eq('resolution_type', 'human_fail').select('id').maybeSingle();
    if (!data) continue;
    forfeited += 1;
    await admin.from('verification_transitions').insert({
      actor_type: 'system', from_state: 'needs_review', resolution_type: 'human_fail',
      submission_id: submission.id, to_state: 'needs_review',
    });
    await triggerForfeit(submission.id);
  }
  return json({ forfeited });
});
