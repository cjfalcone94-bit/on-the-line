import { StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '@/design/tokens';
import { InteractivePressable } from '@/components/ui';
import { findTemplate } from '@/lib/catalog/templates';
import { findCharity } from '@/lib/commit/charities';
import { formatMoney } from '@/lib/commit/money';
import type { CommitmentRecordItem } from '@/lib/record/types';

export function CommitmentRecordEmpty({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty} testID="commitment-record-empty">
      <View accessibilityLabel="An empty commitment ledger waiting for its first entry." style={styles.emptyLedger}>
        <View style={styles.emptyRule} />
        <View style={styles.emptyRule} />
        <View style={styles.emptyRule} />
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} style={styles.emptyCopy}>No commitments yet. Pick a goal, set a stake, and we&apos;ll hold you to it — fairly.</Text>
      <InteractivePressable accessibilityRole="button" onPress={onBrowse} style={({ pressed, focused, hovered }) => [styles.secondaryButton, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}><Text maxFontSizeMultiplier={type.maxScale} style={styles.secondaryLabel}>Browse goals</Text></InteractivePressable>
    </View>
  );
}

export function CommitmentRecordCard({ item, onReceipt, onRecommit }: { item: CommitmentRecordItem; onReceipt: () => void; onRecommit: () => void }) {
  const template = findTemplate(item.templateId);
  const charity = findCharity(item.charityId);
  const outcome = item.outcome === 'success' ? 'SETTLED · SUCCESS' : 'SETTLED · FORFEIT';
  return (
    <View accessible accessibilityLabel={`${template?.title ?? 'Past commitment'}, ${outcome}`} style={styles.card} testID={`record-${item.commitmentId}`}>
      <View style={styles.row}><Text maxFontSizeMultiplier={type.maxScale} style={[styles.outcome, item.outcome === 'forfeit' && styles.forfeit]}>{outcome}</Text><Text maxFontSizeMultiplier={type.maxScale} style={styles.date}>{new Date(item.settledAt).toLocaleDateString()}</Text></View>
      <Text maxFontSizeMultiplier={type.maxScale} accessibilityRole="header" style={styles.title}>{template?.title ?? 'Archived goal'}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} style={styles.meta}>{formatMoney(item.stakeCents)} stake · {charity?.name ?? item.charityId}</Text>
      <View style={styles.actions}>
        <InteractivePressable accessibilityRole="button" onPress={onReceipt} style={({ pressed, focused, hovered }) => [styles.linkButton, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]} testID={`receipt-${item.commitmentId}`}><Text maxFontSizeMultiplier={type.maxScale} style={styles.link}>Glass Receipt</Text></InteractivePressable>
        <InteractivePressable accessibilityRole="button" onPress={onRecommit} style={({ pressed, focused, hovered }) => [styles.linkButton, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]} testID={`recommit-${item.commitmentId}`}><Text maxFontSizeMultiplier={type.maxScale} style={styles.link}>Re-commit</Text></InteractivePressable>
      </View>
    </View>
  );
}

export function CommitmentRecordSkeleton() {
  return <View accessibilityLabel="Loading commitment record" style={styles.card} testID="record-skeleton">{[96, 220, 160].map((width) => <View key={width} style={[styles.skeleton, { width }]} />)}</View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  card: { backgroundColor: color.surfaceRaised, borderColor: color.textSecondary, borderRadius: space.md, borderWidth: StyleSheet.hairlineWidth, gap: space.sm, padding: space.md },
  date: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 10 },
  empty: { gap: space.md },
  emptyCopy: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  emptyLedger: { borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth, gap: space.ledgerLine, paddingVertical: space.lg },
  emptyRule: { backgroundColor: color.textSecondary, height: StyleSheet.hairlineWidth, opacity: 0.35 },
  forfeit: { color: color.clayRed },
  focused: { borderColor: color.textPrimary, borderWidth: 2 },
  hovered: { opacity: 0.9 },
  link: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.caption },
  linkButton: { alignItems: 'center', borderColor: color.textSecondary, borderRadius: space.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: space.sm },
  meta: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption },
  outcome: { color: color.textPrimary, fontFamily: type.family.monoBold, fontSize: 10, letterSpacing: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { alignItems: 'center', borderColor: color.textPrimary, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52 },
  secondaryLabel: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.body },
  skeleton: { backgroundColor: color.textSecondary, borderRadius: space.xs, height: 18, opacity: 0.18 },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg },
});
