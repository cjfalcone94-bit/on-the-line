import AsyncStorage from '@react-native-async-storage/async-storage';
import { findCharity } from '@/lib/commit/charities';
import type { SubmissionResult } from '@/lib/proof/types';
import type { CommitmentRecordItem } from '@/lib/record/types';
import type { GlassReceipt, ReceiptOutcome } from '@/lib/settlement/types';
import type { VerificationSubmission } from '@/lib/verification/types';

const STORAGE_KEY = 'on-the-line:sandbox-commitments:v1';

export type SandboxCommitment = Readonly<{
  charityId: string;
  commitmentId: string;
  createdAt: string;
  outcome: ReceiptOutcome;
  settledAt?: string;
  stakeCents: number;
  submissionId?: string;
  templateId: string;
}>;

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function readAll(): Promise<SandboxCommitment[]> {
  const stored = await AsyncStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(items: readonly SandboxCommitment[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export async function authorizeSandboxCommitment(input: {
  charityId: string; outcome: ReceiptOutcome; stakeCents: number; templateId: string;
}): Promise<SandboxCommitment> {
  await wait(650);
  const createdAt = new Date().toISOString();
  const item: SandboxCommitment = {
    ...input,
    commitmentId: `sandbox-${Date.now()}`,
    createdAt,
  };
  const existing = await readAll();
  await writeAll([item, ...existing]);
  return item;
}

export async function submitSandboxProof(commitmentId: string): Promise<SubmissionResult> {
  await wait(550);
  const items = await readAll();
  const index = items.findIndex((item) => item.commitmentId === commitmentId);
  if (index < 0) throw new Error('sandbox_commitment_missing');
  const submittedAt = new Date().toISOString();
  const submissionId = `sandbox-submission-${commitmentId}`;
  items[index] = { ...items[index], submissionId };
  await writeAll(items);
  return { id: submissionId, slaHours: 24, submittedAt };
}

export async function resolveSandboxVerification(submissionId: string): Promise<VerificationSubmission> {
  await wait(450);
  const item = (await readAll()).find((candidate) => candidate.submissionId === submissionId);
  if (!item) throw new Error('sandbox_submission_missing');
  const submittedAt = item.createdAt;
  return {
    appealAllowed: false,
    id: submissionId,
    resolutionType: item.outcome === 'success' ? 'human_pass' : 'human_fail',
    slaDeadline: new Date(new Date(submittedAt).getTime() + 24 * 60 * 60 * 1000).toISOString(),
    status: item.outcome === 'success' ? 'passed' : 'needs_review',
    submittedAt,
  };
}

export async function settleSandboxCommitment(commitmentId: string): Promise<GlassReceipt> {
  await wait(450);
  const items = await readAll();
  const index = items.findIndex((item) => item.commitmentId === commitmentId);
  if (index < 0) throw new Error('sandbox_commitment_missing');
  const settledAt = items[index].settledAt ?? new Date().toISOString();
  const item = { ...items[index], settledAt };
  items[index] = item;
  await writeAll(items);
  const charityName = findCharity(item.charityId)?.name ?? item.charityId;
  return {
    baseFeeCents: 0,
    charityName,
    commitmentId,
    id: `SBX-${commitmentId}`,
    outcome: item.outcome,
    routedReference: item.outcome === 'forfeit' ? 'SANDBOX-NO-TRANSFER' : null,
    settledAt,
    stakeCents: item.stakeCents,
    successFeeCents: 0,
    transactionReference: 'SANDBOX-NO-PAYMENT',
  };
}

export async function getSandboxRecord(): Promise<readonly CommitmentRecordItem[]> {
  return (await readAll())
    .filter((item) => Boolean(item.settledAt))
    .map((item) => ({
      charityId: item.charityId,
      commitmentId: item.commitmentId,
      outcome: item.outcome,
      settledAt: item.settledAt!,
      stakeCents: item.stakeCents,
      templateId: item.templateId,
    }));
}

export async function clearSandboxCommitments() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
