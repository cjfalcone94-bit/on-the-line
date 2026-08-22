import { useState, type PropsWithChildren, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { InteractivePressable, type InteractivePressableProps } from './ui';
import { border, color, radius, space, tabularNums, type } from '@/design/tokens';

/**
 * Premium surface kit — the shared pieces of the financial-terminal treatment.
 *
 * Direction: private financial terminal x commitment contract. Serious, precise,
 * calm, slightly editorial. Depth comes from layered near-black surfaces and a
 * single hairline, never from shadow — a drop shadow on near-black reads as
 * smudge. Empty space is part of the design.
 *
 * Gold discipline (DESIGN-DIRECTION §3, as amended): the screen stays roughly
 * 80-85% graphite/off-white. Gold is reserved for the one CTA fill per screen,
 * step numbers, small icons, micro labels, selected state and monetary amounts.
 * Gold is valuable here because it is scarce; large runs of gold text are banned.
 */

// ---------------------------------------------------------------------------
// Structure
// ---------------------------------------------------------------------------

/** A hairline between siblings. Quieter than a border: it separates, it does not enclose. */
export function Divider({ inset = 0 }: { inset?: number }) {
  return <View accessibilityElementsHidden importantForAccessibility="no" style={[styles.divider, inset ? { marginLeft: inset } : null]} />;
}

/** Uppercase micro label — GOAL CATALOG, MOVE, CADENCE, EXACT PASS CRITERIA. */
export function SectionLabel({ children, tone = 'gold', style }: PropsWithChildren<{ tone?: 'gold' | 'muted'; style?: object }>) {
  return (
    <Text
      accessibilityRole="header"
      allowFontScaling
      maxFontSizeMultiplier={type.maxScale}
      style={[styles.sectionLabel, tone === 'muted' && styles.sectionLabelMuted, style]}
    >
      {children}
    </Text>
  );
}

/** The standard card surface. `elevated` is for a card sitting above another card. */
export function PremiumCard({ children, elevated = false, emphasis = false, style }: PropsWithChildren<{
  elevated?: boolean; emphasis?: boolean; style?: object;
}>) {
  return (
    <View style={[styles.card, elevated && styles.cardElevated, emphasis && styles.cardEmphasis, style]}>
      {children}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Icons — thin, geometric, monochrome gold, one stroke width. No emoji.
// ---------------------------------------------------------------------------

export type GoalIconName = 'walk' | 'dumbbell' | 'run' | 'stretch' | 'timer' | 'search' | 'pencil' | 'book' | 'moon' | 'lock' | 'check' | 'shield' | 'chart' | 'info';

const ICON_PATHS: Record<GoalIconName, ReactNode> = {
  walk: <Path d="M13 4.5a1.6 1.6 0 1 0 0-.01M12.5 21l1.8-5.2-2.6-2.1.7-4.2 3.1 1.7 1.6 2.6M11.4 9.5 8.6 11l-1 3.4M12.6 15.8 9.4 21" />,
  dumbbell: <Path d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10" />,
  run: <Path d="M15.5 4.6a1.6 1.6 0 1 0 0-.01M9 21l2.6-4.6-2.2-2.6.9-4.4 3.3 2 2 2.5 2.6.6M11 9 7.4 10.4 5.8 14M13.4 16.4 16 21" />,
  stretch: <Path d="M12 4.6a1.6 1.6 0 1 0 0-.01M12 8.4v5.2M12 13.6 8.4 21M12 13.6 15.6 21M7.6 10.4h8.8" />,
  timer: <><Circle cx="12" cy="13.5" r="6.5" /><Path d="M12 10.5v3.2l2 1.4M9.6 3.5h4.8M12 3.5V7" /></>,
  search: <><Circle cx="11" cy="11" r="6" /><Path d="m15.4 15.4 4.1 4.1" /></>,
  pencil: <Path d="M4.5 19.5h3.2L19 8.2a1.7 1.7 0 0 0 0-2.4l-.8-.8a1.7 1.7 0 0 0-2.4 0L4.5 16.3zM14.6 6.6l2.8 2.8" />,
  book: <Path d="M4.6 5.2h5.1a2.3 2.3 0 0 1 2.3 2.3v11.3a1.8 1.8 0 0 0-1.8-1.8H4.6zM19.4 5.2h-5.1a2.3 2.3 0 0 0-2.3 2.3v11.3a1.8 1.8 0 0 1 1.8-1.8h5.6z" />,
  moon: <Path d="M19.4 14.6A7.8 7.8 0 0 1 9.4 4.6a7.8 7.8 0 1 0 10 10z" />,
  lock: <><Rect x="5.2" y="10.4" width="13.6" height="9.4" rx="2.2" /><Path d="M8.4 10.4V7.8a3.6 3.6 0 0 1 7.2 0v2.6" /></>,
  check: <><Circle cx="12" cy="12" r="8" /><Path d="m8.4 12.2 2.6 2.6 4.6-5" /></>,
  shield: <><Path d="M12 3.6 5.4 6.3v5.2c0 4 2.8 7.2 6.6 8.9 3.8-1.7 6.6-4.9 6.6-8.9V6.3z" /><Path d="m9.4 12.2 1.9 1.9 3.3-3.6" /></>,
  chart: <Path d="M4.5 19.5h15M6.8 16.4l3.4-4 2.9 2.4 4.1-5.6" />,
  info: <><Circle cx="12" cy="12" r="8" /><Path d="M12 11.2v5M12 8.2v.1" /></>,
};

/** A single line glyph. Stroke width is constant across the set by design. */
export function LineIcon({ name, size = 22, tone = color.gold }: { name: GoalIconName; size?: number; tone?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={tone}
      strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {ICON_PATHS[name]}
    </Svg>
  );
}

/** The 48x48 well an icon sits in — a darker square, not a filled gold chip. */
export function GoalIcon({ name, size = 48 }: { name: GoalIconName; size?: number }) {
  return (
    <View accessibilityElementsHidden importantForAccessibility="no"
      style={[styles.iconWell, { width: size, height: size }]}>
      <LineIcon name={name} size={Math.round(size * 0.46)} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Contract components
// ---------------------------------------------------------------------------

/**
 * The pass-criteria panel. This is the most consequential component in the app:
 * it must read as the terms you are agreeing to, not a settings list. Hence the
 * gold edge, the shield, and numbered rather than bulleted rules — a bullet is a
 * list, a number is a clause.
 */
export function CriteriaCard({ title = 'Exact pass criteria', note, children }: PropsWithChildren<{ title?: string; note?: string }>) {
  return (
    <PremiumCard emphasis>
      <View style={styles.criteriaHead}>
        <LineIcon name="shield" size={20} />
        <SectionLabel style={styles.criteriaHeadLabel}>{title}</SectionLabel>
      </View>
      {note ? (
        <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.criteriaNote}>{note}</Text>
      ) : null}
      <View style={styles.criteriaList}>{children}</View>
    </PremiumCard>
  );
}

/** One numbered clause. The number is gold; the rule itself stays off-white. */
export function CriteriaRow({ index, children, last = false }: PropsWithChildren<{ index: number; last?: boolean }>) {
  return (
    <View>
      <View style={styles.criteriaRow}>
        <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.criteriaIndex}>
          {String(index).padStart(2, '0')}
        </Text>
        <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.criteriaText}>{children}</Text>
      </View>
      {last ? null : <Divider />}
    </View>
  );
}

/**
 * A numbered editorial step — the how-it-works rules. The number is the anchor,
 * deliberately the largest gold element on the screen.
 */
export function StepRow({ index, icon, title, body, last = false }: {
  index: number; icon: GoalIconName; title: string; body: string; last?: boolean;
}) {
  return (
    <View>
      <View style={styles.step}>
        <View style={styles.stepMark}>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.stepIndex}>
            {String(index).padStart(2, '0')}
          </Text>
          <View style={styles.stepIcon}><LineIcon name={icon} size={20} /></View>
        </View>
        <View style={styles.stepBody}>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.stepTitle}>{title}</Text>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.stepText}>{body}</Text>
        </View>
      </View>
      {last ? null : <Divider />}
    </View>
  );
}

