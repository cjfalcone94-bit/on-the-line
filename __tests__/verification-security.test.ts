import { readFileSync } from 'node:fs';

describe('server-only moderation storage', () => {
  const sql = readFileSync('supabase/migrations/0004_verification_pipeline.sql', 'utf8');

  it.each(['moderation_queue', 'moderation_decisions'])('%s is forced-RLS and inaccessible to anon/authenticated clients', (table) => {
    expect(sql).toContain(`alter table public.${table} enable row level security`);
    expect(sql).toContain(`alter table public.${table} force row level security`);
    expect(sql).toContain(`revoke all on public.${table} from public, anon, authenticated`);
    expect(sql).toContain(`grant all on public.${table} to service_role`);
    expect(sql).not.toMatch(new RegExp(`create policy[^;]+on public\\.${table}`, 'i'));
  });

  it('makes moderation decisions and state transitions append-only', () => {
    expect(sql).toContain('moderation_decisions_append_only');
    expect(sql).toContain('verification_transitions_append_only');
    expect(sql).toContain("raise exception 'verification logs are append-only'");
  });

  it('keeps the internal moderation surface role-gated and regular users forbidden', () => {
    const source = readFileSync('supabase/functions/moderate-verification/index.ts', 'utf8');
    expect(source).toContain("app_metadata?.role !== 'moderator'");
    expect(source).toContain("json({ error: 'forbidden' }, 403)");
  });

  it('keeps verification state read-only to owners', () => {
    expect(sql).not.toMatch(/create policy[^;]+on public\.proof_submissions[^;]+for update/i);
  });
});
