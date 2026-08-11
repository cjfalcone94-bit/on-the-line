import {
  authorizeSandboxCommitment,
  clearSandboxCommitments,
  getSandboxRecord,
  resolveSandboxVerification,
  settleSandboxCommitment,
  submitSandboxProof,
} from '@/lib/sandbox/service';

describe('sandbox commitment journey', () => {
  beforeEach(async () => clearSandboxCommitments());

  it('completes commit → proof → verify → settle without Stripe or Supabase', async () => {
    const commitment = await authorizeSandboxCommitment({
      charityId: 'fred-hollows',
      outcome: 'success',
      stakeCents: 4000,
      templateId: 'daily-walk',
    });

    const proof = await submitSandboxProof(commitment.commitmentId);
    const verification = await resolveSandboxVerification(proof.id);
    const receipt = await settleSandboxCommitment(commitment.commitmentId);
    const record = await getSandboxRecord();

    expect(verification).toMatchObject({ resolutionType: 'human_pass', status: 'passed' });
    expect(receipt).toMatchObject({
      commitmentId: commitment.commitmentId,
      outcome: 'success',
      transactionReference: 'SANDBOX-NO-PAYMENT',
    });
    expect(record).toContainEqual(expect.objectContaining({
      commitmentId: commitment.commitmentId,
      outcome: 'success',
    }));
  });

  it('can resolve the visibly selected sandbox forfeit variant', async () => {
    const commitment = await authorizeSandboxCommitment({
      charityId: 'fred-hollows', outcome: 'forfeit', stakeCents: 2000, templateId: 'read-20',
    });
    const proof = await submitSandboxProof(commitment.commitmentId);
    expect(await resolveSandboxVerification(proof.id)).toMatchObject({ resolutionType: 'human_fail' });
    expect(await settleSandboxCommitment(commitment.commitmentId)).toMatchObject({
      outcome: 'forfeit', routedReference: 'SANDBOX-NO-TRANSFER', successFeeCents: 0,
    });
  });
});