/**
 * Financial disclosure, not marketing. Graphite surface, thin gold edge, small
 * info mark — the register of a fee table, which is what it is.
 */
export function DisclosureCard({ children }: PropsWithChildren) {
  return (
    <PremiumCard emphasis style={styles.disclosure}>
      <View style={styles.disclosureIcon}><LineIcon name="info" size={18} tone={color.goldMuted} /></View>
      <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.disclosureText}>{children}</Text>
    </PremiumCard>
  );
}

/** A structured ledger line — LABEL right-aligned value, tabular figures. */
export function LedgerRow({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'gold' }) {
  return (
    <View style={styles.ledgerRow}>
      <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>{label}</Text>
      <Text allowFontScaling maxFontSizeMultiplier={type.maxScale}
        style={[styles.ledgerValue, tone === 'gold' && styles.ledgerValueGold]}>{value}</Text>
    </View>
  );
}

/** A quiet reassurance line under a CTA. Muted by design — it must not compete. */
export function ReassuranceRow({ icon = 'lock', children }: PropsWithChildren<{ icon?: GoalIconName }>) {
  return (
    <View style={styles.reassurance}>
      <LineIcon name={icon} size={14} tone={color.textTertiary} />
      <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.reassuranceText}>{children}</Text>
    </View>
  );
}

