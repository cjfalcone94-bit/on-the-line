import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, SafeAreaView, StyleSheet, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { GlassReceiptCard } from '@/components/glass-receipt';
import { PrimaryButton, StatePanel, TextAction } from '@/components';
import { color, motion, space } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { getGlassReceipt } from '@/lib/settlement/service';
import type { GlassReceipt } from '@/lib/settlement/types';

type ViewState = 'loading' | 'ready' | 'error';

export function generateStaticParams() {
  return [{ commitmentId: 'demo-success' }, { commitmentId: 'demo-fail' }];
}

export default function SettleScreen() {
  const { commitmentId } = useLocalSearchParams<{ commitmentId: string }>();
  const [receipt, setReceipt] = useState<GlassReceipt>();
  const [state, setState] = useState<ViewState>('loading');
  const [visibleLines, setVisibleLines] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sharingAvailable, setSharingAvailable] = useState<boolean | null>(null);
  const [shareError, setShareError] = useState(false);
  const exportRef = useRef<View>(null);
  const player = useAudioPlayer(require('@/assets/sounds/ledger-riffle.wav'));

  const load = useCallback(async () => {
    if (!commitmentId) return setState('error');
    setState('loading');
    try {
      const next = await getGlassReceipt(commitmentId);
      setReceipt(next);
      setState('ready');
      track('glass_receipt_viewed', { outcome: next.outcome });
    } catch {
      setState('error');
    }
  }, [commitmentId]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    Sharing.isAvailableAsync().then(setSharingAvailable).catch(() => setSharingAvailable(false));
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (!receipt) return;
    if (reduceMotion) {
      const revealTimer = setTimeout(() => setVisibleLines(5), 0);
      return () => clearTimeout(revealTimer);
    }
    // Expo Audio exposes volume as a mutable native-player property.
    // eslint-disable-next-line react-hooks/immutability
    player.volume = 0.18;
    const timers = Array.from({ length: 5 }, (_, index) =>
      setTimeout(() => {
        setVisibleLines(index + 1);
        player.seekTo(0).then(() => player.play()).catch(() => undefined);
      }, motion.duration.emphasized * (index + 1)));
    const hapticTimer = setTimeout(() => {
      const cue = receipt.outcome === 'success'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        : Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      cue.catch(() => undefined);
    }, motion.duration.emphasized * 5);
    return () => [...timers, hapticTimer].forEach(clearTimeout);
  }, [player, receipt, reduceMotion]);

  const share = async () => {
    if (!exportRef.current || !sharingAvailable) {
      setShareError(true);
      return;
    }
    setShareError(false);
    try {
      const uri = await captureRef(exportRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share your Glass Receipt', mimeType: 'image/png', UTI: 'public.png' });
    } catch {
      setShareError(true);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="settle-screen">
      <View style={styles.container}>
        <TextAction align="end" onPress={() => router.replace('/catalog')}>Close</TextAction>
        {state === 'loading' ? <ReceiptSkeleton /> : null}
        {state === 'error' ? <StatePanel title="Receipt is unavailable." body="Check your connection and try again. No settlement state changed." actionLabel="Try again" onAction={load} /> : null}
        {receipt ? (
          <>
            <GlassReceiptCard receipt={receipt} visibleLines={visibleLines} />
            {sharingAvailable === false || shareError ? (
              <StatePanel title="Sharing is unavailable." body="Your receipt is still saved here. Try sharing again from a device with a share service available." actionLabel={sharingAvailable ? 'Try again' : undefined} onAction={sharingAvailable ? share : undefined} />
            ) : null}
            <PrimaryButton accessibilityLabel="Share Glass Receipt" disabled={visibleLines < 5 || sharingAvailable !== true} onPress={share}>
              {sharingAvailable === null ? 'Checking sharing…' : 'Share receipt'}
            </PrimaryButton>
            <View pointerEvents="none" style={styles.exportStage}>
              <GlassReceiptCard exportMode receipt={receipt} ref={exportRef} />
            </View>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function ReceiptSkeleton() {
  return (
    <View accessibilityLabel="Loading receipt" style={styles.skeleton} testID="receipt-skeleton">
      {[80, 180, 260, 240, 280, 220].map((width, index) => <View key={width} style={[styles.skeletonLine, { opacity: 1 - index * 0.1, width }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: space.sm, justifyContent: 'center', paddingBottom: space.sm, paddingHorizontal: space.md },
  exportStage: { left: -1000, position: 'absolute', top: 0 },
  safe: { backgroundColor: color.surface, flex: 1 },
  skeleton: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.lg, padding: space.lg },
  skeletonLine: { backgroundColor: color.textSecondary, borderRadius: space.xs, height: 18, opacity: 0.18 },
});
