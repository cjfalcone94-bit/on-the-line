import type { ReceiptOutcome } from '@/lib/settlement/types';

export type CommitmentRecordItem = Readonly<{
  commitmentId: string;
  templateId: string;
  outcome: ReceiptOutcome;
  stakeCents: number;
  charityId: string;
  settledAt: string;
}>;
