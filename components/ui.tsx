import { useEffect, useState, type PropsWithChildren, type ReactNode } from 'react';
import { AccessibilityInfo, Platform, Pressable, StyleSheet, Text, View, type PressableProps, type PressableStateCallbackType, type StyleProp, type ViewStyle } from 'react-native';
import { Animated } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { color, motion, space, tabularNums, type } from '@/design/tokens';

export const MAX_FONT_SCALE = 1.35;

type InteractionState = PressableStateCallbackType & { focused: boolean; hovered: boolean };
type InteractivePressableProps = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle> | ((state: InteractionState) => StyleProp<ViewStyle>);
};

export function InteractivePressable({ style, onFocus, onBlur, onHoverIn, onHoverOut, ...props }: InteractivePressableProps) {
  const [focused, setFocused] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <Pressable
      {...props}
      onBlur={(event) => { setFocused(false); onBlur?.(event); }}
      onFocus={(event) => { setFocused(true); onFocus?.(event); }}
      onHoverIn={(event) => { setHovered(true); onHoverIn?.(event); }}
      onHoverOut={(event) => { setHovered(false); onHoverOut?.(event); }}
      style={(state) => [
        typeof style === 'function' ? style({ ...state, focused, hovered }) : style,
        hovered && styles.interactiveHovered,
        focused && styles.interactiveFocused,
      ]}
    />
  );
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

export function PrimaryButton({ children, style, ...props }: PropsWithChildren<PressableProps>) {
  const [press] = useState(() => new Animated.Value(0));
  const animatePress = (pressed: boolean) => {
    Animated.timing(press, {
      duration: motion.duration.fast,
      toValue: pressed ? 1 : 0,
      useNativeDriver: true,
    }).start();
  };
  return (
    <InteractivePressable
      {...props}
      accessibilityRole="button"
      style={() => [
        styles.button,
        props.disabled && styles.buttonDisabled,
        typeof style === 'function' ? style({ pressed: false }) : style,
      ]}
      onPressIn={(event) => { animatePress(true); props.onPressIn?.(event); }}
      onPressOut={(event) => { animatePress(false); props.onPressOut?.(event); }}
    >
      <Animated.View style={{ opacity: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.86] }), transform: [{ scale: press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.98] }) }] }}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.buttonLabel, props.disabled && styles.buttonLabelDisabled]}>{children}</Text>
      </Animated.View>
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

export function TextAction({ children, onPress, align = 'start', accessibilityRole = 'button' }: {
  children: ReactNode; onPress: () => void; align?: 'start' | 'center' | 'end'; accessibilityRole?: 'button' | 'link';
}) {
  return (
    <InteractivePressable
      accessibilityRole={accessibilityRole}
      hitSlop={8}
      onPress={onPress}
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

export function OnboardingArtwork({ compact = false }: { compact?: boolean }) {
  return (
    <View style={[styles.onboarding, compact && styles.onboardingCompact]} testID="onboarding-artwork">
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
  button: { alignItems: 'center', backgroundColor: color.textPrimary, borderRadius: space.sm, justifyContent: 'center', minHeight: 52, paddingHorizontal: space.lg, paddingVertical: space.md, transform: [{ scale: 1 }] },
  buttonDisabled: { backgroundColor: color.surfaceRaised, borderColor: color.textSecondary, borderWidth: 1, opacity: 0.55 },
  buttonLabel: { color: color.surface, fontFamily: type.family.bodyMedium, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.tight },
  buttonLabelDisabled: { color: color.textSecondary },
  eyebrow: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figureBold, fontSize: type.size.caption, letterSpacing: 1.4 },
  header: { gap: space.sm },
  headerCompact: { gap: space.xs },
  interactiveFocused: Platform.select({
    web: { boxShadow: `0 0 0 3px ${color.textPrimary}` },
    default: { borderColor: color.textPrimary, borderWidth: 2 },
  }),
  interactiveHovered: { opacity: 0.9 },
  onboarding: { alignItems: 'center', gap: space.sm },
  onboardingCompact: { transform: [{ scale: 0.88 }] },
  splash: { alignItems: 'center', backgroundColor: color.surface, flex: 1, justifyContent: 'center', padding: space.xl },
  skeletonLine: { backgroundColor: color.textSecondary, borderRadius: space.xs },
  statePanel: { borderLeftColor: color.textSecondary, borderLeftWidth: 2, gap: space.md, paddingVertical: space.sm, paddingLeft: space.md },
  stateTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg },
  textAction: { justifyContent: 'center', minHeight: 44 },
  textActioncenter: { alignSelf: 'center' },
  textActionend: { alignSelf: 'flex-end' },
  textActionLabel: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body },
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
