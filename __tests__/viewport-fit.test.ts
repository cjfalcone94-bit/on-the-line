import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { referenceViewport } from '@/lib/ui/viewport';
import { type } from '@/design/tokens';

describe('iPhone SE fixed-flow viewport contract', () => {
  it('uses the requested 375x667 reference and supports large type', () => {
    expect(referenceViewport).toEqual({ height: 667, safeAreaReserve: 40, width: 375 });
    expect(type.maxScale).toBeGreaterThanOrEqual(1.35);
  });

  it.each([
    'screens/TrustScreen.tsx',
    'screens/CatalogScreen.tsx',
    'app/template/[templateId].tsx',
    'app/commit/[templateId].tsx',
    'app/proof/[commitmentId].tsx',
    'app/verify/[submissionId].tsx',
    'app/settle/[commitmentId].tsx',
    'app/record.tsx',
    'app/settings.tsx',
  ])('%s uses the shared overflow-safe scaffold', (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
    expect(source).toContain('ScreenScaffold');
    expect(source).not.toContain('<SafeAreaView');
  });

  it('defines the class-level safe-area, flexGrow scroll, and pinned-footer contract once', () => {
    const source = readFileSync(join(process.cwd(), 'components/ScreenScaffold.tsx'), 'utf8');
    // Regression guard (build 21 defect): the deprecated native SafeAreaView
    // dropped the top inset on device, rendering every screen under the notch.
    // The scaffold must derive real insets from useSafeAreaInsets instead.
    expect(source).toContain('useSafeAreaInsets');
    expect(source).not.toContain('<SafeAreaView');
    // Robust top inset: never trust safe-area-context alone (returned 0 on
    // device in builds 21-22). Constants.statusBarHeight is the always-present floor.
    expect(source).toContain('Constants.statusBarHeight');
    expect(source).toMatch(/Math\.max\(insets\.top/);
    expect(source).toContain('paddingTop: topInset');
    expect(source).toContain('paddingBottom: insets.bottom');
    expect(source).toMatch(/contentContainer: \{ flexGrow: 1/);
    expect(source).toContain('testID="screen-scaffold-footer"');
    expect(source.indexOf('<ScrollView')).toBeLessThan(source.indexOf('{footer ?'));
  });

  it('puts hero breathing room on ScreenHeader so it is consistent in every scaffold slot', () => {
    // Builds 22-24 defect: 48pt hero spacing lived on the scaffold content, so
    // screens that render their hero in the FIXED header slot (e.g. catalog) got
    // only the small nav pad and looked cramped, while scroll-content heroes got
    // the full breathing room. Attaching it to ScreenHeader makes it uniform.
    const source = readFileSync(join(process.cwd(), 'components/ui.tsx'), 'utf8');
    const headerBlock = source.slice(source.indexOf('header: {'), source.indexOf('header: {') + 120);
    expect(headerBlock).toContain("marginTop: space['2xl']");
  });

  it.each([
    'screens/TrustScreen.tsx',
    'app/template/[templateId].tsx',
    'app/commit/[templateId].tsx',
    'app/proof/[commitmentId].tsx',
    'app/verify/[submissionId].tsx',
    'app/settle/[commitmentId].tsx',
  ])('%s puts its primary action in the scaffold footer', (relativePath) => {
    const source = readFileSync(join(process.cwd(), relativePath), 'utf8');
    expect(source).toMatch(/footer=\{/);
  });

  it('paginates the formerly six-row charity choice into three-row pages', () => {
    const source = readFileSync(join(process.cwd(), 'app/commit/[templateId].tsx'), 'utf8');
    expect(source).toContain('slice(charityPage * 3, charityPage * 3 + 3)');
  });
});
