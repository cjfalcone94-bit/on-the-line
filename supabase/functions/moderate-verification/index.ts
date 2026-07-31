import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  headers: { 'Content-Type': 'application/json' }, status,
});
const triggerSettlement = (functionName: 'release-auth' | 'charge-on-fail', submissionId: string) => fetch(
  `${Deno.env.get('SUPABASE_URL')!}/functions/v1/${functionName}`,
  {
    body: JSON.stringify({ submissionId }),
    headers: { 'Content-Type': 'application/json', 'x-settlement-secret': Deno.env.get('SETTLEMENT_INTERNAL_SECRET')! },
    method: 'POST',
  },
);

// Internal moderation surface: only a server-validated JWT whose app_metadata
// contains role=moderator can list or decide queue entries. Queue tables remain
// unreachable directly from all client roles.
Deno.serve(async (request) => {
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'unauthorized' }, 401);
  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: auth, error } = await caller.auth.getUser();
  if (error || !auth.user || auth.user.app_metadata?.role !== 'moderator') return json({ error: 'forbidden' }, 403);

  if (request.method === 'GET') {
    const { data } = await admin.from('moderation_queue')
      .select('id, submission_id, queue_kind, reason, status, created_at')
      .in('status', ['open', 'claimed']).order('created_at');
    return json({ queue: data ?? [] });
  }
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const body = await request.json().catch(() => null) as {
    queueId?: string; decision?: 'pass' | 'fail'; reason?: string;
  } | null;
  if (!body) return json({ error: 'invalid_request' }, 400);
  const { queueId, decision, reason } = body;
  if (!queueId || !decision || !['pass', 'fail'].includes(decision) || !reason) {
    return json({ error: 'invalid_decision' }, 400);
  }
  const { data: item } = await admin.from('moderation_queue').select('id, submission_id, queue_kind, status')
    .eq('id', queueId).neq('status', 'resolved').maybeSingle();
  if (!item) return json({ error: 'queue_item_not_found' }, 404);
  const status = decision === 'pass' ? 'passed' : 'needs_review';
  const resolutionType = decision === 'pass' ? 'human_pass' : 'human_fail';
  await admin.from('proof_submissions').update({
    appeal_status: item.queue_kind === 'appeal' ? 'resolved' : 'none',
    resolution_type: resolutionType, resolved_at: new Date().toISOString(), verification_status: status,
  }).eq('id', item.submission_id).is('resolved_at', null);
  await admin.from('moderation_decisions').insert({
    decision, moderator_id: auth.user.id, queue_id: item.id, reason, submission_id: item.submission_id,
  });
  await admin.from('verification_transitions').insert({
    actor_id: auth.user.id, actor_type: 'moderator', from_state: item.queue_kind === 'appeal' ? 'appealed' : 'in_review',
    resolution_type: resolutionType, submission_id: item.submission_id, to_state: status,
  });
  await admin.from('moderation_queue').update({ resolved_at: new Date().toISOString(), status: 'resolved' }).eq('id', item.id);
  if (decision === 'pass') await triggerSettlement('release-auth', item.submission_id);
  if (decision === 'fail' && item.queue_kind === 'appeal') await triggerSettlement('charge-on-fail', item.submission_id);
  return json({ resolutionType, status });
});
