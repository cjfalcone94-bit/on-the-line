export type ProofDraft = Readonly<{
  clientSubmissionId: string;
  commitmentId: string;
  templateId: string;
  photoUri: string;
  capturedAt: string;
  criteria: readonly string[];
}>;

export type QueuedProof = ProofDraft & Readonly<{
  queuedAt: string;
}>;

export type SubmissionResult = Readonly<{
  id: string;
  submittedAt: string;
  slaHours: number;
}>;

export function createProofDraft(input: Omit<ProofDraft, 'clientSubmissionId' | 'criteria'> & { criteria: readonly string[] }): ProofDraft {
  return Object.freeze({
    ...input,
    clientSubmissionId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    criteria: Object.freeze([...input.criteria]),
  });
}
