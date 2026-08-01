import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CommitmentRecordCard, CommitmentRecordEmpty, CommitmentRecordSkeleton } from '@/components/commitment-record';
import { ScreenEntrance, ScreenHeader, StatePanel, TextAction } from '@/components';
import { color, space, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { getCommitmentRecord } from '@/lib/record/service';
import type { CommitmentRecordItem } from '@/lib/record/types';
import { fireHaptic } from '@/lib/feedback';

type ViewState = 'loading' | 'ready' | 'error';

export default function CommitmentRecordScreen() {
  const [items, setItems] = useState<readonly CommitmentRecordItem[]>([]);
  const [state, setState] = useState<ViewState>('loading');
  const [offline, setOffline] = useState(false);
  const load = useCallback(async () => {
    setState('loading');
    try {
      const next = await getCommitmentRecord();
      setItems(next);
      setState('ready');
      track('commitment_record_viewed', { total_resolved_count: next.length });
    } catch {
      setState('error');
      void fireHaptic('warning').catch(() => undefined);
    }
  }, []);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((network) => setOffline(network.isConnected === false));
    Promise.resolve().then(load);
    return unsubscribe;
  }, [load]);
  const recommit = (item: CommitmentRecordItem) => {
    track('re_commit_from_record', { prior_template_id: item.templateId });
    router.push({ pathname: '/commit/[templateId]', params: { charityId: item.charityId, fromRecord: '1', stakeCents: String(item.stakeCents), templateId: item.templateId } });
  };
  return (
    <SafeAreaView style={styles.safe} testID="commitment-record-screen">
      <FlatList
        contentContainerStyle={styles.content}
        data={state === 'ready' ? items : []}
        keyExtractor={(item) => item.commitmentId}
        ListHeaderComponent={<ScreenEntrance direction="right" style={styles.header}><View style={styles.headerActions}><TextAction onPress={() => router.back()}>‹ Back</TextAction><TextAction align="end" onPress={() => router.push('/settings')}>Settings</TextAction></View><ScreenHeader eyebrow="Your history" title="Commitment Record" body="Every resolved goal and its itemized receipt, tied to your account." />{offline ? <Text maxFontSizeMultiplier={type.maxScale} accessibilityLiveRegion="polite" style={styles.offline}>You&apos;re offline. Reconnect to restore the latest account record.</Text> : null}</ScreenEntrance>}
        ListEmptyComponent={state === 'loading' ? <CommitmentRecordSkeleton /> : state === 'error' ? <StatePanel title="Record unavailable." body="We couldn't restore your account history. Check your connection and try again." actionLabel="Try again" onAction={load} /> : <CommitmentRecordEmpty onBrowse={() => router.replace('/catalog')} />}
        refreshControl={<RefreshControl onRefresh={load} refreshing={state === 'loading'} tintColor={color.textPrimary} />}
        renderItem={({ item, index }) => <ScreenEntrance delay={index * 45} direction="left"><CommitmentRecordCard item={item} onReceipt={() => router.push({ pathname: '/settle/[commitmentId]', params: { commitmentId: item.commitmentId } })} onRecommit={() => recommit(item)} /></ScreenEntrance>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.md, paddingBottom: space.xl, paddingHorizontal: space.lg },
  header: { gap: space.md },
  headerActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  offline: { borderLeftColor: color.clayRed, borderLeftWidth: 2, color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, paddingLeft: space.sm },
  safe: { backgroundColor: color.surface, flex: 1 },
});
