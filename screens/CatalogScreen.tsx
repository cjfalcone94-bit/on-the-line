import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InteractivePressable, LedgerSkeletonLine, ScreenEntrance, ScreenHeader, ScreenScaffold, StatePanel } from '@/components';
import { color, space, tabularNums, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { groupTemplates, type ChecklistTemplate } from '@/lib/catalog/templates';
import { catalogQuery } from '@/lib/queries';
import { fireHaptic } from '@/lib/feedback';

export function TemplateCard({ template, onPress }: { template: ChecklistTemplate; onPress: () => void }) {
  return (
    <InteractivePressable
      accessibilityHint="Opens the exact pass criteria"
      accessibilityLabel={`${template.title}. ${template.cadence}. Pass criteria: ${template.criteria.join('. ')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, focused, hovered }) => [styles.card, pressed && styles.cardPressed, hovered && styles.cardHovered, focused && styles.cardFocused]}
      testID={`template-${template.id}`}
    >
      <View style={styles.cardHeading}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.cardTitle}>{template.title}</Text>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.arrow}>›</Text>
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.cadence}>{template.cadence}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling numberOfLines={2} style={styles.summary}>{template.summary}</Text>
      <View style={styles.criteria}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.criteriaLabel}>WHAT COUNTS</Text>
        {template.criteria.map((criterion) => (
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling key={criterion} numberOfLines={2} style={styles.criterion}>— {criterion}</Text>
        ))}
      </View>
    </InteractivePressable>
  );
}

function CatalogSkeleton() {
  return (
    <View accessibilityLabel="Loading goal templates" style={styles.skeletonWrap} testID="catalog-loading">
      {[0, 1, 2].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <LedgerSkeletonLine height={22} width="70%" />
          <LedgerSkeletonLine width="42%" />
          <LedgerSkeletonLine />
          <LedgerSkeletonLine width="88%" />
        </View>
      ))}
    </View>
  );
}

export default function CatalogScreen() {
  const query = useQuery(catalogQuery);

  useEffect(() => {
    track('template_catalog_viewed');
  }, []);
  useEffect(() => {
    if (query.isError) void fireHaptic('warning').catch(() => undefined);
  }, [query.isError]);

  const sections = groupTemplates(query.data ?? []);
  return (
    <ScreenScaffold header={<ScreenEntrance direction="right" style={styles.headerWrap}>
        <InteractivePressable accessibilityLabel="How this works" accessibilityRole="button" hitSlop={12} onPress={() => router.back()} style={({ pressed, focused, hovered }) => [styles.back, pressed && styles.backPressed, hovered && styles.backHovered, focused && styles.backFocused]}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.backLabel}>‹ How this works</Text>
        </InteractivePressable>
        <ScreenHeader eyebrow="Goal catalog" title="Pick a clear target." body="Every checklist is fixed up front. You see exactly what counts before making any commitment." />
      </ScreenEntrance>} testID="catalog-screen">
      {query.isPending ? <CatalogSkeleton /> : query.isError ? (
        <View style={styles.stateWrap}><StatePanel title="The catalog didn’t load." body="Nothing changed. Try loading the templates again." actionLabel="Try again" onAction={() => query.refetch()} /></View>
      ) : sections.length === 0 ? (
        <View style={styles.stateWrap}><StatePanel title="No templates yet." body="There are no goal checklists to browse right now." actionLabel="Check again" onAction={() => query.refetch()} /></View>
      ) : (
        <View style={styles.list}>{sections.map((section) => <View key={section.title}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={styles.sectionTitle}>{section.title}</Text>
          {section.data.map((item) => <TemplateCard key={item.id} template={item} onPress={() => {
            track('template_selected', { template_id: item.id });
            router.push({ pathname: '/template/[templateId]', params: { templateId: item.id } });
          }} />)}
        </View>)}</View>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  arrow: { color: color.gold, fontSize: type.size.xl },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backFocused: { borderColor: color.gold, borderRadius: space.xs, borderWidth: 2 },
  backHovered: { opacity: 0.82 },
  backLabel: { color: color.gold, fontFamily: type.family.body, fontSize: type.size.body },
  backPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  cadence: { ...tabularNums, color: color.gold, fontFamily: type.family.figure, fontSize: type.size.caption },
  card: { borderBottomColor: color.textSecondary, borderBottomWidth: StyleSheet.hairlineWidth, gap: space.sm, marginBottom: space.sm, paddingBottom: space.lg, paddingTop: space.md, transform: [{ scale: 1 }] },
  cardFocused: { borderColor: color.gold, borderWidth: 2 },
  cardHovered: { opacity: 0.9 },
  cardHeading: { alignItems: 'center', flexDirection: 'row', gap: space.sm, justifyContent: 'space-between' },
  cardPressed: { opacity: 0.88, transform: [{ scale: 0.99 }] },
  cardTitle: { color: color.textPrimary, flex: 1, fontFamily: type.family.display, fontSize: type.size.lg },
  criteria: { borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth, gap: space.xs, paddingTop: space.sm },
  criteriaLabel: { ...tabularNums, color: color.gold, fontFamily: type.family.figure, fontSize: 11, letterSpacing: 1 },
  criterion: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  headerWrap: { gap: space.xs, paddingHorizontal: space.lg, paddingBottom: space.md },
  list: { paddingBottom: space.xl, paddingHorizontal: space.lg },
  sectionTitle: { backgroundColor: color.surface, borderLeftColor: color.gold, borderLeftWidth: 2, color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.xl, marginTop: space.sm, paddingBottom: space.sm, paddingLeft: space.sm, paddingTop: space.md },
  skeletonCard: { borderBottomColor: color.textSecondary, borderBottomWidth: StyleSheet.hairlineWidth, gap: space.md, paddingBottom: space.lg, paddingTop: space.md },
  skeletonWrap: { gap: space.md, paddingHorizontal: space.lg },
  stateWrap: { paddingHorizontal: space.lg, paddingTop: space.lg },
  summary: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
});
