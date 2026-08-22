import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import { Animated } from 'react-native';
import Reanimated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { border, color, motion, radius, space, tabularNums, type } from '@/design/tokens';
import { fireHaptic, type HapticCue } from '@/lib/feedback';

export const MAX_FONT_SCALE = 1.35;

type InteractionState = PressableStateCallbackType & { focused: boolean; hovered: boolean };
export type InteractivePressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: InteractionState) => StyleProp<ViewStyle>);
  haptic?: HapticCue;
};

const AnimatedPressable = Reanimated.createAnimatedComponent(Pressable);

export function InteractivePressable({ style, haptic = 'light', onFocus, onBlur, onHoverIn, onHoverOut, onPress, onPressIn, onPressOut, ...props }: InteractivePressableProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const pressedProgress = useSharedValue(0);
  const pressStyle = useAnimatedStyle(() => ({
    opacity: 1 - pressedProgress.value * 0.12,
    transform: [{ scale: 1 - pressedProgress.value * 0.03 }],
  }));
  const PressableComponent = Platform.OS === 'web' ? Pressable : AnimatedPressable;
  return (
    <PressableComponent
      {...props}
      onPress={(event) => { void fireHaptic(haptic).catch(() => undefined); onPress?.(event); }}
      onPressIn={(event) => {
        pressedProgress.value = withSpring(1, motion.easing.settle);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        pressedProgress.value = withSpring(0, motion.easing.settle);
        onPressOut?.(event);
      }}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onHoverIn={(event) => { setHovered(true); onHoverIn?.(event); }}
      onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
      style={(state: PressableStateCallbackType) => [
        pressStyle,
        typeof style === 'function' ? style({ ...state, focused, hovered }) : style,
        hovered && styles.interactiveHovered,
        focused && styles.interactiveFocused,
      ]}
    />
  );
}

export function ScreenEntrance({ children, delay = 0, style }: PropsWithChildren<{
  direction?: 'left' | 'right' | 'up'; delay?: number; style?: StyleProp<ViewStyle>;
}>) {
  const progress = useSharedValue(0);
  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (!active) return;
      timer = setTimeout(() => {
        progress.value = withTiming(1, {
          duration: reduced ? motion.duration.fast : motion.duration.standard,
          easing: Easing.bezier(...motion.easing.standardEaseOut),
        });
      }, reduced ? 0 : delay);
    });
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [delay, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  return <Reanimated.View pointerEvents="box-none" style={[style, animatedStyle]}>{children}</Reanimated.View>;
}

export function ScreenHeader({ eyebrow, title, body, compact = false }: { eyebrow: string; title: string; body?: string; compact?: boolean }) {
  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={[styles.title, compact && styles.titleCompact]}>{title}</Text>
      {body ? <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.body, compact && styles.bodyCompact]}>{body}</Text> : null}
    </View>
  );
}

export function SandboxBadge() {
  return (
    <View accessibilityLabel="Sandbox — no real payment" style={styles.sandboxBadge} testID="sandbox-badge">
      <Text maxFontSizeMultiplier={type.maxScale} style={styles.sandboxLabel}>SANDBOX — NO REAL PAYMENT</Text>
    </View>
  );
}

export function PrimaryButton({ children, style, ...props }: PropsWithChildren<InteractivePressableProps>) {
  // The visual fill (background, radius, min-height) MUST live on an inner plain
  // View, not on the Reanimated-animated Pressable. The animated Pressable dropped
  // the button's backgroundColor from its callback-style array, so enabled primary
  // buttons — white fill + dark label — rendered fully invisible (dark-on-black).
  // That vanished the app's main CTAs ("Set stake", "Browse goal templates") in
  // footers. A plain View paints the fill reliably regardless of the animation layer.
  return (
    <InteractivePressable
      {...props}
      accessibilityRole="button"
      style={typeof style === 'function' ? (state) => style(state) : style}
    >
      <View style={[styles.button, props.disabled && styles.buttonDisabled]}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.buttonLabel, props.disabled && styles.buttonLabelDisabled]}>{children}</Text>
        {/* Right-aligned arrow: the label says what happens, the arrow says it
            moves you forward. Hidden from screen readers — the button's own
            label already conveys the action. */}
        <Text accessibilityElementsHidden importantForAccessibility="no" maxFontSizeMultiplier={type.maxScale} allowFontScaling
          style={[styles.buttonArrow, props.disabled && styles.buttonLabelDisabled]}>→</Text>
      </View>
    </InteractivePressable>
  );
}

