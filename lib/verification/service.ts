import type { SupabaseClient } from '@supabase/supabase-js';
import { track } from '@/lib/analytics';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { VerificationSubmission } from './types';
import { env } from '@/lib/env';
import { resolveSandboxVerification } from '@/lib/sandbox/service';

const demoSubmissions: Record<string, VerificationSubmission> = {
  'demo-passed': {
    appealAllowed: false,
    id: 'demo-passed',
    resolutionType: 'human_pass',
    slaDeadline: '2026-08-01T12:00:00.000Z',
    status: 'passed',
    submittedAt: '2026-07-31T12:00:00.000Z',
  },
};

export async function getVerificationStatus(submissionId: string, client?: SupabaseClient): Promise<VerificationSubmission> {
  const normalizedSubmissionId = submissionId.replace(/\.html$/, '');
  if (env.sandbox && normalizedSubmissionId.startsWith('sandbox-submission-')) {
    return resolveSandboxVerification(normalizedSubmissionId);
  }
  if (demoSubmissions[normalizedSubmissionId]) return demoSubmissions[normalizedSubmissionId];
  const activeClient = client ?? getSupabaseClient();
  const { data: auth, error: authError } = await activeClient.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');
  const { data, error } = await activeClient
    .from('proof_submissions')
    .select('id, submitted_at, sla_deadline, verification_status, resolution_type, appeal_status')
    .eq('id', normalizedSubmissionId)
    .single();
  if (error || !data) throw new Error('status_unavailable');
  if (data.resolution_type) {
    track('verification_resolved', { resolution_type: data.resolution_type });
  }
  return {
    appealAllowed: data.verification_status === 'needs_review' && data.appeal_status === 'none',
    id: data.id,
    resolutionType: data.resolution_type,
    slaDeadline: data.sla_deadline,
    status: data.appeal_status === 'pending' ? 'appealed' : data.verification_status,
    submittedAt: data.submitted_at,
  } as VerificationSubmission;
}

export async function appealVerification(submissionId: string, reason: string, client: SupabaseClient = getSupabaseClient()): Promise<void> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');
  const { error } = await client.functions.invoke('appeal-verification', { body: { reason, submissionId } });
  if (error) {
    const status = (error as { context?: { status?: number } }).context?.status;
    if (status === 429) throw new Error('rate_limited');
    throw new Error('appeal_failed');
  }
  track('appeal_submitted');
}
