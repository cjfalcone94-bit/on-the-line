import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { PrimaryButton, ScreenEntrance, ScreenHeader, ScreenScaffold, StatePanel, TextAction } from '@/components';
import { CriteriaCard, CriteriaRow, Divider, NextStepRow, ReassuranceRow, SectionLabel } from '@/components/premium';
import { color, space, tabularNums, type } from '@/design/tokens';
import { findTemplate } from '@/lib/catalog/templates';

/**
 * Goal detail — reads as opening the terms of a commitment.
 *
 * The pass criteria are the most consequential component in the app, so they get
 * the contract treatment: an elevated graphite card with a gold edge, a shield
 * mark, and numbered clauses rather than bullets. A bullet is a list; a number
 * is a clause you are agreeing to. Gold is limited to the mark, the numbers and
 * the micro heading — the rule text itself stays off-white, because the terms
 * must be read, not decorated.
 */
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
      footer={
        <View style={styles.footer}>
          <PrimaryButton accessibilityLabel="Set stake" onPress={() => router.push(`/commit/${template.id}`)}>Set stake</PrimaryButton>
          <ReassuranceRow>Your stake is secure. On failure, 100% goes to charity.</ReassuranceRow>
        </View>
      }
      testID="template-detail-screen"
    >
      <ScreenEntrance direction="right" style={styles.entrance}>
        <TextAction onPress={() => router.back()}>‹ Catalog</TextAction>
        <ScreenHeader compact={compact} eyebrow={template.category} title={template.title} body={template.summary} />

        <Divider />
        <View accessible accessibilityLabel={`Cadence: ${template.cadence}`} style={styles.cadenceRow}>
          <SectionLabel tone="muted">Cadence</SectionLabel>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.cadence}>{template.cadence}</Text>
        </View>

        <CriteriaCard note="These are fixed. Future submissions are checked against this exact list.">
          {template.criteria.map((criterion, index) => (
            <CriteriaRow index={index + 1} key={criterion} last={index === template.criteria.length - 1}>
              {criterion}
            </CriteriaRow>
          ))}
        </CriteriaCard>

        <NextStepRow>
          <Text testID="set-stake-hint">Next: set your stake — choose how much money to put on the line, from $5 to $1,000.</Text>
        </NextStepRow>
      </ScreenEntrance>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  cadence: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figureBold, fontSize: type.size.lg },
  cadenceRow: { gap: space.xs, paddingBottom: space.md },
  container: { gap: space.md, paddingBottom: space.md, paddingHorizontal: space.screenX },
  containerCompact: { gap: space.sm, paddingBottom: space.md, paddingHorizontal: space.md },
  entrance: { gap: space.md },
  footer: { gap: space.xs },
});