/**
 * Outlined companion to PrimaryButton for stacked footers: same height and
 * radius so the pair reads as one system, but transparent fill + stroke so a
 * single white primary keeps visual priority.
 */
export function SecondaryButton({ children, style, ...props }: PropsWithChildren<InteractivePressableProps>) {
  return (
    <InteractivePressable
      {...props}
      accessibilityRole="button"
      style={typeof style === 'function' ? (state) => style(state) : style}
    >
      <View style={styles.secondaryButton}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.secondaryButtonLabel}>{children}</Text>
      </View>
    </InteractivePressable>
  );
}

export function LedgerSkeletonLine({ width = '100%', height = 14 }: { width?: number | `${number}%`; height?: number }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(0.5);
      return;
    }
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { duration: motion.duration.emphasized, toValue: 1, useNativeDriver: true }),
      Animated.timing(pulse, { duration: motion.duration.emphasized, toValue: 0, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [pulse, reduceMotion]);
  return <Animated.View style={[styles.skeletonLine, { height, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.26] }), width }]} />;
}

export function TextAction({ children, onPress, align = 'start', accessibilityRole = 'button', testID }: {
  children: ReactNode; onPress: () => void; align?: 'start' | 'center' | 'end'; accessibilityRole?: 'button' | 'link'; testID?: string;
}) {
  return (
    <InteractivePressable
      accessibilityRole={accessibilityRole}
      hitSlop={8}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [styles.textAction, styles[`textAction${align}`], pressed && styles.textActionPressed]}
    >
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.textActionLabel}>{children}</Text>
    </InteractivePressable>
  );
}

export function BrandWordmark({ layout = 'horizontal' }: { layout?: 'horizontal' | 'stacked' }) {
  const stacked = layout === 'stacked';
  return (
    <View
      accessibilityLabel="On the Line"
      accessible
      style={[styles.wordmark, stacked ? styles.wordmarkStacked : styles.wordmarkHorizontal]}
      testID={`brand-wordmark-${layout}`}
    >
      {stacked ? <LedgerMark width={116} height={28} /> : null}
      <View style={styles.wordmarkTextRow}>
        <Text allowFontScaling={false} style={styles.wordmarkText}>ON THE </Text>
        <Text allowFontScaling={false} style={[styles.wordmarkText, styles.wordmarkGold]}>LINE</Text>
      </View>
      {!stacked ? <LedgerMark width={54} height={18} /> : null}
    </View>
  );
}

function LedgerMark({ width, height }: { width: number; height: number }) {
  return (
    <Svg aria-hidden height={height} viewBox="0 0 120 32" width={width}>
      <Path d="M2 23H78L102 5" fill="none" stroke={color.gold} strokeLinecap="square" strokeLinejoin="round" strokeWidth="5" />
      <Circle cx="70" cy="23" fill={color.gold} r="7" />
    </Svg>
  );
}

export function BrandSplash() {
  return (
    <View accessibilityLabel="On the Line" style={styles.splash} testID="brand-splash">
      <BrandWordmark layout="stacked" />
    </View>
  );
}

export function OnboardingArtwork({ align = 'center', compact = false }: { align?: 'start' | 'center'; compact?: boolean }) {
  return (
    <View style={[styles.onboarding, align === 'start' && styles.onboardingStart, compact && styles.onboardingCompact]} testID="onboarding-artwork">
      <BrandWordmark />
    </View>
  );
}

