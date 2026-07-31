import { color, haptics, motion, space, tabularNums, type } from '@/design/tokens';

describe('locked design tokens', () => {
  it('preserves the approved palette', () => {
    expect(color).toMatchObject({
      surface: '#0A0A0A',
      textPrimary: '#FFFFFF',
      gold: '#F5C518',
      clayRed: '#B5502D',
    });
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
