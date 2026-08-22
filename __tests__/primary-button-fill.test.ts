import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { color } from '../design/tokens';

/**
 * Structural guard for the primary CTA's fill.
 *
 * Two rules are locked here, both bought with real defects:
 *
 * 1. The fill is GOLD (founder ruling 2026-08-20, DESIGN-DIRECTION.md §3 —
 *    the one filled gold surface permitted per screen).
 *
 * 2. The fill lives on an inner plain View, NEVER on the animated Pressable's
 *    callback style. InteractivePressable animates opacity + scale through
 *    useAnimatedStyle; a fill carried on that same callback style is exactly how
 *    builds 21-25 shipped an enabled CTA that rendered fully invisible while
 *    Maestro still tapped it by hidden testID
 *    (CALIBRATION-LOG defect `invisible-fill-animated-pressable`).
 *
 * Source-level rather than render-level on purpose: the defect was a *structural*
 * placement, and a render test that asserts a computed style would still pass if
 * the fill migrated back onto the animated node.
 */

const SOURCE = readFileSync(join(__dirname, '..', 'components', 'ui.tsx'), 'utf8');

function block(name: string): string {
  const start = SOURCE.indexOf(`export function ${name}(`);
  expect(start).toBeGreaterThan(-1);
  const next = SOURCE.indexOf('\nexport function ', start + 1);
  return SOURCE.slice(start, next === -1 ? SOURCE.length : next);
}

describe('PrimaryButton fill', () => {
  it('is gold, per the 2026-08-20 founder ruling', () => {
    expect(color.gold).toBe('#E8B91C'); // richer financial gold, founder ruling 2026-08-22
    expect(SOURCE).toMatch(/button:\s*\{[^}]*backgroundColor:\s*color\.gold/);
  });

  it('keeps a near-black label — never white-on-gold, which fails contrast', () => {
    expect(SOURCE).toMatch(/buttonLabel:\s*\{[^}]*color:\s*color\.surface/);
  });

  it('renders the fill on an inner View inside PrimaryButton', () => {
    const primary = block('PrimaryButton');
    // The surface must be applied to a <View>, not handed to InteractivePressable.
    expect(primary).toMatch(/<View style=\{\[styles\.button\b/);
    // Whatever the Pressable receives must carry no fill of its own.
    const styleProp = primary.slice(primary.indexOf('style='), primary.indexOf('>', primary.indexOf('style=')));
    expect(styleProp).not.toContain('styles.button');
    expect(styleProp).not.toContain('backgroundColor');
  });

  it('still dims to a non-gold surface when disabled', () => {
    // A disabled control must not read as the live primary action.
    expect(SOURCE).toMatch(/buttonDisabled:\s*\{[^}]*backgroundColor:\s*color\.surfaceRaised/);
    expect(block('PrimaryButton')).toContain('props.disabled && styles.buttonDisabled');
  });
});

describe('gold fill stays limited to the primary action', () => {
  it('is the only backgroundColor: color.gold in the shared UI kit', () => {
    // DESIGN-DIRECTION §3: exactly ONE filled gold surface per screen. Chips,
    // badges, rows, cards and celebration states keep line/type gold only.
    const fills = SOURCE.match(/backgroundColor:\s*color\.gold/g) ?? [];
    expect(fills).toHaveLength(1);
  });
});