export function StatePanel({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View accessibilityRole="summary" style={styles.statePanel}>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={styles.stateTitle}>{title}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.body}>{body}</Text>
      {actionLabel && onAction ? <PrimaryButton onPress={onAction}>{actionLabel}</PrimaryButton> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  bodyCompact: { fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  // 56-60pt tall, radius 14 — generous but never pill-shaped: a fully rounded
  // control reads playful, which is the wrong register for money.
  button: { alignItems: 'center', backgroundColor: color.gold, borderRadius: radius.button, flexDirection: 'row', justifyContent: 'space-between', minHeight: 58, paddingHorizontal: space.lg, paddingVertical: space.md },
  buttonArrow: { color: color.surface, fontFamily: type.family.bodyBold, fontSize: type.size.body },
  // Disabled = an intentional resting state, not a broken control: a quiet
  // raised fill with readable secondary text — no ghost outline, no dimming.
  buttonDisabled: { backgroundColor: color.surfaceRaised },
  buttonLabel: { color: color.surface, fontFamily: type.family.bodyMedium, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.tight },
  buttonLabelDisabled: { color: color.textSecondary },
  eyebrow: { ...tabularNums, color: color.gold, fontFamily: type.family.figureBold, fontSize: type.size.caption, letterSpacing: 1.4 },
  // Hero breathing room per apple-hig-premium §1 (48-64pt above primary content),
  // attached to the hero itself so it's identical whether a screen renders
  // ScreenHeader in the scaffold's fixed header slot or in its scroll content.
  header: { gap: space.sm, marginTop: space['2xl'] },
  headerCompact: { gap: space.xs, marginTop: space.lg },
  interactiveFocused: Platform.select({
    web: { boxShadow: `0 0 0 3px ${color.gold}` },
    default: { borderColor: color.gold, borderWidth: 2 },
  }),
  interactiveHovered: { opacity: 0.9 },
  onboarding: { alignItems: 'center', gap: space.sm },
  onboardingCompact: { transform: [{ scale: 0.88 }] },
  onboardingStart: { alignItems: 'flex-start', alignSelf: 'flex-start' },
  sandboxBadge: { alignSelf: 'flex-start', borderColor: color.gold, borderRadius: space.xs, borderWidth: 1, paddingHorizontal: space.sm, paddingVertical: 5 },
  secondaryButton: { alignItems: 'center', backgroundColor: 'transparent', borderColor: color.stroke, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: space.lg, paddingVertical: space.md },
  secondaryButtonLabel: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.tight },
  sandboxLabel: { ...tabularNums, color: color.gold, fontFamily: type.family.figureBold, fontSize: 9, letterSpacing: 0.8 },
  splash: { alignItems: 'center', backgroundColor: color.surface, flex: 1, justifyContent: 'center', padding: space.xl },
  skeletonLine: { backgroundColor: color.textSecondary, borderRadius: space.xs },
  statePanel: { borderLeftColor: color.gold, borderLeftWidth: 2, gap: space.md, paddingVertical: space.sm, paddingLeft: space.md },
  stateTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg },
  textAction: { justifyContent: 'center', minHeight: 44 },
  textActioncenter: { alignSelf: 'center' },
  textActionend: { alignSelf: 'flex-end' },
  textActionLabel: { color: color.gold, fontFamily: type.family.body, fontSize: type.size.body },
  textActionPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  textActionstart: { alignSelf: 'flex-start' },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.display, lineHeight: type.size.display * type.lineHeight.tight },
  titleCompact: { fontSize: type.size.xl, lineHeight: type.size.xl * type.lineHeight.tight },
  wordmark: { alignItems: 'center', backgroundColor: 'transparent', justifyContent: 'center' },
  wordmarkGold: { color: color.gold },
  wordmarkHorizontal: { flexDirection: 'row', gap: space.sm },
  wordmarkStacked: { gap: space.sm },
  wordmarkText: { color: color.textPrimary, fontFamily: type.family.displayBold, fontSize: 20, letterSpacing: 0.8 },
  wordmarkTextRow: { flexDirection: 'row' },
});
