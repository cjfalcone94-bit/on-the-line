import { createClient } from 'npm:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@18';
import { authorizeOnly, writeAuthorizedCommitment } from '../_shared/authorization-contract.ts';
import { BASE_FEE_CENTS } from '../_shared/settlement-contract.ts';

const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Origin': '*',
};

const charityIds = new Set([
  'direct-relief',
  'donorschoose',
  'best-friends',
  'team-rubicon',
  'feeding-america',
]);

const templateIds = new Set([
  'daily-walk', 'gym-checkin', 'morning-run', 'strength-basics', 'mobility',
  'read-20', 'language-practice', 'course-module', 'daily-writing', 'practice-instrument',
  'no-smoking', 'no-alcohol-weekdays', 'phone-curfew', 'bedtime', 'early-rise',
  'deep-work', 'job-applications', 'creative-hour', 'declutter', 'side-project',
]);

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    status,
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'method_not_allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return response({ error: 'authentication_required' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !stripeSecretKey) {
    return response({ error: 'server_not_configured' }, 503);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) return response({ error: 'authentication_required' }, 401);

  const stripe = new Stripe(stripeSecretKey);
  const body = await request.json().catch(() => null);
  if (!body || (body.action !== 'prepare' && body.action !== 'finalize')) {
    return response({ error: 'invalid_request' }, 400);
  }

  if (body.action === 'prepare') {
    const draft = body.draft;
    if (
      !draft ||
      !templateIds.has(draft.templateId) ||
      !charityIds.has(draft.charityId) ||
      !Number.isInteger(draft.stakeCents) ||
      draft.stakeCents < 500 ||
      draft.stakeCents > 100000 ||
      typeof draft.cadence !== 'string' ||
      draft.cadence.length > 80
    ) return response({ error: 'invalid_commitment' }, 400);

    const { data: allowed, error: rateError } = await createClient(supabaseUrl, serviceRoleKey)
      .rpc('consume_commitment_rate_limit', {
        p_limit: 5, p_operation: 'card_authorization', p_owner_id: user.id, p_window_seconds: 60,
      });
    if (rateError) return response({ error: 'rate_limit_unavailable' }, 503);
    if (!allowed) return response({ error: 'rate_limited' }, 429);
    const commitmentId = crypto.randomUUID();
    const intent = await authorizeOnly({
      create: async (input) => {
        const created = await stripe.paymentIntents.create({
          amount: input.amount,
          capture_method: input.captureMethod,
          currency: input.currency,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          metadata: input.metadata,
          setup_future_usage: 'off_session',
        }, { idempotencyKey: input.idempotencyKey });
        return {
          id: created.id,
          clientSecret: created.client_secret,
          amount: created.amount,
          amountReceived: created.amount_received,
          captureMethod: created.capture_method,
          currency: created.currency,
          status: created.status,
          metadata: created.metadata,
        };
      },
    }, {
      commitmentId,
      ownerId: user.id,
      templateId: draft.templateId,
      stakeCents: draft.stakeCents,
      charityId: draft.charityId,
      cadence: draft.cadence,
    });
    if (!intent.clientSecret) return response({ error: 'authorization_unavailable' }, 502);
    return response({ clientSecret: intent.clientSecret, paymentIntentId: intent.id });
  }

  if (typeof body.paymentIntentId !== 'string' || !body.paymentIntentId.startsWith('pi_')) {
    return response({ error: 'invalid_payment_intent' }, 400);
  }

  let intent;
  try {
    intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
  } catch {
    return response({ error: 'authorization_not_confirmed' }, 409);
  }
  if (!templateIds.has(intent.metadata.template_id) || !charityIds.has(intent.metadata.charity_destination_id)) {
    return response({ error: 'authorization_not_confirmed' }, 409);
  }

  const paymentMethod = typeof intent.payment_method === 'string' ? intent.payment_method : intent.payment_method?.id;
  if (!paymentMethod || !intent.metadata.commitment_id) return response({ error: 'authorization_not_confirmed' }, 409);
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
  const { data: allowed, error: rateError } = await admin.rpc('consume_commitment_rate_limit', {
    p_limit: 5, p_operation: 'commitment_create', p_owner_id: user.id, p_window_seconds: 60,
  });
  if (rateError) return response({ error: 'rate_limit_unavailable' }, 503);
  if (!allowed) return response({ error: 'rate_limited' }, 429);
  const authorizedAt = new Date();
  try {
    const result = await writeAuthorizedCommitment({
      insertExactlyOnce: async (record) => {
        const { data, error } = await admin
          .from('commitments')
          .upsert({
            ...record,
            base_fee_cents: BASE_FEE_CENTS,
            payment_method_reference: paymentMethod,
          }, { onConflict: 'processor_auth_reference', ignoreDuplicates: true })
          .select('id, authorized_at, authorization_expires_at')
          .maybeSingle();
        if (error) throw error;
        if (data) return { id: data.id, authorizedAt: data.authorized_at, authorizationExpiresAt: data.authorization_expires_at };

        const { data: existing, error: existingError } = await admin
          .from('commitments')
          .select('id, owner_id, authorized_at, authorization_expires_at')
          .eq('processor_auth_reference', intent.id)
          .single();
        if (existingError || existing.owner_id !== user.id) throw existingError ?? new Error('owner_mismatch');
        return { id: existing.id, authorizedAt: existing.authorized_at, authorizationExpiresAt: existing.authorization_expires_at };
      },
    }, {
      id: intent.id,
      amount: intent.amount,
      amountReceived: intent.amount_received,
      captureMethod: intent.capture_method,
      clientSecret: intent.client_secret,
      currency: intent.currency,
      status: intent.status,
      metadata: intent.metadata,
    }, user.id, authorizedAt);
    let baseFee;
    try {
      baseFee = await stripe.paymentIntents.create({
        amount: BASE_FEE_CENTS,
        confirm: true,
        currency: 'usd',
        metadata: {
          commitment_id: intent.metadata.commitment_id,
          fee_kind: 'base',
          operation: 'separate_platform_fee',
        },
        off_session: true,
        payment_method: paymentMethod,
      }, { idempotencyKey: `commitment:${intent.metadata.commitment_id}:base-fee:v1` });
    } catch {
      await stripe.paymentIntents.cancel(intent.id, {}, {
        idempotencyKey: `commitment:${intent.metadata.commitment_id}:base-fee-failed-release:v1`,
      }).catch(() => undefined);
      await admin.from('commitments').update({ state: 'voided' }).eq('id', result.id).eq('state', 'authorized');
      return response({ error: 'base_fee_failed' }, 402);
    }
    const { error: feeWriteError } = await admin.from('commitments')
      .update({ base_fee_reference: baseFee.id })
      .eq('id', result.id)
      .is('base_fee_reference', null);
    if (feeWriteError) return response({ error: 'commitment_write_retry' }, 503);
    return response({ commitmentId: result.id, authorizedAt: result.authorizedAt, authorizationExpiresAt: result.authorizationExpiresAt });
  } catch {
    return response({ error: 'commitment_write_failed' }, 409);
  }
});
