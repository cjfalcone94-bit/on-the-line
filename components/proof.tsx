import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '@/design/tokens';

export function FixedChecklist({ criteria }: { criteria: readonly string[] }) {
  return (
    <View accessibilityLabel="Fixed proof checklist. Read only." style={styles.checklist} testID="fixed-proof-checklist">
      <View style={styles.checklistHeading}>
        <Text allowFontScaling style={styles.label}>FIXED CHECKLIST</Text>
        <Text allowFontScaling style={styles.readOnly}>READ ONLY</Text>
      </View>
      {criteria.map((criterion, index) => (
        <View key={criterion} style={styles.criterion}>
          <Text allowFontScaling style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
          <Text allowFontScaling style={styles.criterionText}>{criterion}</Text>
        </View>
      ))}
    </View>
  );
}

export function PhotoPreview({ uri, onRetake }: { uri: string; onRetake: () => void }) {
  return (
    <View style={styles.previewWrap}>
      <Image accessibilityLabel="Your selected proof photo" source={{ uri }} style={styles.preview} />
      <Pressable accessibilityRole="button" onPress={onRetake} style={styles.retake}>
        <Text allowFontScaling style={styles.retakeText}>Retake or choose another</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  checklist: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.sm, padding: space.md },
  checklistHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  criterion: { alignItems: 'flex-start', flexDirection: 'row', gap: space.sm },
  criterionText: { color: color.textPrimary, flex: 1, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  label: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 11, letterSpacing: 1 },
  number: { color: color.gold, fontFamily: type.family.mono, fontSize: type.size.caption },
  preview: { borderRadius: space.md, flex: 1, width: '100%' },
  previewWrap: { flex: 1, gap: space.sm, minHeight: 180 },
  readOnly: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 10 },
  retake: { alignItems: 'center', justifyContent: 'center', minHeight: 44 },
  retakeText: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.caption, textDecorationLine: 'underline' },
});
