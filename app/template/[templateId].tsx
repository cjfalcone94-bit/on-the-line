import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, ScreenHeader, StatePanel } from '@/components';
import { color, space, type } from '@/design/tokens';
import { findTemplate } from '@/lib/catalog/templates';

export default function TemplateDetailScreen() {
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const template = findTemplate(templateId);

  if (!template) {
    return (
      <SafeAreaView style={styles.safe} testID="template-not-found">
        <View style={styles.container}>
          <StatePanel title="Template not found." body="This goal checklist is no longer available." actionLabel="Back to catalog" onAction={() => router.replace('/catalog')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} testID="template-detail-screen">
      <View style={styles.container}>
        <Text allowFontScaling accessibilityRole="button" onPress={() => router.back()} style={styles.back}>‹ Catalog</Text>
        <ScreenHeader eyebrow={template.category} title={template.title} body={template.summary} />
        <View accessible accessibilityLabel={`Cadence: ${template.cadence}`} style={styles.cadenceRow}>
          <Text allowFontScaling style={styles.label}>CADENCE</Text>
          <Text allowFontScaling style={styles.cadence}>{template.cadence}</Text>
        </View>
        <View style={styles.checklist}>
          <Text allowFontScaling accessibilityRole="header" style={styles.checklistTitle}>Exact pass criteria</Text>
          <Text allowFontScaling style={styles.explainer}>These are fixed. Future submissions are checked against this exact list.</Text>
          {template.criteria.map((criterion, index) => (
            <View accessible accessibilityLabel={`Criterion ${index + 1}: ${criterion}`} key={criterion} style={styles.criterionRow}>
              <Text allowFontScaling style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              <Text allowFontScaling style={styles.criterion}>{criterion}</Text>
            </View>
          ))}
        </View>
        <PrimaryButton accessibilityLabel={`Commit to ${template.title}`} onPress={() => router.push(`/commit/${template.id}`)}>
          Set stake
        </PrimaryButton>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, minHeight: 44, paddingVertical: space.sm },
  cadence: { color: color.gold, fontFamily: type.family.mono, fontSize: type.size.body },
  cadenceRow: { borderBottomColor: color.surfaceRaised, borderBottomWidth: 1, borderTopColor: color.surfaceRaised, borderTopWidth: 1, gap: space.xs, paddingVertical: space.md },
  checklist: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.md, padding: space.md },
  checklistTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg, fontWeight: type.weight.semibold },
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.md },
  criterion: { color: color.textPrimary, flex: 1, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  criterionRow: { alignItems: 'flex-start', borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: space.md, paddingTop: space.sm },
  explainer: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  label: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 11, letterSpacing: 1 },
  number: { color: color.gold, fontFamily: type.family.mono, fontSize: type.size.caption, paddingTop: space.xs },
  safe: { backgroundColor: color.surface, flex: 1 },
});
