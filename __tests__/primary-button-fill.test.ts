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
const PREMIUM = readFileSync(join(__dirname, '..', 'components', 'premium.tsx'), 'utf8');
const NEWLINE = String.fromCharCode(10); // avoids an escape the tooling keeps mangling

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

/**
 * The rule generalised. It was written for PrimaryButton, so when GoalCard was
 * added it put its whole surface — background, border, radius AND flexDirection —
 * on the animated Pressable's callback style. That callback never runs on the
 * animated component, so every card rendered as a bare vertical stack with no
 * surface at all. Device truth caught it; this test exists so the next component
 * does not have to be caught the same way.
 */
describe('no interactive surface rides the animated Pressable', () => {
  const componentBlocks = (source: string) => {
    const out: { name: string; body: string }[] = [];
    const re = /export function (\w+)\(/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(source))) {
      const start = m.index;
      const next = source.indexOf(NEWLINE + 'export function ', start + 1);
      out.push({ name: m[1], body: source.slice(start, next === -1 ? source.length : next) });
    }
    return out;
  };

  it.each([
    ['premium.tsx', () => PREMIUM],
    ['ui.tsx', () => SOURCE],
  ])('%s: no component passes a surface style into InteractivePressable', (_file, get) => {
    const offenders: string[] = [];
    for (const { name, body } of componentBlocks(get())) {
      if (!body.includes('<InteractivePressable')) continue;
      const open = body.indexOf('<InteractivePressable');
      const close = body.indexOf('>', open);
      const propsBlob = body.slice(open, close);
      // A surface handed to the Pressable as a callback style is dead code.
      if (/style=\{\(/.test(propsBlob) && /(backgroundColor|borderWidth|flexDirection)/.test(propsBlob)) {
        offenders.push(name);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('GoalCard paints its surface on an inner View', () => {
    const card = componentBlocks(PREMIUM).find((c) => c.name === 'GoalCard');
    expect(card).toBeDefined();
    expect(card!.body).toMatch(/<View style=\{\[styles\.goalCard/);
  });

  it('the goal card surface actually defines a row layout', () => {
    // The collapse was only visible because flexDirection went missing with the
    // rest of the surface. Assert the layout the card depends on.
    expect(PREMIUM).toMatch(/goalCard:\s*\{[^}]*flexDirection:\s*'row'/);
    expect(PREMIUM).toMatch(/goalCard:\s*\{[^}]*backgroundColor:\s*color\.surfaceRaised/);
  });
});

/**
 * Token hygiene. The design system is only auditable if the screens actually
 * read from it — a hardcoded hex is invisible to `design-conformance` and is how
 * a palette silently forks. tokens.ts is the ONE file allowed to name colours.
 */
describe('no colour is hardcoded outside the token file', () => {
  const HEX = /#[0-9A-Fa-f]{6}/g;
  it.each([
    ['components/premium.tsx', () => PREMIUM],
    ['components/ui.tsx', () => SOURCE],
  ])('%s names no raw hex', (_file, get) => {
    expect(get().match(HEX) ?? []).toEqual([]);
  });
});
