import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { buildProofSubmissionRecord, type ProofSubmissionInput } from '../_shared/proof-contract.ts';

const headers = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
};

const fixedChecklistHashes: Readonly<Record<string, string>> = Object.freeze({
  'daily-walk': 'dd3e268589f3e076f4cf504702fd4fbadfe825daa2424c57beddfdd288b6735f',
  'gym-checkin': '16c7a94773da3ef9bb3c15297e37ba3df4199b561753b651f920c99bf2718716',
  'morning-run': '196d5f3200138bf1e38e0a7b061ede0a5ca80744c1da89940152fcd0f0f2f4c6',
  'strength-basics': 'bee0979a722d9a464fb21b43095a0293ba2643a92b8fc49a9eab573c1a8a6d09',
  mobility: '5f8864667bd6ed2f272f5cf4cd43e875eec62ae231f32fa612af27ce3cf0aa61',
  'read-20': 'b0e3ed8d976c4af9916cb9ffc1a2710f4074dad0d1c969f430382a6677e6bcdc',
  'language-practice': '72d25fa69c54aadd6f8415ba1d6fa31272569dcd05ac9fceef400207708f57bd',
  'course-module': 'ac9d610eaba2c317f94e645605e0154c739dade72940df03ec07157cd35b8495',
  'daily-writing': '6cec935e8ee2daf2fda8169a6fd4a2ab134f86fd829e77da1936042da12e1388',
  'practice-instrument': '7fd95567e3a1c89f12d7cf77b32db6071aa961979e93a5d42bef8388ace8c0ef',
  'no-smoking': '3b5f863fcf9947989d2e24eb4e3f8690ec378d1b49edcf5e0047dd1f40c57b60',
  'no-alcohol-weekdays': '653bdd2ee9e3901204b94a0d33298301d62382469f063380033c1e36ce3b2ac7',
  'phone-curfew': '15b2e161711f501262ac93540b27eb9af422c949169c3fb3b534b71205203044',
  bedtime: 'ed492a595b01ca31879c612861ce167cc75fa00225a8e8b9c0a81652b6c5e017',
  'early-rise': '9987c85495c9115977b5243867513ab29b5d556fd79a0253d1643b6dade111f7',
  'deep-work': '155ba11c7a662c5709998d212ba41c6a2a24c603790167e994b2f8e1097394c0',
  'job-applications': '40ccec1dfd6a972a3ee03e5d1257399eb6a802a147a18c6c2b9ebc55f7f4da9d',
  'creative-hour': '48fbe0e154a0fda79bd2b2d5c25737eecc652cf80f57e63badb673538265ee9e',
  declutter: '912e7aff0ef71b3e768df68d5aec2f987d143235a4787fe674c8281f6664ce13',
  'side-project': '1b9547b433ac30ba3b22ec518fe799d38c3fc6c068b0b357240817afc18fb885',
});

async function checklistHash(criteria: readonly string[]) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(criteria)));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function response(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), { headers, status });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers });
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return response({ error: 'unauthorized' }, 401);

  const url = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const caller = createClient(url, anonKey, { global: { headers: { Authorization: authorization } } });
  const admin = createClient(url, serviceKey);
  const { data: auth, error: authError } = await caller.auth.getUser();
  if (authError || !auth.user) return response({ error: 'unauthorized' }, 401);

  const { data: allowed, error: rateError } = await admin.rpc('consume_proof_submission_rate_limit', {
    p_owner_id: auth.user.id,
    p_limit: 6,
    p_window_seconds: 60,
  });
  if (rateError) return response({ error: 'rate_limit_unavailable' }, 503);
  if (!allowed) return response({ error: 'rate_limited' }, 429);

  const input = await request.json().catch(() => null) as ProofSubmissionInput | null;
  if (!input) return response({ error: 'invalid_request' }, 400);
  const { data: commitment } = await admin
    .from('commitments')
    .select('id, owner_id, template_id, state')
    .eq('id', input.commitmentId)
    .eq('owner_id', auth.user.id)
    .eq('state', 'authorized')
    .maybeSingle();
  if (!commitment || commitment.template_id !== input.templateId) {
    return response({ error: 'active_commitment_required' }, 403);
  }

  // The fixed template checklist is server-owned. Until templates move to a
  // server table, the submitted snapshot is validated as non-empty and stored
  // byte-for-byte; the database keeps it immutable for later audit.
  if (!Array.isArray(input.criteriaSnapshot) || input.criteriaSnapshot.length === 0 ||
    input.criteriaSnapshot.some((item) => typeof item !== 'string' || item.length === 0)) {
    return response({ error: 'invalid_criteria' }, 400);
  }
  if (await checklistHash(input.criteriaSnapshot) !== fixedChecklistHashes[input.templateId]) {
    return response({ error: 'criteria_mismatch' }, 400);
  }

  let record;
  try {
    record = buildProofSubmissionRecord(input, auth.user.id, input.criteriaSnapshot);
  } catch {
    return response({ error: 'invalid_submission' }, 400);
  }

  const { data, error } = await admin
    .from('proof_submissions')
    .upsert(record, { onConflict: 'owner_id,client_submission_id', ignoreDuplicates: true })
    .select('id, submitted_at')
    .maybeSingle();
  if (error) return response({ error: 'submission_failed' }, 500);
  if (data) {
    const internalSecret = Deno.env.get('VERIFICATION_INTERNAL_SECRET');
    if (internalSecret) {
      EdgeRuntime.waitUntil(fetch(`${url}/functions/v1/ai-first-pass`, {
        body: JSON.stringify({
          submissionId: data.id,
        }),
        headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
        method: 'POST',
      }));
    }
    return response({ id: data.id, submittedAt: data.submitted_at, slaHours: 24 }, 201);
  }

  const { data: existing } = await admin
    .from('proof_submissions')
    .select('id, submitted_at')
    .eq('owner_id', auth.user.id)
    .eq('client_submission_id', input.clientSubmissionId)
    .single();
  return response({ id: existing.id, submittedAt: existing.submitted_at, slaHours: 24 }, 200);
});
