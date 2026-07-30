import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decideAiFirstPass, type AiFirstPassResult } from '../_shared/verification-contract.ts';

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
  if (request.headers.get('x-internal-secret') !== Deno.env.get('VERIFICATION_INTERNAL_SECRET')) {
    return json({ error: 'unauthorized' }, 401);
  }
  const { submissionId } = await request.json() as { submissionId: string };
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: submission } = await admin.from('proof_submissions')
    .select('id, storage_path, criteria_snapshot, verification_status, resolved_at')
    .eq('id', submissionId).is('resolved_at', null).maybeSingle();
  if (!submission) return json({ error: 'submission_not_pending' }, 409);

  let result: AiFirstPassResult = {
    confidence: 0, criterionResults: submission.criteria_snapshot.map(() => false), outcome: 'error',
  };
  try {
    const { data: signed } = await admin.storage.from('proof-photos').createSignedUrl(submission.storage_path, 60);
    const providerResponse = await fetch(Deno.env.get('MODERATION_AI_URL')!, {
      body: JSON.stringify({ criteria: submission.criteria_snapshot, imageUrl: signed?.signedUrl }),
      headers: {
        Authorization: `Bearer ${Deno.env.get('MODERATION_AI_KEY')!}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });
    if (providerResponse.ok) result = await providerResponse.json() as AiFirstPassResult;
  } catch {
    // Provider failure is deliberately treated as uncertain and sent to a human.
  }
  const action = decideAiFirstPass(result);
  if (action.kind === 'pass') {
    await admin.from('proof_submissions').update({
      resolution_type: 'ai_pass', resolved_at: new Date().toISOString(), verification_status: 'passed',
    }).eq('id', submissionId).is('resolved_at', null);
    await admin.from('verification_transitions').insert({
      actor_type: 'ai', from_state: submission.verification_status, resolution_type: 'ai_pass',
      submission_id: submissionId, to_state: 'passed',
    });
    await triggerRelease(submissionId);
    return json({ status: 'passed' });
  }

  await admin.from('proof_submissions').update({ verification_status: 'in_review' })
    .eq('id', submissionId).is('resolved_at', null);
  await admin.from('moderation_queue').insert({
    queue_kind: 'initial_review', reason: `ai_${action.reason}`, submission_id: submissionId,
  });
  await admin.from('verification_transitions').insert({
    actor_type: 'ai', from_state: submission.verification_status, submission_id: submissionId, to_state: 'in_review',
  });
  return json({ status: 'in_review' }, 202);
});
