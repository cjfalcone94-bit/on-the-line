import type { SupabaseClient } from '@supabase/supabase-js';
import { track } from '@/lib/analytics';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { VerificationSubmission } from './types';

export async function getVerificationStatus(submissionId: string, client: SupabaseClient = getSupabaseClient()): Promise<VerificationSubmission> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');
  const { data, error } = await client
    .from('proof_submissions')
    .select('id, submitted_at, sla_deadline, verification_status, resolution_type, appeal_status')
    .eq('id', submissionId)
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
