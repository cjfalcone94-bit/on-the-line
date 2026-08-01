import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { GlassReceipt } from './types';
import { env } from '@/lib/env';
import { settleSandboxCommitment } from '@/lib/sandbox/service';

const demoReceipts: Record<string, GlassReceipt> = {
  'demo-success': {
    id: 'RCP-S7-SUCCESS', commitmentId: 'demo-success', outcome: 'success',
    stakeCents: 4000, baseFeeCents: 100, successFeeCents: 150,
    charityName: 'Direct Relief', transactionReference: 'AUTH-DEMO-RELEASED',
    routedReference: null, settledAt: '2026-07-30T12:00:00.000Z',
  },
  'demo-fail': {
    id: 'RCP-S7-FORFEIT', commitmentId: 'demo-fail', outcome: 'forfeit',
    stakeCents: 4000, baseFeeCents: 100, successFeeCents: 0,
    charityName: 'Direct Relief', transactionReference: 'CH-DEMO-4000',
    routedReference: 'TR-DEMO-CHARITY', settledAt: '2026-07-30T12:00:00.000Z',
  },
};

export async function getGlassReceipt(
  commitmentId: string,
  client?: SupabaseClient,
): Promise<GlassReceipt> {
  // Static web hosts can expose generated dynamic routes with an .html suffix.
  const webRouteCommitmentId = typeof globalThis.location !== 'undefined'
    ? globalThis.location.pathname.match(/\/settle\/([^/.]+)/)?.[1]
    : undefined;
  const normalizedCommitmentId = (webRouteCommitmentId ?? commitmentId).replace(/\.html$/, '');
  if (env.sandbox && normalizedCommitmentId.startsWith('sandbox-')) {
    return settleSandboxCommitment(normalizedCommitmentId);
  }
  if (demoReceipts[normalizedCommitmentId]) return demoReceipts[normalizedCommitmentId];
  const activeClient = client ?? getSupabaseClient();
  const { data: auth, error: authError } = await activeClient.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');
  const { data, error } = await activeClient
    .from('glass_receipts')
    .select('id, commitment_id, outcome, stake_cents, base_fee_cents, success_fee_cents, charity_destination_id, processor_stake_reference, processor_transfer_reference, settled_at')
    .eq('commitment_id', normalizedCommitmentId)
    .single();
  if (error || !data) throw new Error('receipt_unavailable');
  return {
    baseFeeCents: data.base_fee_cents, charityName: data.charity_destination_id,
    commitmentId: data.commitment_id, id: data.id, outcome: data.outcome,
    routedReference: data.processor_transfer_reference, settledAt: data.settled_at,
    stakeCents: data.stake_cents, successFeeCents: data.success_fee_cents,
    transactionReference: data.processor_stake_reference,
  } as GlassReceipt;
}
