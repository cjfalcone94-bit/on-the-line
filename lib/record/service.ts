import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CommitmentRecordItem } from './types';

const demoRecord: readonly CommitmentRecordItem[] = [
  { commitmentId: 'demo-success', templateId: 'daily-walk', outcome: 'success', stakeCents: 4000, charityId: 'direct-relief', settledAt: '2026-07-30T12:00:00.000Z' },
  { commitmentId: 'demo-fail', templateId: 'read-20', outcome: 'forfeit', stakeCents: 2000, charityId: 'feeding-america', settledAt: '2026-07-29T12:00:00.000Z' },
];

export async function getCommitmentRecord(client: SupabaseClient = getSupabaseClient()): Promise<readonly CommitmentRecordItem[]> {
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) {
    if (__DEV__) return demoRecord;
    throw new Error('session_required');
  }
  const { data, error } = await client
    .from('commitment_record')
    .select('commitment_id, template_id, outcome, stake_cents, charity_destination_id, settled_at')
    .order('settled_at', { ascending: false });
  if (error) throw new Error('record_unavailable');
  return (data ?? []).map((item) => ({
    charityId: item.charity_destination_id,
    commitmentId: item.commitment_id,
    outcome: item.outcome,
    settledAt: item.settled_at,
    stakeCents: item.stake_cents,
    templateId: item.template_id,
  })) as CommitmentRecordItem[];
}

export const demoCommitmentRecord = demoRecord;
