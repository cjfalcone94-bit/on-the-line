import { readFileSync } from 'node:fs';
import {
  canAppeal,
  checkRateLimit,
  decideAiFirstPass,
  forfeitResolutionAt,
  slaResolutionAt,
} from '../supabase/functions/_shared/verification-contract';

describe('Sprint 5 verification trust contracts', () => {
  const deadline = '2026-07-30T12:00:00.000Z';
  const submission = { id: 'proof-1', resolvedAt: null, slaDeadline: deadline };

  it('SLA miss always auto-passes at the exact boundary, never before and never fails', () => {
    expect(slaResolutionAt(submission, new Date('2026-07-30T11:59:59.999Z'))).toBe('pending');
    expect(slaResolutionAt(submission, new Date(deadline))).toBe('sla_auto_pass');
    expect(slaResolutionAt(submission, new Date('2026-07-30T12:00:00.001Z'))).toBe('sla_auto_pass');
    expect([
      slaResolutionAt(submission, new Date(deadline)),
      slaResolutionAt(submission, new Date('2026-07-30T12:00:00.001Z')),
    ]).not.toContain('fail');
  });

  it('does not change an already resolved submission at the SLA boundary', () => {
    expect(slaResolutionAt({ ...submission, resolvedAt: deadline }, new Date(deadline))).toBe('pending');
  });

  it.each([
    { confidence: 0.99, criterionResults: [true, false], outcome: 'pass' as const },
    { confidence: 0.89, criterionResults: [true, true], outcome: 'pass' as const },
    { confidence: 0.2, criterionResults: [false, false], outcome: 'negative' as const },
    { confidence: 0.5, criterionResults: [true, false], outcome: 'uncertain' as const },
    { confidence: 0, criterionResults: [], outcome: 'error' as const },
  ])('AI $outcome never auto-fails and routes to a human', (result) => {
    expect(decideAiFirstPass(result)).toEqual(expect.objectContaining({ kind: 'enqueue_human' }));
  });

  it('allows AI only to pass when every fixed criterion clears at high confidence', () => {
    expect(decideAiFirstPass({ confidence: 0.95, criterionResults: [true, true], outcome: 'pass' }))
      .toEqual({ kind: 'pass', resolutionType: 'ai_pass' });
  });

  it('a human fail is appealable exactly once and hammering is rate limited', () => {
    expect(canAppeal({ appealStatus: 'none', verificationStatus: 'needs_review' })).toBe(true);
    expect(canAppeal({ appealStatus: 'pending', verificationStatus: 'needs_review' })).toBe(false);
    expect(checkRateLimit(3)).toBe(true);
    expect(checkRateLimit(4)).toBe(false);
  });

  it('SLA sweep can only write pass and uses a compare-and-set unresolved guard', () => {
    const source = readFileSync('supabase/functions/sla-sweep/index.ts', 'utf8');
    expect(source).toContain("resolution_type: 'sla_auto_pass'");
    expect(source).toContain("verification_status: 'passed'");
    expect(source).toContain(".is('resolved_at', null)");
    expect(source).not.toMatch(/verification_status:\s*['"]needs_review['"]/);
  });
});

describe('Sprint 8 unappealed-fail auto-forfeit closes the charity gap', () => {
  const deadline = '2026-07-30T12:00:00.000Z';
  const unappealedFail = {
    id: 'proof-1', resolutionType: 'human_fail', appealStatus: 'none', appealDeadline: deadline,
  };

  it('forfeits an unappealed human fail exactly once the appeal window elapses, never before', () => {
    expect(forfeitResolutionAt(unappealedFail, new Date('2026-07-30T11:59:59.999Z'))).toBe('pending');
    expect(forfeitResolutionAt(unappealedFail, new Date(deadline))).toBe('auto_forfeit');
    expect(forfeitResolutionAt(unappealedFail, new Date('2026-07-30T12:00:00.001Z'))).toBe('auto_forfeit');
  });

  it('never forfeits once the user has appealed: the appeal flow always wins', () => {
    expect(forfeitResolutionAt(
      { ...unappealedFail, appealStatus: 'pending' }, new Date('2026-08-30T00:00:00.000Z'),
    )).toBe('pending');
    expect(forfeitResolutionAt(
      { ...unappealedFail, appealStatus: 'resolved' }, new Date('2026-08-30T00:00:00.000Z'),
    )).toBe('pending');
  });

  it('only ever forfeits a human_fail, and only when a deadline was stamped', () => {
    expect(forfeitResolutionAt(
      { ...unappealedFail, resolutionType: 'human_pass' }, new Date('2026-08-30T00:00:00.000Z'),
    )).toBe('pending');
    expect(forfeitResolutionAt(
      { ...unappealedFail, appealDeadline: null }, new Date('2026-08-30T00:00:00.000Z'),
    )).toBe('pending');
  });

  it('moderate-verification stamps an appeal deadline on an initial fail but never charges immediately', () => {
    const source = readFileSync('supabase/functions/moderate-verification/index.ts', 'utf8');
    expect(source).toContain("decision === 'fail' && item.queue_kind !== 'appeal'");
    expect(source).toContain('appeal_deadline: appealDeadline');
    // Immediate charge stays gated to the appeal path only.
    expect(source).toContain("if (decision === 'fail' && item.queue_kind === 'appeal') await triggerSettlement('charge-on-fail'");
  });

  it('forfeit sweep resolves the appeal status then charges, guarded by a compare-and-set on appeal_status=none', () => {
    const source = readFileSync('supabase/functions/forfeit-sweep/index.ts', 'utf8');
    expect(source).toContain("get('FORFEIT_SWEEP_SECRET')");
    expect(source).toContain("appeal_status: 'resolved'");
    expect(source).toContain(".eq('appeal_status', 'none')");
    expect(source).toContain("'x-settlement-secret'");
    expect(source).toContain('charge-on-fail');
  });
});
