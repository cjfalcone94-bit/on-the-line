import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { slaResolutionAt } from '../_shared/verification-contract.ts';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json' }, status,
});
const triggerRelease = (submissionId: string) => fetch(
  `${Deno.env.get('SUPABASE_URL')!}/functions/v1/release-auth`,
  {
    body: JSON.stringify({ submissionId }),
    headers: { 'Content-Type': 'application/json', 'x-settlement-secret': Deno.env.get('SETTLEMENT_INTERNAL_SECRET')! },
    method: 'POST',
  },
);

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (request.headers.get('x-cron-secret') !== Deno.env.get('SLA_SWEEP_SECRET')) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const now = new Date();
  const { data: overdue, error } = await admin.from('proof_submissions')
    .select('id, sla_deadline, resolved_at, verification_status')
    .is('resolved_at', null).lte('sla_deadline', now.toISOString());
  if (error) return json({ error: 'query_failed' }, 500);
  let passed = 0;
  for (const submission of overdue ?? []) {
    if (slaResolutionAt({ id: submission.id, slaDeadline: submission.sla_deadline, resolvedAt: submission.resolved_at }, now) !== 'sla_auto_pass') continue;
    const { data } = await admin.from('proof_submissions').update({
      appeal_status: submission.verification_status === 'needs_review' ? 'resolved' : 'none',
      resolution_type: 'sla_auto_pass', resolved_at: now.toISOString(), verification_status: 'passed',
    }).eq('id', submission.id).is('resolved_at', null).select('id').maybeSingle();
    if (!data) continue;
    passed += 1;
    await admin.from('verification_transitions').insert({
      actor_type: 'sla', from_state: submission.verification_status, resolution_type: 'sla_auto_pass',
      submission_id: submission.id, to_state: 'passed',
    });
    await triggerRelease(submission.id);
  }
  return json({ autoPassed: passed });
});
