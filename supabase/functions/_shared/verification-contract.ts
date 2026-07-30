export const SLA_HOURS = 24;

export type AiFirstPassResult = Readonly<{
  outcome: 'pass' | 'uncertain' | 'negative' | 'error';
  confidence: number;
  criterionResults: readonly boolean[];
}>;

export type VerificationAction =
  | Readonly<{ kind: 'pass'; resolutionType: 'ai_pass' }>
  | Readonly<{ kind: 'enqueue_human'; reason: 'uncertain' | 'negative' | 'error' }>;

export function decideAiFirstPass(result: AiFirstPassResult): VerificationAction {
  if (result.outcome === 'pass' && result.confidence >= 0.9 && result.criterionResults.every(Boolean)) {
    return Object.freeze({ kind: 'pass', resolutionType: 'ai_pass' });
  }
  return Object.freeze({
    kind: 'enqueue_human',
    reason: result.outcome === 'pass' ? 'uncertain' : result.outcome,
  });
}

export type SweepSubmission = Readonly<{
  id: string;
  slaDeadline: string;
  resolvedAt: string | null;
}>;

export function slaResolutionAt(submission: SweepSubmission, now: Date): 'pending' | 'sla_auto_pass' {
  if (submission.resolvedAt) return 'pending';
  return now.getTime() >= new Date(submission.slaDeadline).getTime() ? 'sla_auto_pass' : 'pending';
}

export type AppealState = Readonly<{
  verificationStatus: string;
  appealStatus: string;
}>;

export function canAppeal(state: AppealState): boolean {
  return state.verificationStatus === 'needs_review' && state.appealStatus === 'none';
}

export function checkRateLimit(hits: number, limit = 3): boolean {
  return hits <= limit;
}
