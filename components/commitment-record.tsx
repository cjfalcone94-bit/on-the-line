import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { color, space, type } from '@/design/tokens';
import { findTemplate } from '@/lib/catalog/templates';
import { findCharity } from '@/lib/commit/charities';
import { formatMoney } from '@/lib/commit/money';
import type { CommitmentRecordItem } from '@/lib/record/types';

export function CommitmentRecordEmpty({ onBrowse }: { onBrowse: () => void }) {
  return (
    <View style={styles.empty} testID="commitment-record-empty">
      <Image accessibilityLabel="An empty dark commitment ledger waiting for its first entry." resizeMode="contain" source={require('@/assets/states/empty-commitments.png')} style={styles.art} />
      <Text style={styles.emptyCopy}>No commitments yet. Pick a goal, set a stake, and we&apos;ll hold you to it — fairly.</Text>
      <Pressable accessibilityRole="button" onPress={onBrowse} style={styles.secondaryButton}><Text style={styles.secondaryLabel}>Browse goals</Text></Pressable>
    </View>
  );
}

export function CommitmentRecordCard({ item, onReceipt, onRecommit }: { item: CommitmentRecordItem; onReceipt: () => void; onRecommit: () => void }) {
  const template = findTemplate(item.templateId);
  const charity = findCharity(item.charityId);
  const outcome = item.outcome === 'success' ? 'SETTLED · SUCCESS' : 'SETTLED · FORFEIT';
  return (
    <View accessible accessibilityLabel={`${template?.title ?? 'Past commitment'}, ${outcome}`} style={styles.card} testID={`record-${item.commitmentId}`}>
      <View style={styles.row}><Text style={[styles.outcome, item.outcome === 'forfeit' && styles.forfeit]}>{outcome}</Text><Text style={styles.date}>{new Date(item.settledAt).toLocaleDateString()}</Text></View>
      <Text accessibilityRole="header" style={styles.title}>{template?.title ?? 'Archived goal'}</Text>
      <Text style={styles.meta}>{formatMoney(item.stakeCents)} stake · {charity?.name ?? item.charityId}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onReceipt} style={styles.linkButton} testID={`receipt-${item.commitmentId}`}><Text style={styles.link}>Glass Receipt</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={onRecommit} style={styles.linkButton} testID={`recommit-${item.commitmentId}`}><Text style={styles.link}>Re-commit</Text></Pressable>
      </View>
    </View>
  );
}

export function CommitmentRecordSkeleton() {
  return <View accessibilityLabel="Loading commitment record" style={styles.card} testID="record-skeleton">{[96, 220, 160].map((width) => <View key={width} style={[styles.skeleton, { width }]} />)}</View>;
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: space.sm, marginTop: space.xs },
  art: { aspectRatio: 1.4, width: '100%' },
  card: { backgroundColor: color.surfaceRaised, borderColor: '#303030', borderRadius: space.md, borderWidth: 1, gap: space.sm, padding: space.md },
  date: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 10 },
  empty: { gap: space.md },
  emptyCopy: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  forfeit: { color: color.clayRed },
  link: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.caption, fontWeight: type.weight.semibold },
  linkButton: { alignItems: 'center', borderColor: color.textSecondary, borderRadius: space.sm, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: space.sm },
  meta: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption },
  outcome: { color: color.gold, fontFamily: type.family.mono, fontSize: 10, fontWeight: type.weight.bold, letterSpacing: 1 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  secondaryButton: { alignItems: 'center', borderColor: color.textPrimary, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52 },
  secondaryLabel: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, fontWeight: type.weight.semibold },
  skeleton: { backgroundColor: '#303030', borderRadius: space.xs, height: 18 },
  title: { color: color.textPrimary, fontFamily: type.family.display, fontSize: type.size.lg, fontWeight: type.weight.semibold },
});
