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

/**
 * Catalogue as a statement, not a documentation page.
 *
 * Founder verdict on the previous treatment: "the scroll looks amateur and there
 * is too much text going on." Direction in
 * `proposals/OTL-CATALOGUE-PREMIUM.md`. Four moves, each removing or relocating
 * something rather than adding decoration:
 *
 * 1. The full acceptance criteria leave the card. The catalogue answers "which
 *    goal fits me?" — a comparison task needing short, parallel rows. The
 *    criteria answer "what am I signing?" — a reading task belonging at the
 *    point of signature, on the detail screen above the stake selector. They
 *    stay in the accessibility label, so screen-reader users lose nothing.
 * 2. The marketing summary is cut. It restated the title. One `proof` line
 *    replaces it — and that line IS the stake signal, because it says you will
 *    be checked.
 * 3. Cadence moves to a right-aligned tabular rail beside the title, like an
 *    amount column on a statement. That gives the eye a second scan axis.
 * 4. Rows inside a section touch, divided by a hairline — entries in a ledger
 *    do not float. All the air moves to the section boundaries instead:
 *    tight-tight-tight-BREATH rather than a metronome with no downbeat.
 *
 * Gold stays strictly inside the §3 allowlist here: section eyebrow, affordance
 * chevron, and the focused/pressed state. No gold fill at row level — the one
 * permitted filled gold surface per screen is the primary action, and this
 * screen has none.
 */

export function TemplateRow({ template, first, onPress }: { template: ChecklistTemplate; first: boolean; onPress: () => void }) {
  return (
    <InteractivePressable
      accessibilityHint="Opens the exact pass criteria"
      accessibilityLabel={`${template.title}. ${template.cadence}. Pass criteria: ${template.criteria.join('. ')}`}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed, focused, hovered }) => [styles.row, !first && styles.rowDivided, pressed && styles.rowPressed, hovered && styles.rowHovered, focused && styles.rowFocused]}
      testID={`template-${template.id}`}
    >
      <View style={styles.rowTop}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.rowTitle}>{template.title}</Text>
        {/* Right rail: the terms, as figures. At 1.35x Dynamic Type the title
            takes the width it needs and this rail wraps beneath it rather than
            squeezing the title to a column of single words. */}
        <View style={styles.rowRail}>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.rowTerms}>{template.cadence}</Text>
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.rowChevron}>›</Text>
        </View>
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling numberOfLines={2} style={styles.rowProof}>
        <Text style={styles.rowProofLabel}>Proof: </Text>{template.proof}
      </Text>
    </InteractivePressable>
  );
}

function CatalogSkeleton() {
  return (
    <View accessibilityLabel="Loading goal templates" style={styles.skeletonWrap} testID="catalog-loading">
      {[0, 1].map((group) => (
        <View key={group} style={styles.skeletonGroup}>
          {[0, 1, 2].map((item) => (
            <View key={item} style={[styles.skeletonRow, item > 0 && styles.rowDivided]}>
              <LedgerSkeletonLine height={18} width="58%" />
              <LedgerSkeletonLine height={12} width="76%" />
            </View>
          ))}
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
          <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling accessibilityRole="header" style={styles.sectionEyebrow}>{section.title}</Text>
          <View style={styles.group}>
            {section.data.map((item, index) => <TemplateRow key={item.id} template={item} first={index === 0} onPress={() => {
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
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  backFocused: { borderColor: color.gold, borderRadius: space.xs, borderWidth: 2 },
  backHovered: { opacity: 0.82 },
  backLabel: { color: color.gold, fontFamily: type.family.body, fontSize: type.size.body },
  backPressed: { opacity: 0.65, transform: [{ scale: 0.98 }] },
  // One raised container per section — the receipt. Rows live inside it and are
  // separated by hairlines only, so the group reads as a single object.
  group: { backgroundColor: color.surfaceRaised, borderColor: color.surfaceRaised, borderRadius: space.sm, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  headerWrap: { gap: space.xs, paddingHorizontal: space.lg, paddingBottom: space.md },
  list: { paddingBottom: space.xl, paddingHorizontal: space.lg },
  row: { paddingHorizontal: space.md, paddingVertical: space.md, transform: [{ scale: 1 }] },
  rowChevron: { color: color.gold, fontSize: type.size.body },
  rowDivided: { borderTopColor: color.surface, borderTopWidth: StyleSheet.hairlineWidth },
  rowFocused: { borderColor: color.gold, borderWidth: 2 },
  rowHovered: { opacity: 0.92 },
  // Pressed state tints toward gold rather than filling with it — an active
  // interaction is on the §3 allowlist, a gold fill at row level is not.
  rowPressed: { backgroundColor: color.surface, opacity: 0.9 },
  rowProof: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, marginTop: space.xs },
  rowProofLabel: { color: color.textSecondary, fontFamily: type.family.bodyBold },
  rowRail: { alignItems: 'baseline', flexDirection: 'row', flexShrink: 0, gap: space.xs },
  rowTerms: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figure, fontSize: type.size.caption },
  rowTitle: { color: color.textPrimary, flexShrink: 1, fontFamily: type.family.bodyBold, fontSize: type.size.body },
  rowTop: { alignItems: 'baseline', flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, justifyContent: 'space-between' },
  // The largest gap on the screen sits between sections — the BREATH.
  section: { marginTop: space.xl },
  sectionEyebrow: { color: color.gold, fontFamily: type.family.bodyBold, fontSize: type.size.caption, letterSpacing: 1.4, marginBottom: space.sm, textTransform: 'uppercase' },
  skeletonGroup: { backgroundColor: color.surfaceRaised, borderRadius: space.sm, marginTop: space.xl, overflow: 'hidden' },
  skeletonRow: { gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.md },
  skeletonWrap: { paddingHorizontal: space.lg },
  stateWrap: { paddingHorizontal: space.lg, paddingTop: space.lg },
});
