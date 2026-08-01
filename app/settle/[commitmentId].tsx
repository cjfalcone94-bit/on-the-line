import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { GlassReceiptCard } from '@/components/glass-receipt';
import { InteractivePressable, LedgerSkeletonLine, PrimaryButton, SandboxBadge, ScreenEntrance, StatePanel, TextAction } from '@/components';
import { color, motion, space, tabularNums, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { getSoundEnabled, setSoundEnabled as persistSoundEnabled } from '@/lib/preferences/sound';
import { getGlassReceipt } from '@/lib/settlement/service';
import type { GlassReceipt } from '@/lib/settlement/types';
import { fireHaptic } from '@/lib/feedback';
import { env } from '@/lib/env';

type ViewState = 'loading' | 'ready' | 'error';

export function generateStaticParams() {
  return [{ commitmentId: 'demo-success' }, { commitmentId: 'demo-fail' }];
}

export default function SettleScreen() {
  const compact = useWindowDimensions().height <= 700;
  const { commitmentId } = useLocalSearchParams<{ commitmentId: string }>();
  const [receipt, setReceipt] = useState<GlassReceipt>();
  const [state, setState] = useState<ViewState>('loading');
  const [visibleLines, setVisibleLines] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [sharingAvailable, setSharingAvailable] = useState<boolean | null>(null);
  const [shareError, setShareError] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
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
      void fireHaptic('warning').catch(() => undefined);
    }
  }, [commitmentId]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    getSoundEnabled().then(setSoundEnabled).catch(() => undefined);
    Sharing.isAvailableAsync().then(setSharingAvailable).catch(() => setSharingAvailable(false));
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
    Promise.resolve().then(load);
  }, [load]);

  useEffect(() => {
    if (!receipt) return;
    if (soundEnabled) {
      // Expo Audio exposes volume as a mutable native-player property.
      // eslint-disable-next-line react-hooks/immutability
      player.volume = 0.18;
      player.seekTo(0).then(() => player.play()).catch(() => undefined);
    }
    const interval = reduceMotion ? motion.duration.fast : motion.duration.emphasized;
    const timers = Array.from({ length: 5 }, (_, index) =>
      setTimeout(() => {
        setVisibleLines(index + 1);
      }, interval * (index + 1)));
    const hapticTimer = setTimeout(() => {
      void fireHaptic(receipt.outcome === 'success' ? 'success' : 'rigid').catch(() => undefined);
    }, interval * 5 + motion.duration.fast);
    return () => [...timers, hapticTimer].forEach(clearTimeout);
  }, [player, receipt, reduceMotion, soundEnabled]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    void persistSoundEnabled(next);
  };

  const share = async () => {
    if (!exportRef.current || !sharingAvailable) {
      setShareError(true);
      void fireHaptic('warning').catch(() => undefined);
      return;
    }
    setShareError(false);
    try {
      const uri = await captureRef(exportRef, { format: 'png', quality: 1, result: 'tmpfile' });
      await Sharing.shareAsync(uri, { dialogTitle: 'Share your Glass Receipt', mimeType: 'image/png', UTI: 'public.png' });
    } catch {
      setShareError(true);
      void fireHaptic('warning').catch(() => undefined);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="settle-screen">
      <ScreenEntrance direction="right" style={[styles.container, compact && styles.containerCompact]}>
        <TextAction align="end" onPress={() => router.replace('/catalog')}>Close</TextAction>
        {env.sandbox ? <SandboxBadge /> : null}
        {state === 'loading' ? <ReceiptSkeleton /> : null}
        {state === 'error' ? <StatePanel title="Receipt is unavailable." body="Check your connection and try again. No settlement state changed." actionLabel="Try again" onAction={load} /> : null}
        {receipt ? (
          <>
            <GlassReceiptCard compact={compact} receipt={receipt} visibleLines={visibleLines} />
            <InteractivePressable
              accessibilityLabel={`Receipt sound ${soundEnabled ? 'on' : 'off'}`}
              accessibilityRole="switch"
              accessibilityState={{ checked: soundEnabled }}
              haptic="selection"
              onPress={toggleSound}
              style={({ pressed }) => [styles.soundControl, pressed && styles.soundPressed]}
            >
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.soundLabel}>RECEIPT SOUND</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.soundValue}>{soundEnabled ? 'ON' : 'OFF'}</Text>
            </InteractivePressable>
            {sharingAvailable === false || shareError ? (
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.shareUnavailable}>Sharing unavailable here · your receipt is still saved.</Text>
            ) : null}
            <PrimaryButton accessibilityLabel="Share Glass Receipt" disabled={visibleLines < 5 || sharingAvailable !== true} onPress={share}>
              {sharingAvailable === null ? 'Checking sharing…' : 'Share receipt'}
            </PrimaryButton>
            <TextAction align="center" onPress={() => router.replace('/record')}>View Commitment Record</TextAction>
            <View pointerEvents="none" style={styles.exportStage}>
              <GlassReceiptCard exportMode receipt={receipt} ref={exportRef} />
            </View>
          </>
        ) : null}
      </ScreenEntrance>
    </SafeAreaView>
  );
}

function ReceiptSkeleton() {
  return (
    <View accessibilityLabel="Loading receipt" style={styles.skeleton} testID="receipt-skeleton">
      {[80, 180, 260, 240, 280, 220].map((width) => <LedgerSkeletonLine height={18} key={width} width={width} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: space.sm, justifyContent: 'center', paddingBottom: space.sm, paddingHorizontal: space.md },
  containerCompact: { gap: space.xs, paddingBottom: space.xs, paddingHorizontal: space.sm },
  exportStage: { left: -1000, position: 'absolute', top: 0 },
  safe: { backgroundColor: color.surface, flex: 1 },
  shareUnavailable: { borderLeftColor: color.textSecondary, borderLeftWidth: 2, color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, paddingLeft: space.sm },
  skeleton: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.lg, padding: space.lg },
  soundControl: { alignItems: 'center', borderBottomColor: color.surfaceRaised, borderBottomWidth: 1, borderTopColor: color.surfaceRaised, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 44, paddingHorizontal: space.xs },
  soundLabel: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figure, fontSize: 11, letterSpacing: 1 },
  soundPressed: { opacity: 0.65 },
  soundValue: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figureBold, fontSize: type.size.caption },
});
