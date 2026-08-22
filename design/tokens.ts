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
 * Anti-casino guardrail (§3, mandatory — fill clause NARROWED by founder ruling
 * 2026-08-20): gold is a disciplined brand accent on the mark, ledger lines,
 * headers/eyebrows, affordance chevrons, and active or focused interactions,
 * plus success/settled amounts.
 *
 * Gold fills: EXACTLY ONE filled gold surface per screen — the primary action
 * (`PrimaryButton`): gold surface, near-black label. Every other gold fill stays
 * banned — no filled chips, pills, badges, cards, rows, or progress bars, and no
 * filled success/celebration state. A settled goal is a ledger LINE, never a gold
 * surface; that is the moment the casino read would bite.
 *
 * Still absolutely banned everywhere, unchanged: glow, gradient, shimmer,
 * confetti, decorative flourish, "jackpot" motion, and any fill that arrives or
 * animates in as a reward. Gold never signals forfeit; clayRed stays exclusive to
 * forfeit/failure.
 *
 * Both ends of this pendulum are on the record — `CALIBRATION-LOG.md` defect
 * `gold-over-correction` and the `DESIGN-DIRECTION.md` §3 changelog (2026-08-01
 * restored gold after an over-correction to monochrome; 2026-08-20 added the
 * primary-action fill). Cite both before moving gold in either direction.
 * Enforce the allowlist at the component layer.
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
    micro: 12, // uppercase micro labels — GOAL CATALOG, CADENCE, MOVE
    caption: 13, // metadata, proof lines
    meta: 14,
    body: 17,
    cardTitle: 18, // goal/card titles
    lg: 22, // section titles
    xl: 28,
    display: 34,
    hero: 44, // page titles — "Nothing hidden.", "Pick a clear target."
  },
  // Uppercase micro labels need tracking or they read as shouting rather than
  // as a label. Applied wherever textTransform is uppercase.
  tracking: {
    micro: 1.2,
    hero: -0.5, // slightly tight — large type looks loose at default tracking
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
  smd: 12, // related-element gap + control radius — the HIG ramp step between sm and md
  ledgerLine: 12, // receipt-row vertical rhythm — distinct from the general 8px grid, §3
  // 4px base unit; the full ramp is 4/8/12/16/20/24/32/40/48. The two steps the
  // original grid lacked, named for what they are used for:
  cardPad: 20, // card internal padding
  section: 40, // large section separation — the biggest gap on a screen
  screenX: 24, // screen horizontal padding
  betweenCards: 8, // gap between sibling cards in a list
} as const;

// ---- Radii. Cards read as financial instruments, not chat bubbles: generous
// but never pill-shaped. A fully rounded control reads playful, which is the
// wrong register for money. ----
export const radius = {
  icon: 12, // the 48x48 icon well
  control: 12,
  card: 14,
  button: 14,
} as const;

// ---- Border widths. Depth is built from surface + a single hairline, never
// from shadow — a drop shadow on near-black reads as smudge. ----
export const border = {
  hairline: 1,
  emphasis: 1, // same width; emphasis comes from color.goldEdge, not thickness
} as const;

// ---- Semantic colors (§3, LOCKED 2026-07-30 — near-black + white + disciplined
// gold, clay-red for forfeit only). No light-mode palette is speced yet — the
// Design Direction says light-surface contexts (shared receipt image, web) use
// "the same disciplined system inverted, not a different palette"; `surfaceLight`/
// `textOnLight` below are that inversion, not a second brand. ----
export const color = {
  // ---- Ground. Layered near-blacks, not one flat black. Depth comes from
  // surface steps, never from shadow. ----
  surfaceDeep: '#050505', // deepest well — behind sheets, under scrims
  surface: '#080808', // app-wide base
  surfaceRaised: '#111111', // the standard card
  surfaceElevated: '#141414', // a card that needs to sit above another card
  surfaceInteractive: '#171717', // pressed/hover surface for a tappable row

  // ---- Lines. A border states an edge; a divider separates siblings. ----
  stroke: '#242424', // default card/control border
  divider: '#1C1C1C', // very subtle separation inside a surface

  // ---- Type. Off-white, never stark #FFF — pure white on near-black glares
  // and reads cheap at display sizes. ----
  textPrimary: '#F5F5F3',
  textSecondary: '#A4A4A0',
  textTertiary: '#70706C', // proof lines, meta, supporting detail

  // ---- The ONE brand/value accent. A richer financial gold than the previous
  // #F5C518, which read as bright warning-yellow at fill size. Target mix is
  // roughly 80-85% graphite/off-white, 15-20% gold: gold is valuable because it
  // is scarce. Allowlist: CTA fill (exactly one per screen), step numbers, small
  // icons, micro labels, selected state, monetary amounts, ledger accents.
  // Never a glow, gradient, shimmer, or celebratory flourish; never large runs
  // of body text. ----
  gold: '#E8B91C',
  goldBright: '#F2C318', // pressed/active CTA only
  goldMuted: '#B89218', // gold that must recede — disabled, secondary marks
  goldEdge: 'rgba(232, 185, 28, 0.38)', // ~38% — the "important border" weight

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

export const tokens = { type, space, radius, border, color, motion, haptics } as const;
export type Tokens = typeof tokens;
