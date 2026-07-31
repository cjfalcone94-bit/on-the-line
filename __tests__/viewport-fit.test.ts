import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { availableContentHeight, referenceViewport, totalBudget, viewportBudgets } from '@/lib/ui/viewport';
import { type } from '@/design/tokens';

describe('iPhone SE fixed-flow viewport contract', () => {
  it('uses the requested 375x667 reference and supports large type', () => {
    expect(referenceViewport).toEqual({ height: 667, safeAreaReserve: 40, width: 375 });
    expect(type.maxScale).toBeGreaterThanOrEqual(1.35);
  });

  it.each(Object.entries(viewportBudgets))('%s stays within the safe-area-adjusted height', (_screen, parts) => {
    expect(totalBudget(parts)).toBeLessThanOrEqual(availableContentHeight);
  });

  it.each([
    'screens/TrustScreen.tsx',
    'app/template/[templateId].tsx',
    'app/commit/[templateId].tsx',
    'app/proof/[commitmentId].tsx',
    'app/verify/[submissionId].tsx',
    'app/settle/[commitmentId].tsx',
  ])('%s selects compact layout on the SE without adding a ScrollView', (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
    expect(source).toContain('height <= 700');
    expect(source).not.toMatch(/\bScrollView\b/);
  });

  it('paginates the formerly six-row charity choice into three-row pages', () => {
    const source = readFileSync(join(process.cwd(), 'app/commit/[templateId].tsx'), 'utf8');
    expect(source).toContain('slice(charityPage * 3, charityPage * 3 + 3)');
  });
});
