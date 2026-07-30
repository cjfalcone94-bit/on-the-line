import {
  authorizeOnly,
  writeAuthorizedCommitment,
  type AuthorizationIntent,
} from '../supabase/functions/_shared/authorization-contract';

const draft = {
  commitmentId: 'commitment-1',
  ownerId: 'owner-a',
  templateId: 'daily-walk',
  stakeCents: 4000,
  charityId: 'direct-relief',
  cadence: 'Daily · 30 days',
};

function authorizedIntent(overrides: Partial<AuthorizationIntent> = {}): AuthorizationIntent {
  return {
    id: 'pi_manual',
    amount: 4000,
    amountReceived: 0,
    captureMethod: 'manual',
    clientSecret: 'pi_secret',
    currency: 'usd',
    status: 'requires_capture',
    metadata: {
      owner_id: 'owner-a',
      template_id: 'daily-walk',
      charity_destination_id: 'direct-relief',
      cadence: 'Daily · 30 days',
      commitment_id: 'commitment-1',
    },
    ...overrides,
  };
}

describe('commit authorization contracts', () => {
  it('never charges on commit: manual authorization only and zero captured', async () => {
    const create = jest.fn(async (input) => authorizedIntent({
      captureMethod: input.captureMethod,
      amount: input.amount,
      metadata: input.metadata,
    }));
    const intent = await authorizeOnly({ create }, draft);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ captureMethod: 'manual' }));
    expect(intent.status).toBe('requires_capture');
    expect(intent.amountReceived).toBe(0);
    expect(create.mock.calls[0][0]).not.toHaveProperty('capture');
  });

  it('writes exactly one commitments row scoped to the authenticated owner', async () => {
    const insertExactlyOnce = jest.fn(async () => ({ id: 'commitment-1' }));
    await writeAuthorizedCommitment({ insertExactlyOnce }, authorizedIntent(), 'owner-a', new Date('2026-07-30T00:00:00Z'));

    expect(insertExactlyOnce).toHaveBeenCalledTimes(1);
    expect(insertExactlyOnce).toHaveBeenCalledWith(expect.objectContaining({
      owner_id: 'owner-a',
      processor_auth_reference: 'pi_manual',
      state: 'authorized',
    }));
  });

  it('stores the pre-declared charity in a frozen post-commit record', async () => {
    let written: Readonly<Record<string, unknown>> | undefined;
    await writeAuthorizedCommitment({
      insertExactlyOnce: async (record) => {
        written = record;
        return { id: 'commitment-1' };
      },
    }, authorizedIntent(), 'owner-a', new Date('2026-07-30T00:00:00Z'));

    expect(written?.charity_destination_id).toBe('direct-relief');
    expect(Object.isFrozen(written)).toBe(true);
  });

  it('refuses to write if any money was captured or the owner does not match', async () => {
    const insertExactlyOnce = jest.fn();
    await expect(writeAuthorizedCommitment(
      { insertExactlyOnce },
      authorizedIntent({ amountReceived: 4000 }),
      'owner-a',
      new Date(),
    )).rejects.toThrow('authorization_not_confirmed');
    await expect(writeAuthorizedCommitment(
      { insertExactlyOnce },
      authorizedIntent(),
      'owner-b',
      new Date(),
    )).rejects.toThrow('authorization_not_confirmed');
    expect(insertExactlyOnce).not.toHaveBeenCalled();
  });
});
