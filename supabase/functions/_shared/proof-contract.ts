export type ProofSubmissionInput = Readonly<{
  capturedAt: string;
  clientSubmissionId: string;
  commitmentId: string;
  criteriaSnapshot: readonly string[];
  storagePath: string;
  templateId: string;
}>;

export type ProofSubmissionRecord = Readonly<{
  captured_at: string;
  client_submission_id: string;
  commitment_id: string;
  criteria_snapshot: readonly string[];
  owner_id: string;
  storage_path: string;
  template_id: string;
}>;

export function buildProofSubmissionRecord(
  input: ProofSubmissionInput,
  authenticatedOwnerId: string,
  expectedCriteria: readonly string[],
): ProofSubmissionRecord {
  if (!input.storagePath.startsWith(`${authenticatedOwnerId}/`)) throw new Error('invalid_owner_path');
  if (input.criteriaSnapshot.length !== expectedCriteria.length ||
    input.criteriaSnapshot.some((criterion, index) => criterion !== expectedCriteria[index])) {
    throw new Error('criteria_mismatch');
  }
  const capturedAt = new Date(input.capturedAt);
  if (Number.isNaN(capturedAt.getTime())) throw new Error('invalid_capture_time');
  return Object.freeze({
    captured_at: capturedAt.toISOString(),
    client_submission_id: input.clientSubmissionId,
    commitment_id: input.commitmentId,
    criteria_snapshot: Object.freeze([...expectedCriteria]),
    owner_id: authenticatedOwnerId,
    storage_path: input.storagePath,
    template_id: input.templateId,
  });
}

export async function insertProofExactlyOnce(
  writer: { insert: (record: ProofSubmissionRecord) => Promise<{ id: string; submittedAt: string }> },
  record: ProofSubmissionRecord,
) {
  return writer.insert(record);
}
