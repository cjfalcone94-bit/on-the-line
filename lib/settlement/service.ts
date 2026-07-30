import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { GlassReceipt } from './types';

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
  client: SupabaseClient = getSupabaseClient(),
): Promise<GlassReceipt> {
  if (demoReceipts[commitmentId]) return demoReceipts[commitmentId];
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) throw new Error('session_required');
  const { data, error } = await client
    .from('glass_receipts')
    .select('id, commitment_id, outcome, stake_cents, base_fee_cents, success_fee_cents, charity_destination_id, processor_stake_reference, processor_transfer_reference, settled_at')
    .eq('commitment_id', commitmentId)
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
