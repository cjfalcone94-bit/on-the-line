import { charities, findCharity } from '@/lib/commit/charities';
import { dollarsToCents, formatMoney, stakePresets } from '@/lib/commit/money';
declare const require: (name: string) => any;
const fs = require('fs');
const path = require('path');

describe('commit flow logic and persistence guardrails', () => {
  it('offers the category-anchored presets and validates custom amounts', () => {
    expect(stakePresets).toEqual([2000, 4000, 7500, 15000]);
    expect(dollarsToCents('$25.50')).toBe(2550);
    expect(dollarsToCents('4.99')).toBeUndefined();
    expect(dollarsToCents('1000.01')).toBeUndefined();
    expect(formatMoney(7500)).toBe('$75');
  });

  it('uses a short pre-declared charity list with stable destinations', () => {
    expect(charities).toHaveLength(5);
    expect(new Set(charities.map(({ id }) => id)).size).toBe(charities.length);
    expect(findCharity('direct-relief')?.category).toBe('Health');
  });

  it('migration is forced default-deny with owner-only select/insert and no update policy', () => {
    const sql = fs.readFileSync(path.join(process.cwd(), 'supabase/migrations/0002_commitments.sql'), 'utf8').toLowerCase();
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('force row level security');
    expect(sql).toContain('auth.uid()) = owner_id');
    expect(sql).toContain('commitments_select_own');
    expect(sql).toContain('commitments_insert_own');
    expect(sql).not.toMatch(/create policy "[^"]*update/);
    expect(sql).not.toMatch(/for update/);
  });

  it('maps each declared charity to a delivered category badge', () => {
    const source = fs.readFileSync(path.join(process.cwd(), 'components/commit.tsx'), 'utf8');
    for (const asset of ['health.png', 'education.png', 'animal-welfare.png', 'disaster-relief.png', 'community.png']) {
      expect(source).toContain(`charity-icons/${asset}`);
    }
    expect(source).not.toContain('HELD');
  });
});
