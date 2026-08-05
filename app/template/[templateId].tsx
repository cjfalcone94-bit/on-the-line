import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PrimaryButton, ScreenEntrance, ScreenHeader, ScreenScaffold, StatePanel, TextAction } from '@/components';
import { color, space, tabularNums, type } from '@/design/tokens';
import { findTemplate } from '@/lib/catalog/templates';

export default function TemplateDetailScreen() {
  const compact = useWindowDimensions().height <= 700;
  const { templateId } = useLocalSearchParams<{ templateId: string }>();
  const template = findTemplate(templateId);

  if (!template) {
    return (
      <ScreenScaffold testID="template-not-found">
        <View style={styles.container}>
          <StatePanel title="Template not found." body="This goal checklist is no longer available." actionLabel="Back to catalog" onAction={() => router.replace('/catalog')} />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      contentContainerStyle={[styles.container, compact && styles.containerCompact]}
      footer={<PrimaryButton accessibilityLabel="Set stake" onPress={() => router.push(`/commit/${template.id}`)}>Set stake</PrimaryButton>}
      testID="template-detail-screen"
    >
      <ScreenEntrance direction="right" style={styles.entrance}>
        <TextAction onPress={() => router.back()}>‹ Catalog</TextAction>
        <ScreenHeader compact={compact} eyebrow={template.category} title={template.title} body={template.summary} />
        <View accessible accessibilityLabel={`Cadence: ${template.cadence}`} style={styles.cadenceRow}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.label}>CADENCE</Text>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.cadence}>{template.cadence}</Text>
        </View>
        <View style={[styles.checklist, compact && styles.checklistCompact]}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={styles.checklistTitle}>Exact pass criteria</Text>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.explainer}>These are fixed. Future submissions are checked against this exact list.</Text>
          {template.criteria.map((criterion, index) => (
            <View accessible accessibilityLabel={`Criterion ${index + 1}: ${criterion}`} key={criterion} style={styles.criterionRow}>
              <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.number}>{String(index + 1).padStart(2, '0')}</Text>
              <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.criterion}>{criterion}</Text>
            </View>
          ))}
        </View>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.nextStep} testID="set-stake-hint">Next: set your stake — choose how much money to put on the line, from $5 to $1,000.</Text>
      </ScreenEntrance>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  cadence: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.body },
  cadenceRow: { borderBottomColor: color.surfaceRaised, borderBottomWidth: 1, borderTopColor: color.surfaceRaised, borderTopWidth: 1, gap: space.xs, paddingVertical: space.md },
  checklist: { borderLeftColor: color.gold, borderLeftWidth: 2, gap: space.md, paddingLeft: space.md, paddingVertical: space.sm },
  checklistCompact: { gap: space.sm, padding: space.sm },
  checklistTitle: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg },
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingHorizontal: space.lg, paddingBottom: space.md },
  containerCompact: { gap: space.sm, paddingHorizontal: space.md, paddingBottom: space.md },
  criterion: { color: color.textPrimary, flex: 1, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  criterionRow: { alignItems: 'flex-start', borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: space.md, paddingTop: space.sm },
  explainer: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  label: { ...tabularNums, color: color.gold, fontFamily: type.family.figure, fontSize: 11, letterSpacing: 1 },
  nextStep: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  number: { ...tabularNums, color: color.gold, fontFamily: type.family.figure, fontSize: type.size.caption, paddingTop: space.xs },
  entrance: { gap: space.md },
});
