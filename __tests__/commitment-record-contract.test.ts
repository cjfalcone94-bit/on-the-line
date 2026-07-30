import fs from 'node:fs';
import path from 'node:path';

const root = path.join(__dirname, '..');
const migration = fs.readFileSync(path.join(root, 'supabase/migrations/0005_payments_custody.sql'), 'utf8');
const recordMigration = fs.readFileSync(path.join(root, 'supabase/migrations/0006_commitment_record_recommit.sql'), 'utf8');
const handler = fs.readFileSync(path.join(root, 'supabase/functions/_shared/settlement-handler.ts'), 'utf8');

describe('Commitment Record security and recovery contract', () => {
  it('re-confirms cross-user isolation for the real UI table', () => {
    expect(migration).toContain('alter table public.commitment_record force row level security');
    expect(migration).toMatch(/create policy "commitment_record_select_own"[\s\S]*auth\.uid\(\)\) = owner_id/);
    expect(migration).not.toMatch(/commitment_record[\s\S]*for (insert|update|delete) to authenticated/i);
  });

  it('keeps receipts account-owned and read-only to clients', () => {
    expect(migration).toContain('alter table public.glass_receipts force row level security');
    expect(migration).toMatch(/create policy "glass_receipts_select_own"[\s\S]*auth\.uid\(\)\) = owner_id/);
  });

  it('persists and backfills template identity for new-device re-commit', () => {
    expect(recordMigration).toContain('add column template_id text');
    expect(recordMigration).toContain('alter column template_id set not null');
    expect(handler).toContain('template_id: row.template_id');
  });
});
