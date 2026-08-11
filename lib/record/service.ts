import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { CommitmentRecordItem } from './types';
import { env } from '@/lib/env';
import { getSandboxRecord } from '@/lib/sandbox/service';

const demoRecord: readonly CommitmentRecordItem[] = [
  { commitmentId: 'demo-success', templateId: 'daily-walk', outcome: 'success', stakeCents: 4000, charityId: 'fred-hollows', settledAt: '2026-07-30T12:00:00.000Z' },
  { commitmentId: 'demo-fail', templateId: 'read-20', outcome: 'forfeit', stakeCents: 2000, charityId: 'foodbank-au', settledAt: '2026-07-29T12:00:00.000Z' },
];

export async function getCommitmentRecord(client?: SupabaseClient): Promise<readonly CommitmentRecordItem[]> {
  if (env.sandbox) return getSandboxRecord();
  const demoRequested = typeof globalThis.location !== 'undefined'
    && (new URLSearchParams(globalThis.location.search).get('demo') === '1'
      || ['127.0.0.1', 'localhost'].includes(globalThis.location.hostname));
  if (demoRequested) return demoRecord;
  const activeClient = client ?? getSupabaseClient();
  const { data: auth, error: authError } = await activeClient.auth.getUser();
  if (authError || !auth.user) {
    if (__DEV__) return demoRecord;
    throw new Error('session_required');
  }
  const { data, error } = await activeClient
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
