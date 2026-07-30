import { readFileSync } from 'node:fs';
import {
  buildProofSubmissionRecord,
  insertProofExactlyOnce,
} from '../supabase/functions/_shared/proof-contract';

const input = {
  capturedAt: '2026-07-30T12:00:00.000Z',
  clientSubmissionId: 'local-1',
  commitmentId: 'commitment-1',
  criteriaSnapshot: ['Photo shows the gym', 'Submit in this window'],
  storagePath: 'owner-a/commitment-1/local-1.jpg',
  templateId: 'gym-checkin',
};

describe('proof submission contract', () => {
  it('writes exactly one owner-scoped append-only row', async () => {
    const insert = jest.fn(async () => ({ id: 'proof-1', submittedAt: input.capturedAt }));
    const record = buildProofSubmissionRecord(input, 'owner-a', input.criteriaSnapshot);
    await insertProofExactlyOnce({ insert }, record);
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ owner_id: 'owner-a' }));
    expect(Object.isFrozen(record)).toBe(true);
  });

  it('locks the exact checklist snapshot and rejects another owner path', () => {
    const record = buildProofSubmissionRecord(input, 'owner-a', input.criteriaSnapshot);
    expect(record.criteria_snapshot).toEqual(input.criteriaSnapshot);
    expect(Object.isFrozen(record.criteria_snapshot)).toBe(true);
    expect(() => buildProofSubmissionRecord(
      { ...input, criteriaSnapshot: ['Edited criterion'] },
      'owner-a',
      input.criteriaSnapshot,
    )).toThrow('criteria_mismatch');
    expect(() => buildProofSubmissionRecord(input, 'owner-b', input.criteriaSnapshot)).toThrow('invalid_owner_path');
  });

  it('ships forced default-deny owner RLS with no update/delete policy', () => {
    const sql = readFileSync('supabase/migrations/0003_proof_submissions.sql', 'utf8');
    expect(sql).toContain('alter table public.proof_submissions enable row level security');
    expect(sql).toContain('alter table public.proof_submissions force row level security');
    expect(sql).toContain('(select auth.uid()) = owner_id');
    expect(sql).not.toMatch(/create policy "[^"]+"\s+on public\.proof_submissions\s+for (update|delete)/i);
    expect(sql).toContain("bucket_id = 'proof-photos'");
  });

  it('documents a server-only six-per-minute limiter and 429 response', () => {
    const sql = readFileSync('supabase/migrations/0003_proof_submissions.sql', 'utf8');
    const endpoint = readFileSync('supabase/functions/submit-proof/index.ts', 'utf8');
    expect(sql).toContain('revoke all on private_proof_rate_limits from anon, authenticated');
    expect(endpoint).toContain('p_limit: 6');
    expect(endpoint).toContain("response({ error: 'rate_limited' }, 429)");
  });
});
