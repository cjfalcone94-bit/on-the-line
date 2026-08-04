// Pure, processor-agnostic contract for the charity-disbursement leg (Change).
//
// This module holds the money-safety guard for C2 (stranded money) and R3 (Change's
// idempotency is undocumented): a forfeited stake is captured on Stripe FIRST, so by
// the time we call Change the money is already ours and OWED to charity. We must never
// silently keep it and never double-donate on a retry. The guard therefore:
//   - reads a durable per-commitment disbursement row before acting;
//   - short-circuits if a prior attempt already succeeded (no second donation);
//   - writes a `pending` row BEFORE calling Change (external_id = commitmentId), so a
//     crash between call and bookkeeping is recoverable;
//   - best-effort remote lookup by external_id to catch "Change created it but our
//     write failed" before creating a duplicate;
//   - on failure, marks the row `failed` with the error and rethrows, leaving the
//     captured stake tracked as owed so the settlement sweep can retry it.
//
// It is intentionally free of Deno/npm imports so it can be unit-tested under jest,
// mirroring settlement-contract.ts.

export type DisbursementStatus = 'pending' | 'succeeded' | 'failed';

export type DisbursementRecord = Readonly<{
  commitmentId: string;
  status: DisbursementStatus;
  providerDonationId: string | null;
}>;

export interface ChangeDonationClient {
  disburse(input: {
    nonprofitId: string;
    amountCents: number;
    currency: 'usd';
    externalId: string;
    idempotencyKey: string;
  }): Promise<{ id: string; status: string }>;
  // Optional best-effort remote dedupe. Change's list-by-external_id support is
  // undocumented; when absent the guard falls back to its durable local row only.
  findByExternalId?(externalId: string): Promise<{ id: string; status: string } | null>;
}

export interface DisbursementStore {
  get(commitmentId: string): Promise<DisbursementRecord | null>;
  upsertPending(input: {
    commitmentId: string;
    ownerId: string;
    nonprofitId: string;
    charityDestinationId: string;
    amountCents: number;
    currency: 'usd';
    externalId: string;
  }): Promise<void>;
  markSucceeded(commitmentId: string, providerDonationId: string, status: string): Promise<void>;
  markFailed(commitmentId: string, error: string): Promise<void>;
}

export type DisburseGuardInput = Readonly<{
  commitmentId: string;
  ownerId: string;
  nonprofitId: string;
  charityDestinationId: string;
  amountCents: number;
  currency: 'usd';
  externalId: string;
  idempotencyKey: string;
}>;

export type DisburseGuardResult = Readonly<{ id: string; status: string; reused: boolean }>;

export async function disburseWithGuard(
  client: ChangeDonationClient,
  store: DisbursementStore,
  input: DisburseGuardInput,
): Promise<DisburseGuardResult> {
  const existing = await store.get(input.commitmentId);
  if (existing && existing.status === 'succeeded' && existing.providerDonationId) {
    return Object.freeze({ id: existing.providerDonationId, status: 'succeeded', reused: true });
  }

  await store.upsertPending({
    commitmentId: input.commitmentId,
    ownerId: input.ownerId,
    nonprofitId: input.nonprofitId,
    charityDestinationId: input.charityDestinationId,
    amountCents: input.amountCents,
    currency: input.currency,
    externalId: input.externalId,
  });

  // If a previous attempt may have created the donation at Change before our
  // bookkeeping landed, adopt it instead of creating a duplicate.
  if (client.findByExternalId) {
    const found = await client.findByExternalId(input.externalId);
    if (found) {
      await store.markSucceeded(input.commitmentId, found.id, found.status);
      return Object.freeze({ id: found.id, status: found.status, reused: true });
    }
  }

  try {
    const donation = await client.disburse({
      nonprofitId: input.nonprofitId,
      amountCents: input.amountCents,
      currency: input.currency,
      externalId: input.externalId,
      idempotencyKey: input.idempotencyKey,
    });
    await store.markSucceeded(input.commitmentId, donation.id, donation.status);
    return Object.freeze({ id: donation.id, status: donation.status, reused: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await store.markFailed(input.commitmentId, message);
    throw err instanceof Error ? err : new Error(message);
  }
}
