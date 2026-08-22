import { color, haptics, motion, space, tabularNums, type } from '@/design/tokens';

describe('locked design tokens', () => {
  it('preserves the approved palette', () => {
    // Founder ruling 2026-08-22 (premium refactor): layered near-blacks rather
    // than one flat black, off-white instead of stark #FFF, and a richer
    // financial gold in place of the previous bright warning-yellow #F5C518.
    // DESIGN-DIRECTION.md §3 changelog + 05-STACK.md deviation log.
    expect(color).toMatchObject({
      surface: '#080808',
      surfaceRaised: '#111111',
      textPrimary: '#F5F5F3',
      textSecondary: '#A4A4A0',
      textTertiary: '#70706C',
      gold: '#E8B91C',
      clayRed: '#B5502D',
    });
  });

  it('keeps the surface ramp ordered from deepest to most raised', () => {
    // Depth is built from surface steps, never shadow. If the ramp ever stops
    // ascending, cards stop reading as elevated and the whole system flattens.
    const luminance = (hex: string) => parseInt(hex.slice(1, 3), 16);
    expect(luminance(color.surfaceDeep)).toBeLessThan(luminance(color.surface));
    expect(luminance(color.surface)).toBeLessThan(luminance(color.surfaceRaised));
    expect(luminance(color.surfaceRaised)).toBeLessThan(luminance(color.surfaceElevated));
    expect(luminance(color.surfaceElevated)).toBeLessThan(luminance(color.surfaceInteractive));
  });

  it('keeps text legible against the ground', () => {
    // Tertiary is the quietest text in the system; if it ever drops below the
    // border colour it stops being readable and becomes decoration.
    const luminance = (hex: string) => parseInt(hex.slice(1, 3), 16);
    expect(luminance(color.textTertiary)).toBeGreaterThan(luminance(color.stroke));
    expect(luminance(color.textSecondary)).toBeGreaterThan(luminance(color.textTertiary));
    expect(luminance(color.textPrimary)).toBeGreaterThan(luminance(color.textSecondary));
  });

  it('defines type, spacing, motion, and haptic foundations', () => {
    expect(type.size.display).toBe(34);
    expect(space.ledgerLine).toBe(12);
    expect(motion.duration).toEqual({ fast: 150, standard: 250, emphasized: 400 });
    expect(haptics.none).toBeNull();
    expect(type.family.display).toBe('BricolageGrotesque-SemiBold');
    expect(type.family.figure).toBe('HankenGrotesk-Regular');
    expect(tabularNums.fontVariant).toEqual(['tabular-nums', 'lining-nums']);
  });
});
