import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { color, space, tabularNums, type } from '@/design/tokens';
import { InteractivePressable } from '@/components/ui';
import { statusCopy, type VerificationSubmission } from '@/lib/verification/types';
import { fireHaptic } from '@/lib/feedback';

export function VerificationCard({ submission, compact = false }: { submission: VerificationSubmission; compact?: boolean }) {
  const copy = statusCopy[submission.status];
  const isPass = submission.status === 'passed';
  useEffect(() => {
    if (submission.resolutionType === 'sla_auto_pass') {
      void fireHaptic('light').catch(() => undefined);
    }
  }, [submission.resolutionType]);
  return (
    <View accessible accessibilityLabel={`${copy.title}. ${copy.body}`} style={[styles.card, compact && styles.cardCompact, isPass && styles.passed]} testID={`verification-${submission.status}`}>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.label}>{copy.label}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={styles.title}>{copy.title}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.body}>{copy.body}</Text>
      <View style={styles.rule} />
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.sla}>PUBLISHED SLA · WITHIN 24 HOURS</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.slaBody}>
        If review is not resolved by {new Date(submission.slaDeadline).toLocaleString()}, this proof automatically passes in your favour. A timeout can never count against you.
      </Text>
    </View>
  );
}

export function AppealAction({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
  return (
    <InteractivePressable accessibilityHint="Sends this failed decision to a different human reviewer" accessibilityLabel="Appeal this decision" accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed, focused, hovered }) => [styles.appeal, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused, disabled && styles.disabled]} testID="appeal-decision">
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.appealText}>Appeal this decision</Text>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  appeal: { alignItems: 'center', borderColor: color.textPrimary, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52, padding: space.md },
  appealText: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.body },
  body: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  card: { borderBottomColor: color.textSecondary, borderBottomWidth: StyleSheet.hairlineWidth, borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth, gap: space.sm, paddingVertical: space.lg },
  cardCompact: { gap: space.xs, padding: space.md },
  disabled: { opacity: 0.5 },
  focused: { borderColor: color.textPrimary, borderWidth: 2 },
  hovered: { opacity: 0.9 },
  label: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figure, fontSize: type.size.caption, letterSpacing: 1 },
  passed: {},
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  rule: { backgroundColor: color.textSecondary, height: StyleSheet.hairlineWidth, marginVertical: space.sm },
  sla: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.caption, letterSpacing: 0.6 },
  slaBody: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.xl },
});
