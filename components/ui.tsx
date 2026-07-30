import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
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
      style={({ pressed }) => [styles.button, pressed && styles.buttonPressed, typeof style === 'function' ? style({ pressed }) : style]}
      {...props}
    >
      <Text allowFontScaling style={styles.buttonLabel}>{children}</Text>
    </Pressable>
  );
}

export function HeldArtwork() {
  return (
    <View
      accessible
      accessibilityLabel="Held. Onboarding illustration pending founder."
      style={styles.held}
      testID="founder-artwork-hold"
    >
      <View style={styles.ledgerLine} />
      <Text allowFontScaling style={styles.heldText}>[HELD — onboarding illustration pending founder]</Text>
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
  buttonLabel: { color: color.surface, fontFamily: type.family.body, fontSize: type.size.body, fontWeight: type.weight.semibold },
  buttonPressed: { opacity: 0.86, transform: [{ scale: 0.98 }] },
  eyebrow: { color: color.gold, fontFamily: type.family.mono, fontSize: type.size.caption, fontWeight: type.weight.semibold, letterSpacing: 1.4 },
  header: { gap: space.sm },
  held: { borderColor: color.textSecondary, borderRadius: space.sm, borderStyle: 'dashed', borderWidth: 1, gap: space.sm, minHeight: 68, padding: space.md },
  heldText: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  ledgerLine: { backgroundColor: color.gold, height: 2, width: 52 },
  statePanel: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.md, padding: space.lg },
  stateTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg, fontWeight: type.weight.semibold },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.display, fontWeight: type.weight.semibold, lineHeight: type.size.display * type.lineHeight.tight },
});
