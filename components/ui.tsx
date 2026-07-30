import type { PropsWithChildren, ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { color, space, type } from '@/design/tokens';

export function ScreenHeader({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <View style={styles.header}>
      <Text allowFontScaling style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text>
      <Text allowFontScaling accessibilityRole="header" style={styles.title}>{title}</Text>
      {body ? <Text allowFontScaling style={styles.body}>{body}</Text> : null}
    </View>
  );
}

export function PrimaryButton({ children, style, ...props }: PropsWithChildren<PressableProps>) {
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        props.disabled && styles.buttonDisabled,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...props}
    >
      <Text allowFontScaling style={[styles.buttonLabel, props.disabled && styles.buttonLabelDisabled]}>{children}</Text>
    </Pressable>
  );
}

export function TextAction({ children, onPress, align = 'start', accessibilityRole = 'button' }: {
  children: ReactNode; onPress: () => void; align?: 'start' | 'center' | 'end'; accessibilityRole?: 'button' | 'link';
}) {
  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.textAction, styles[`textAction${align}`], pressed && styles.textActionPressed]}
    >
      <Text allowFontScaling style={styles.textActionLabel}>{children}</Text>
    </Pressable>
  );
}

export function BrandWordmark({ layout = 'horizontal' }: { layout?: 'horizontal' | 'stacked' }) {
  return (
    <Image
      accessibilityLabel="On the Line"
      resizeMode="contain"
      source={layout === 'stacked'
        ? require('@/assets/logo/wordmark-stacked.png')
        : require('@/assets/logo/wordmark-horizontal.png')}
      style={layout === 'stacked' ? styles.wordmarkStacked : styles.wordmarkHorizontal}
      testID={`brand-wordmark-${layout}`}
    />
  );
}

export function BrandSplash() {
  return (
    <View accessibilityLabel="On the Line" style={styles.splash} testID="brand-splash">
      <Image
        accessibilityLabel="On the Line"
        resizeMode="contain"
        source={require('@/assets/logo/wordmark-stacked.png')}
        style={styles.splashWordmark}
      />
    </View>
  );
}

export function OnboardingArtwork() {
  return (
    <View style={styles.onboarding} testID="onboarding-artwork">
      <Image
        accessibilityLabel="On the Line"
        resizeMode="contain"
        source={require('@/assets/logo/wordmark-horizontal.png')}
        style={styles.onboardingWordmark}
      />
    </View>
  );
}

export function StatePanel({ title, body, actionLabel, onAction }: { title: string; body: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <View accessibilityRole="summary" style={styles.statePanel}>
      <Text allowFontScaling accessibilityRole="header" style={styles.stateTitle}>{title}</Text>
      <Text allowFontScaling style={styles.body}>{body}</Text>
      {actionLabel && onAction ? <PrimaryButton onPress={onAction}>{actionLabel}</PrimaryButton> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  body: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  button: { alignItems: 'center', backgroundColor: color.textPrimary, borderRadius: space.sm, justifyContent: 'center', minHeight: 52, paddingHorizontal: space.lg, paddingVertical: space.md, transform: [{ scale: 1 }] },
  buttonDisabled: { backgroundColor: color.surfaceRaised, borderColor: color.textSecondary, borderWidth: 1, opacity: 0.55 },
  buttonLabel: { color: color.surface, fontFamily: type.family.body, fontSize: type.size.body, fontWeight: type.weight.semibold },
  buttonLabelDisabled: { color: color.textSecondary },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  eyebrow: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption, fontWeight: type.weight.semibold, letterSpacing: 1.4 },
  header: { gap: space.sm },
  onboarding: { gap: space.sm },
  onboardingWordmark: { alignSelf: 'center', height: 28, width: 168 },
  splash: { alignItems: 'center', backgroundColor: color.surface, flex: 1, justifyContent: 'center', padding: space.xl },
  splashWordmark: { height: 180, width: '76%' },
  statePanel: { borderLeftColor: color.textSecondary, borderLeftWidth: 2, gap: space.md, paddingVertical: space.sm, paddingLeft: space.md },
  stateTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg, fontWeight: type.weight.semibold },
  textAction: { justifyContent: 'center', minHeight: 44 },
  textActioncenter: { alignSelf: 'center' },
  textActionend: { alignSelf: 'flex-end' },
  textActionLabel: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body },
  textActionPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  textActionstart: { alignSelf: 'flex-start' },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.display, fontWeight: type.weight.semibold, lineHeight: type.size.display * type.lineHeight.tight },
  wordmarkHorizontal: { height: 34, width: 190 },
  wordmarkStacked: { height: 92, width: 152 },
});
