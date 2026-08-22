import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { InteractivePressable, LedgerSkeletonLine, ScreenEntrance, ScreenHeader, ScreenScaffold, StatePanel } from '@/components';
import { GoalCard, SectionLabel } from '@/components/premium';
import { border, color, radius, space, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { groupTemplates, type ChecklistTemplate } from '@/lib/catalog/templates';
import { catalogQuery } from '@/lib/queries';
import { fireHaptic } from '@/lib/feedback';

/**
 * Goal catalogue — a comparison surface, not a documentation page.
 *
 * Each goal is its own compact card (icon well, title, cadence, proof) rather
 * than a row inside one large container: an individual interactive item gets its
 * own defined surface, which is what makes a list of goals read as a set of
 * instruments instead of a settings menu.
 *
 * The full acceptance criteria live on the detail screen, positioned as contract
 * terms at the point of signature. The catalogue answers "which goal fits me?";
 * the criteria answer "what am I signing?". They stay in each card's
 * accessibility label so screen-reader users lose nothing.
 *
 * "Proof:" is deliberately NOT printed as a bold label on every row — repeating
 * it twenty times is visual noise. The proof line is simply tertiary grey, which
 * reads as supporting detail without being announced.
 */

export function TemplateRow({ template, onPress }: { template: ChecklistTemplate; onPress: () => void }) {
  return (
    <GoalCard
      accessibilityHint="Opens the exact pass criteria"
      accessibilityLabel={`${template.title}. ${template.cadence}. Pass criteria: ${template.criteria.join('. ')}`}
      cadence={template.cadence}
      icon={template.icon}
      onPress={onPress}
      proof={template.proof}
      testID={`template-${template.id}`}
      title={template.title}
    />
  );
}

function CatalogSkeleton() {
  return (
    <View accessibilityLabel="Loading goal templates" style={styles.skeletonWrap} testID="catalog-loading">
      {[0, 1, 2, 3].map((item) => (
        <View key={item} style={styles.skeletonCard}>
          <View style={styles.skeletonIcon} />
          <View style={styles.skeletonBody}>
            <LedgerSkeletonLine height={16} width="56%" />
            <LedgerSkeletonLine height={11} width="38%" />
            <LedgerSkeletonLine height={11} width="72%" />
          </View>
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
        <ScreenHeader eyebrow="Goal catalog" title="Pick a clear target." body="Every rule is fixed before you commit." />
      </ScreenEntrance>} testID="catalog-screen">
      {query.isPending ? <CatalogSkeleton /> : query.isError ? (
        <View style={styles.stateWrap}><StatePanel title="The catalog didn’t load." body="Nothing changed. Try loading the templates again." actionLabel="Try again" onAction={() => query.refetch()} /></View>
      ) : sections.length === 0 ? (
        <View style={styles.stateWrap}><StatePanel title="No templates yet." body="There are no goal checklists to browse right now." actionLabel="Check again" onAction={() => query.refetch()} /></View>
      ) : (
        <View style={styles.list}>{sections.map((section) => <View key={section.title} style={styles.section}>
          {/* Category labels sit OUTSIDE the cards — they group, they are not content. */}
          <SectionLabel>{section.title}</SectionLabel>
          <View style={styles.cards}>
            {section.data.map((item) => <TemplateRow key={item.id} template={item} onPress={() => {
              track('template_selected', { template_id: item.id });
              router.push({ pathname: '/template/[templateId]', params: { templateId: item.id } });
            }} />)}
          </View>
        </View>)}</View>
      )}
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', justifyContent: 'center', minHeight: 44 },
  backFocused: { borderColor: color.gold, borderRadius: space.xs, borderWidth: 2 },
  backHovered: { opacity: 0.82 },
  backLabel: { color: color.gold, fontFamily: type.family.body, fontSize: type.size.body },
  backPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  cards: { gap: space.betweenCards },
  headerWrap: { gap: space.xs, paddingBottom: space.md, paddingHorizontal: space.screenX },
  list: { paddingBottom: space.xl, paddingHorizontal: space.screenX },
  // 24 above the category label; the label itself owns the 12 below it.
  section: { marginTop: space.lg },
  skeletonBody: { flex: 1, gap: space.sm },
  skeletonCard: { alignItems: 'center', backgroundColor: color.surfaceRaised, borderColor: color.stroke, borderRadius: radius.card, borderWidth: border.hairline, flexDirection: 'row', gap: space.md, minHeight: 84, paddingHorizontal: space.md, paddingVertical: space.smd },
  skeletonIcon: { backgroundColor: '#151515', borderColor: '#292929', borderRadius: radius.icon, borderWidth: border.hairline, height: 48, width: 48 },
  skeletonWrap: { gap: space.betweenCards, paddingHorizontal: space.screenX, paddingTop: space.lg },
  stateWrap: { paddingHorizontal: space.screenX, paddingTop: space.lg },
});
