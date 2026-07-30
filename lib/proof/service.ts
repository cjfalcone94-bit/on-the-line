import type { SupabaseClient } from '@supabase/supabase-js';
import { track } from '@/lib/analytics';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { ProofDraft, SubmissionResult } from './types';

function extensionFor(uri: string) {
  const match = uri.toLowerCase().match(/\.(jpg|jpeg|png|heic)$/);
  return match?.[1] ?? 'jpg';
}

export async function submitProof(draft: ProofDraft, client: SupabaseClient = getSupabaseClient()): Promise<SubmissionResult> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');

  const extension = extensionFor(draft.photoUri);
  const storagePath = `${auth.user.id}/${draft.commitmentId}/${draft.clientSubmissionId}.${extension}`;
  const response = await fetch(draft.photoUri);
  if (!response.ok) throw new Error('photo_unavailable');
  const bytes = await response.arrayBuffer();
  const upload = await client.storage.from('proof-photos').upload(storagePath, bytes, {
    contentType: `image/${extension === 'jpg' ? 'jpeg' : extension}`,
    upsert: false,
  });
  if (upload.error && !upload.error.message.toLowerCase().includes('already exists')) {
    throw new Error('upload_failed');
  }

  const invoked = await client.functions.invoke('submit-proof', {
    body: {
      capturedAt: draft.capturedAt,
      clientSubmissionId: draft.clientSubmissionId,
      commitmentId: draft.commitmentId,
      criteriaSnapshot: [...draft.criteria],
      storagePath,
      templateId: draft.templateId,
    },
  });
  if (invoked.error) {
    const status = (invoked.error as { context?: { status?: number } }).context?.status;
    if (status === 429) throw new Error('rate_limited');
    throw new Error('submission_failed');
  }
  track('proof_submitted');
  return invoked.data as SubmissionResult;
}
