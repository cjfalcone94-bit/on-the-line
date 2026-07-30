export type ReceiptOutcome = 'success' | 'forfeit';

export type GlassReceipt = Readonly<{
  id: string;
  commitmentId: string;
  outcome: ReceiptOutcome;
  stakeCents: number;
  baseFeeCents: number;
  successFeeCents: number;
  charityName: string;
  transactionReference: string;
  routedReference: string | null;
  settledAt: string;
}>;
