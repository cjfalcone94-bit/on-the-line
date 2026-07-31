import { Image, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '@/design/tokens';
import { InteractivePressable } from '@/components/ui';

export function FixedChecklist({ criteria, compact = false }: { criteria: readonly string[]; compact?: boolean }) {
  return (
    <View accessibilityLabel="Fixed proof checklist. Read only." style={[styles.checklist, compact && styles.checklistCompact]} testID="fixed-proof-checklist">
      <View style={styles.checklistHeading}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.label}>FIXED CHECKLIST</Text>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.readOnly}>READ ONLY</Text>
      </View>
      {criteria.map((criterion, index) => (
        <View key={criterion} style={styles.criterion}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.criterionText}>{criterion}</Text>
        </View>
      ))}
    </View>
  );
}

export function PhotoPreview({ uri, onRetake }: { uri: string; onRetake: () => void }) {
  return (
    <View style={styles.previewWrap}>
      <Image accessibilityLabel="Your selected proof photo" source={{ uri }} style={styles.preview} />
      <InteractivePressable accessibilityRole="button" onPress={onRetake} style={({ pressed, focused, hovered }) => [styles.retake, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.retakeText}>Retake or choose another</Text>
      </InteractivePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  checklist: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.sm, padding: space.md },
  checklistCompact: { gap: space.xs, padding: space.sm },
  checklistHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  criterion: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm },
  criterionText: { color: color.textPrimary, flex: 1, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  focused: { borderColor: color.textPrimary, borderRadius: space.xs, borderWidth: 2 },
  hovered: { opacity: 0.82 },
  label: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 11, letterSpacing: 1 },
  number: { color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.caption },
  preview: { borderRadius: space.md, flex: 1, width: '100%' },
  previewWrap: { flex: 1, gap: space.sm, minHeight: 180 },
  pressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  readOnly: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 10 },
  retake: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  retakeText: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.caption, textDecorationLine: 'underline' },
});
