import type { TextStyle } from 'react-native';

/**
 * Design tokens — the single source of truth for On the Line's visual system,
 * generated from the LOCKED `docs/DESIGN-DIRECTION.md` (§3-6, palette locked
 * 2026-07-30 — "full dark, disciplined"). Per `05-STACK.md`: "the doc and the
 * app can't drift apart if the app imports the doc's values." Drop this file at
 * <app-repo>/design/tokens.ts (05-STACK's standard repo shape) — nothing in the
 * app hardcodes a color, size, spacing, duration, or haptic; everything reads
 * from here, which is what makes `design-conformance` auditable (Phase 7).
 *
 * Anti-casino guardrail (§3, mandatory): gold is used ONLY for brand mark, the
 * ledger accent, and success/settled amounts — never a fill/glow/gradient/
 * shimmer/confetti. Enforce that at the component layer, not by adding more gold
 * tokens here.
 */
// ---- Type scale (§3: Bricolage Grotesque headlines/receipt titles and
// Hanken Grotesk body/UI/ledger figures). Figures stay proportional and use
// tabular lining OpenType features rather than a generic monospace face. These are the exact
// keys registered by expo-font in app/_layout.tsx on every platform. There is no
// system fallback: the root layout does not render until all faces are loaded. ----
const families = {
  displayRegular: 'BricolageGrotesque-Regular',
  display: 'BricolageGrotesque-SemiBold',
  displayBold: 'BricolageGrotesque-Bold',
  body: 'HankenGrotesk-Regular',
  bodyMedium: 'HankenGrotesk-Medium',
  bodyBold: 'HankenGrotesk-Bold',
} as const;

export const type = {
  // A deliberate accessibility ceiling for fixed-height financial flows. At
  // 135% the smallest body copy remains 22.95pt while the no-scroll screens
  // retain their primary action on the 667pt reference viewport.
  maxScale: 1.35,
  family: {
    displayRegular: families.displayRegular,
    display: families.display, // headlines, receipt totals
    displayBold: families.displayBold,
    body: families.body, // body/UI copy
    bodyMedium: families.bodyMedium,
    bodyBold: families.bodyBold,
    figure: families.body, // pair with tabularNums; NEVER truncate, allow reflow
    figureBold: families.bodyBold,
  },
  size: {
    caption: 13,
    body: 17,
    lg: 22,
    xl: 28,
    display: 34,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;

// Apply to every amount and ledger figure Text style. Lining figures keep dollar
// values aligned with uppercase labels; tabular figures keep columns stable.
export const tabularNums: TextStyle = {
  fontVariant: ['tabular-nums', 'lining-nums'],
};

// ---- Spacing grid (§3: 8px base unit; ledger-line rhythm uses a taller 12px
// vertical rhythm on receipt rows to read as itemized, not cramped) ----
export const space = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  ledgerLine: 12, // receipt-row vertical rhythm — distinct from the general 8px grid, §3
} as const;

// ---- Semantic colors (§3, LOCKED 2026-07-30 — near-black + white + disciplined
// gold, clay-red for forfeit only). No light-mode palette is speced yet — the
// Design Direction says light-surface contexts (shared receipt image, web) use
// "the same disciplined system inverted, not a different palette"; `surfaceLight`/
// `textOnLight` below are that inversion, not a second brand. ----
export const color = {
  // Dark surface (primary, app-wide)
  surface: '#0A0A0A', // near-black base — a true dark surface, not warm paper
  surfaceRaised: '#161616', // one step up for cards/sheets, still near-black
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B8B8',

  // The ONE brand/value accent — gold. Anti-casino rule: mark/ledger-accent/
  // success-amount ONLY. Never a fill, glow, gradient, or celebratory flourish.
  gold: '#F5C518',

  // Forfeit/failure — the only other semantic color (§1: "no more than the two
  // semantic colors as emotional signaling").
  clayRed: '#B5502D',

  // Light-surface inversion (shared receipt image / web on light background) —
  // same restraint, not a redesigned palette (§3).
  surfaceLight: '#FAFAFA',
  textOnLight: '#0A0A0A',
} as const;

// ---- Motion tokens (§4) ----
export const motion = {
  duration: {
    fast: 150, // taps/toggles
    standard: 250, // screen transitions
    emphasized: 400, // Glass Receipt line-by-line reveal, per line
  },
  easing: {
    // 'settle' spring — confident, non-bouncy arrival ("a ledger line settling
    // into place"). Values are react-native-reanimated withSpring config.
    settle: { stiffness: 220, damping: 26 },
    // 'standard' ease-out — general navigation.
    standardEaseOut: [0.16, 1, 0.3, 1] as const,
  },
} as const;

// ---- Haptics map (§5) — expo-haptics call to use per event. 'none' means the
// event is deliberately silent (§5: "Everything else — none — silence is the
// default"); do not invent a haptic for an event not listed here. ----
export const haptics = {
  commitmentCreated: 'impactLight', // soft single tap — acknowledgment, not celebration
  glassReceiptSuccessLine: 'notificationSuccess', // soft double tap — the one reward moment
  glassReceiptForfeitLine: 'impactRigid', // single low/rigid tap — acknowledges without punishing further
  toggleSelection: 'selection', // stake tier, charity pick
  slaMissAutoPass: 'impactLight', // quiet reassurance, not celebration
  none: null,
} as const;

export const tokens = { type, space, color, motion, haptics } as const;
export type Tokens = typeof tokens;
