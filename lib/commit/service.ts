import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';

export type CommitmentDraft = Readonly<{
  templateId: string;
  stakeCents: number;
  charityId: string;
  cadence: string;
}>;

type PrepareResponse = { clientSecret: string; paymentIntentId: string };
type FinalizeResponse = { commitmentId: string; authorizedAt: string; authorizationExpiresAt: string };

async function invoke<T>(
  action: 'prepare' | 'finalize',
  body: Record<string, unknown>,
  client: SupabaseClient = getSupabaseClient(),
): Promise<T> {
  const { data, error } = await client.functions.invoke('create-commitment-authorization', {
    body: { action, ...body },
  });
  if (error) throw new Error('We could not authorize your card. Nothing was charged. Please try again.');
  return data as T;
}

export function prepareAuthorization(draft: CommitmentDraft, client?: SupabaseClient) {
  return invoke<PrepareResponse>('prepare', { draft }, client);
}

export function finalizeCommitment(paymentIntentId: string, client?: SupabaseClient) {
  return invoke<FinalizeResponse>('finalize', { paymentIntentId }, client);
}
