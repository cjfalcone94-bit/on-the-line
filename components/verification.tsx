import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '@/design/tokens';
import { statusCopy, type VerificationSubmission } from '@/lib/verification/types';

export function VerificationCard({ submission }: { submission: VerificationSubmission }) {
  const copy = statusCopy[submission.status];
  const isPass = submission.status === 'passed';
  return (
    <View accessible accessibilityLabel={`${copy.title}. ${copy.body}`} style={[styles.card, isPass && styles.passed]} testID={`verification-${submission.status}`}>
      <Text allowFontScaling style={[styles.label, isPass && styles.passLabel]}>{copy.label}</Text>
      <Text allowFontScaling accessibilityRole="header" style={styles.title}>{copy.title}</Text>
      <Text allowFontScaling style={styles.body}>{copy.body}</Text>
      <View style={styles.rule} />
      <Text allowFontScaling style={styles.sla}>PUBLISHED SLA · WITHIN 24 HOURS</Text>
      <Text allowFontScaling style={styles.slaBody}>
        If review is not resolved by {new Date(submission.slaDeadline).toLocaleString()}, this proof automatically passes in your favour. A timeout can never count against you.
      </Text>
    </View>
  );
}

export function AppealAction({ disabled, onPress }: { disabled?: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityHint="Sends this failed decision to a different human reviewer" accessibilityLabel="Appeal this decision" accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.appeal, pressed && styles.pressed, disabled && styles.disabled]} testID="appeal-decision">
      <Text allowFontScaling style={styles.appealText}>Appeal this decision</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  appeal: { alignItems: 'center', borderColor: color.textPrimary, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52, padding: space.md },
  appealText: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, fontWeight: type.weight.semibold },
  body: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  card: { backgroundColor: color.surfaceRaised, borderColor: color.textSecondary, borderRadius: space.md, borderWidth: 1, gap: space.sm, padding: space.lg },
  disabled: { opacity: 0.5 },
  label: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption, letterSpacing: 1 },
  passed: {},
  passLabel: { color: color.gold },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  rule: { backgroundColor: color.textSecondary, height: StyleSheet.hairlineWidth, marginVertical: space.sm },
  sla: { color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.caption, letterSpacing: 0.6 },
  slaBody: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.xl, fontWeight: type.weight.semibold },
});
