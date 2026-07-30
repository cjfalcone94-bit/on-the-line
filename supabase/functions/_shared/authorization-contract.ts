export type AuthorizationDraft = {
  commitmentId: string;
  ownerId: string;
  templateId: string;
  stakeCents: number;
  charityId: string;
  cadence: string;
};

export type AuthorizationIntent = {
  id: string;
  clientSecret?: string | null;
  amount: number;
  amountReceived: number;
  captureMethod: string;
  currency: string;
  status: string;
  metadata: Record<string, string>;
};

export interface AuthorizationProcessor {
  create(input: {
    amount: number;
    captureMethod: 'manual';
    currency: 'usd';
    metadata: Record<string, string>;
    idempotencyKey: string;
  }): Promise<AuthorizationIntent>;
}

export interface CommitmentWriter {
  insertExactlyOnce(record: Readonly<Record<string, unknown>>): Promise<{
    id: string;
    authorizedAt?: string;
    authorizationExpiresAt?: string;
  }>;
}

export async function authorizeOnly(
  processor: AuthorizationProcessor,
  draft: AuthorizationDraft,
): Promise<AuthorizationIntent> {
  return processor.create({
    amount: draft.stakeCents,
    captureMethod: 'manual',
    currency: 'usd',
    idempotencyKey: `commitment:${draft.commitmentId}:stake-authorization:v1`,
    metadata: {
      owner_id: draft.ownerId,
      commitment_id: draft.commitmentId,
      template_id: draft.templateId,
      charity_destination_id: draft.charityId,
      cadence: draft.cadence,
      operation: 'authorize_only',
    },
  });
}

export async function writeAuthorizedCommitment(
  writer: CommitmentWriter,
  intent: AuthorizationIntent,
  ownerId: string,
  authorizedAt: Date,
): Promise<{ id: string; authorizedAt?: string; authorizationExpiresAt?: string }> {
  if (
    intent.status !== 'requires_capture' ||
    intent.captureMethod !== 'manual' ||
    intent.amountReceived !== 0 ||
    intent.metadata.owner_id !== ownerId
  ) throw new Error('authorization_not_confirmed');

  return writer.insertExactlyOnce(Object.freeze({
    id: intent.metadata.commitment_id,
    owner_id: ownerId,
    template_id: intent.metadata.template_id,
    stake_cents: intent.amount,
    currency: intent.currency,
    cadence: intent.metadata.cadence,
    charity_destination_id: intent.metadata.charity_destination_id,
    processor_auth_reference: intent.id,
    state: 'authorized',
    authorized_at: authorizedAt.toISOString(),
    authorization_expires_at: new Date(authorizedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }));
}
