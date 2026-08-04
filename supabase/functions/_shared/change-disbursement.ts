// Change (getchange.io) disbursement API client + Supabase-backed disbursement store.
//
// Deno-only (uses Deno.env, global fetch, btoa) — excluded from the app tsconfig and
// asserted from tests via readFileSync, exactly like stripe-settlement.ts. The pure,
// jest-tested guard/contract lives in disbursement-contract.ts.
//
// Auth: HTTP Basic `CHANGE_PUBLIC_KEY:CHANGE_SECRET_KEY`.
// Endpoint: POST https://api.getchange.io/v1/donations
//   { amount(cents), nonprofit_id, funds_collected:true, external_id, currency }
// Money model: Change records a pledged donation immediately and invoices us monthly;
// the captured stake stays in our Stripe balance as a liability owed to charity until
// that invoice settles (see docs/CHARITY-DISBURSEMENT-PLAN.md §3.7).

import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import type {
  ChangeDonationClient,
  DisbursementRecord,
  DisbursementStore,
} from './disbursement-contract.ts';

const CHANGE_API_BASE = 'https://api.getchange.io';

function authHeader(): string {
  const publicKey = Deno.env.get('CHANGE_PUBLIC_KEY');
  const secretKey = Deno.env.get('CHANGE_SECRET_KEY');
  // Fail closed, mirroring the Stripe/Supabase `server_not_configured` discipline.
  if (!publicKey || !secretKey) throw new Error('server_not_configured');
  return 'Basic ' + btoa(`${publicKey}:${secretKey}`);
}

export function createChangeClient(): ChangeDonationClient {
  const auth = authHeader();
  return {
    async disburse(input) {
      const res = await fetch(`${CHANGE_API_BASE}/v1/donations`, {
        method: 'POST',
        headers: {
          'Authorization': auth,
          'Content-Type': 'application/json',
          // Best-effort native idempotency (undocumented at Change; harmless if ignored).
          // The durable external_id guard in disbursement-contract.ts is the real defense.
          'Idempotency-Key': input.idempotencyKey,
        },
        body: JSON.stringify({
          amount: input.amountCents,
          nonprofit_id: input.nonprofitId,
          funds_collected: true,
          external_id: input.externalId,
          currency: input.currency,
        }),
      });
      if (!res.ok) {
        const detail = await res.text().catch(() => '');
        throw new Error(`change_disburse_failed:${res.status}:${detail.slice(0, 240)}`);
      }
      const data = await res.json().catch(() => ({})) as Record<string, unknown>;
      const donation = (data.donation ?? data) as Record<string, unknown>;
      const id = donation.id;
      if (id === undefined || id === null) throw new Error('change_donation_id_missing');
      return { id: String(id), status: String(donation.status ?? 'pending') };
    },

    async findByExternalId(externalId) {
      try {
        const res = await fetch(
          `${CHANGE_API_BASE}/v1/donations?external_id=${encodeURIComponent(externalId)}`,
          { headers: { 'Authorization': auth } },
        );
        if (!res.ok) return null; // endpoint unsupported/unavailable → rely on local guard
        const data = await res.json().catch(() => null) as unknown;
        const list = Array.isArray(data)
          ? data
          : (data as Record<string, unknown> | null)?.donations ??
            (data as Record<string, unknown> | null)?.data ?? [];
        const match = (list as Array<Record<string, unknown>>).find((d) => d.external_id === externalId);
        return match ? { id: String(match.id), status: String(match.status ?? 'pending') } : null;
      } catch {
        return null;
      }
    },
  };
}

// Resolve a nonprofit id from an EIN (used at seed/backfill time, never invents ids).
export async function lookupNonprofit(ein: string): Promise<{ id: string; name: string } | null> {
  const res = await fetch(
    `${CHANGE_API_BASE}/v1/nonprofits?ein=${encodeURIComponent(ein)}`,
    { headers: { 'Authorization': authHeader() } },
  );
  if (!res.ok) return null;
  const data = await res.json().catch(() => null) as unknown;
  const list = Array.isArray(data)
    ? data
    : (data as Record<string, unknown> | null)?.nonprofits ??
      (data as Record<string, unknown> | null)?.data ?? [];
  const match = (list as Array<Record<string, unknown>>)[0];
  return match ? { id: String(match.id), name: String(match.name ?? '') } : null;
}

// Supabase-backed durable store for the C2/R3 guard (charity_disbursements table).
export function createDisbursementStore(admin: SupabaseClient): DisbursementStore {
  return {
    async get(commitmentId) {
      const { data } = await admin.from('charity_disbursements')
        .select('commitment_id, status, provider_donation_id')
        .eq('commitment_id', commitmentId).maybeSingle();
      if (!data) return null;
      return {
        commitmentId: data.commitment_id,
        status: data.status,
        providerDonationId: data.provider_donation_id ?? null,
      } as DisbursementRecord;
    },
    async upsertPending(input) {
      // ignoreDuplicates: never downgrade an existing succeeded/failed row to pending.
      await admin.from('charity_disbursements').upsert({
        commitment_id: input.commitmentId,
        owner_id: input.ownerId,
        nonprofit_id: input.nonprofitId,
        charity_destination_id: input.charityDestinationId,
        amount_cents: input.amountCents,
        currency: input.currency,
        external_id: input.externalId,
        provider: 'change',
        status: 'pending',
      }, { onConflict: 'commitment_id', ignoreDuplicates: true });
    },
    async markSucceeded(commitmentId, providerDonationId, status) {
      await admin.from('charity_disbursements').update({
        status: 'succeeded',
        provider_donation_id: providerDonationId,
        provider_status: status,
        last_error: null,
        updated_at: new Date().toISOString(),
      }).eq('commitment_id', commitmentId);
    },
    async markFailed(commitmentId, error) {
      // Compare-and-set: only a still-pending row degrades to failed, so a webhook that
      // already confirmed success is never clobbered by a late failure write.
      await admin.rpc('mark_disbursement_failed', {
        p_commitment_id: commitmentId,
        p_error: error.slice(0, 500),
      });
    },
  };
}
