import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type } from '@/design/tokens';

const fontFiles = [
  'BricolageGrotesque-Regular.ttf',
  'BricolageGrotesque-SemiBold.ttf',
  'BricolageGrotesque-Bold.ttf',
  'HankenGrotesk-Regular.ttf',
  'HankenGrotesk-Medium.ttf',
  'HankenGrotesk-Bold.ttf',
] as const;

describe('locked brand font loading', () => {
  it.each(fontFiles)('bundles a non-empty real font file: %s', (file) => {
    const path = join(process.cwd(), 'assets/fonts', file);
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path).byteLength).toBeGreaterThan(20_000);
  });

  it('blocks the root layout on expo-font and registers every token family', () => {
    const root = readFileSync(join(process.cwd(), 'app/_layout.tsx'), 'utf8');
    expect(root).toContain('useFonts({');
    expect(root).toContain('if (!fontsLoaded) return null');
    Object.values(type.family).forEach((family) => expect(root).toContain(`'${family}'`));
  });

  it('ships only the six approved TTF faces and their OFL licenses', () => {
    const fontDirectory = join(process.cwd(), 'assets/fonts');
    expect(readdirSync(fontDirectory).sort()).toEqual([
      ...fontFiles,
      'OFL-BricolageGrotesque.txt',
      'OFL-HankenGrotesk.txt',
    ].sort());
  });
});