/** The transition hint before a CTA — "here is what happens next". */
export function NextStepRow({ icon = 'chart', children }: PropsWithChildren<{ icon?: GoalIconName }>) {
  return (
    <View style={styles.nextStep}>
      <LineIcon name={icon} size={16} tone={color.goldMuted} />
      <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.nextStepText}>{children}</Text>
    </View>
  );
}

/**
 * A goal row as its own compact card: icon well, title, cadence, proof.
 * Deliberately NOT one big container holding many rows — an individual
 * interactive item gets its own defined surface.
 */
export function GoalCard({ icon, title, cadence, proof, style, ...props }: InteractivePressableProps & {
  icon: GoalIconName; title: string; cadence: string; proof: string;
}) {
  // Press/focus state is tracked here rather than read from the Pressable's
  // style callback, for the same reason the surface is: that callback never runs
  // on the animated component, so a state style placed there is dead code that
  // looks correct in review.
  const [pressed, setPressed] = useState(false);
  const [focused, setFocused] = useState(false);
  return (
    <InteractivePressable
      {...props}
      accessibilityRole="button"
      onBlur={(event) => { setFocused(false); props.onBlur?.(event); }}
      onFocus={(event) => { setFocused(true); props.onFocus?.(event); }}
      onPressIn={(event) => { setPressed(true); props.onPressIn?.(event); }}
      onPressOut={(event) => { setPressed(false); props.onPressOut?.(event); }}
      style={typeof style === 'function' ? (state) => style(state) : style}
    >
      {/* The card surface — background, border, radius AND flexDirection — lives
          on this inner plain View, never on the animated Pressable's callback
          style. The Reanimated-animated Pressable does not apply a function
          style, so a surface placed there silently vanishes: the card loses its
          fill, its border, and its row layout, and the content collapses into a
          bare vertical stack. That is the same failure as the invisible enabled
          CTA in builds 21-25 (CALIBRATION-LOG `invisible-fill-animated-pressable`)
          — it recurred here because the rule had only ever been enforced for
          PrimaryButton. */}
      <View style={[styles.goalCard, pressed && styles.goalCardPressed, focused && styles.goalCardFocused]}>
        <GoalIcon name={icon} />
        <View style={styles.goalBody}>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.goalTitle}>{title}</Text>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.goalCadence}>{cadence}</Text>
          <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} numberOfLines={2} style={styles.goalProof}>{proof}</Text>
        </View>
        <Text allowFontScaling maxFontSizeMultiplier={type.maxScale} style={styles.goalChevron}>›</Text>
      </View>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surfaceRaised,
    borderColor: color.stroke,
    borderRadius: radius.card,
    borderWidth: border.hairline,
    padding: space.cardPad,
  },
  cardElevated: { backgroundColor: color.surfaceElevated },
  cardEmphasis: { borderColor: color.goldEdge },

  criteriaHead: { alignItems: 'center', flexDirection: 'row', gap: space.sm },
  criteriaHeadLabel: { marginBottom: 0 },
  criteriaIndex: { ...tabularNums, color: color.gold, fontFamily: type.family.figureBold, fontSize: type.size.caption, letterSpacing: type.tracking.micro, minWidth: 22, paddingTop: 2 },
  criteriaList: { marginTop: space.md },
  criteriaNote: { color: color.textTertiary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, marginTop: space.sm },
  criteriaRow: { alignItems: 'flex-start', flexDirection: 'row', gap: space.smd, paddingVertical: space.smd },
  criteriaText: { color: color.textPrimary, flex: 1, fontFamily: type.family.bodyMedium, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },

  disclosure: { alignItems: 'flex-start', flexDirection: 'row', gap: space.smd, padding: space.md },
  disclosureIcon: { paddingTop: 1 },
  disclosureText: { color: color.textSecondary, flex: 1, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },

  divider: { backgroundColor: color.divider, height: StyleSheet.hairlineWidth },

  goalBody: { flex: 1, gap: 3 },
  goalCadence: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figure, fontSize: type.size.caption },
  goalCard: {
    alignItems: 'center',
    backgroundColor: color.surfaceRaised,
    borderColor: color.stroke,
    borderRadius: radius.card,
    borderWidth: border.hairline,
    flexDirection: 'row',
    gap: space.md,
    minHeight: 84,
    paddingHorizontal: space.md,
    paddingVertical: space.smd,
  },
  goalCardFocused: { borderColor: color.gold },
  goalCardPressed: { backgroundColor: color.surfaceInteractive },
  goalChevron: { color: color.textTertiary, fontSize: type.size.lg },
  goalProof: { color: color.textTertiary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  goalTitle: { color: color.textPrimary, fontFamily: type.family.bodyBold, fontSize: type.size.cardTitle },

  iconWell: {
    alignItems: 'center',
    backgroundColor: '#151515',
    borderColor: '#292929',
    borderRadius: radius.icon,
    borderWidth: border.hairline,
    justifyContent: 'center',
  },

  ledgerLabel: { color: color.textTertiary, fontFamily: type.family.bodyMedium, fontSize: type.size.micro, letterSpacing: type.tracking.micro, textTransform: 'uppercase' },
  ledgerRow: { alignItems: 'baseline', flexDirection: 'row', gap: space.md, justifyContent: 'space-between', paddingVertical: space.sm },
  ledgerValue: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figureBold, fontSize: type.size.body },
  ledgerValueGold: { color: color.gold },

  nextStep: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm, paddingVertical: space.smd },
  nextStepText: { color: color.textSecondary, flex: 1, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },

  reassurance: { alignItems: 'center', flexDirection: 'row', gap: space.sm, justifyContent: 'center', paddingTop: space.smd },
  reassuranceText: { color: color.textTertiary, fontFamily: type.family.body, fontSize: type.size.caption },

  sectionLabel: { color: color.gold, fontFamily: type.family.bodyBold, fontSize: type.size.micro, letterSpacing: type.tracking.micro, marginBottom: space.smd, textTransform: 'uppercase' },
  sectionLabelMuted: { color: color.textTertiary },

  step: { alignItems: 'flex-start', flexDirection: 'row', gap: space.md, paddingVertical: space.lg },
  stepBody: { flex: 1, gap: space.sm },
  stepIcon: { alignItems: 'center', borderColor: color.stroke, borderRadius: 999, borderWidth: border.hairline, height: 34, justifyContent: 'center', width: 34 },
  stepIndex: { ...tabularNums, color: color.gold, fontFamily: type.family.figureBold, fontSize: type.size.lg, letterSpacing: type.tracking.micro },
  stepMark: { alignItems: 'center', gap: space.smd, width: 40 },
  stepText: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.relaxed },
  stepTitle: { color: color.textPrimary, fontFamily: type.family.bodyBold, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.tight },
});
