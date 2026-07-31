import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { canAppeal } from '../_shared/verification-contract.ts';

const headers = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};
const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), { headers, status });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'unauthorized' }, 401);
  const url = Deno.env.get('SUPABASE_URL')!;
  const caller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: auth, error: authError } = await caller.auth.getUser();
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);

  const body = await request.json().catch(() => null) as { submissionId?: string; reason?: string } | null;
  if (!body) return json({ error: 'invalid_request' }, 400);
  const { submissionId, reason } = body;
  if (!submissionId || !reason || reason.length > 500) return json({ error: 'invalid_reason' }, 400);
  const { data: allowed, error: rateError } = await admin.rpc('consume_appeal_rate_limit', {
    p_limit: 3, p_owner_id: auth.user.id, p_window_seconds: 3600,
  });
  if (rateError) return json({ error: 'rate_limit_unavailable' }, 503);
  if (!allowed) return json({ error: 'rate_limited' }, 429);

  const { data: submission } = await admin.from('proof_submissions')
    .select('id, owner_id, verification_status, appeal_status')
    .eq('id', submissionId).eq('owner_id', auth.user.id).maybeSingle();
  if (!submission) return json({ error: 'not_found' }, 404);
  if (!canAppeal({ verificationStatus: submission.verification_status, appealStatus: submission.appeal_status })) {
    return json({ error: 'appeal_not_available' }, 409);
  }

  const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await admin.from('proof_submissions').update({
    appeal_status: 'pending', resolved_at: null, resolution_type: null, sla_deadline: deadline,
  }).eq('id', submissionId).eq('appeal_status', 'none');
  if (error) return json({ error: 'appeal_failed' }, 500);
  await admin.from('moderation_queue').insert({
    queue_kind: 'appeal', reason, submission_id: submissionId,
  });
  await admin.from('verification_transitions').insert({
    actor_id: auth.user.id, actor_type: 'user', from_state: 'needs_review',
    submission_id: submissionId, to_state: 'appealed',
  });
  return json({ slaDeadline: deadline, status: 'appealed' }, 201);
});
