/* React Native Animated values are intentionally stable refs consumed by native animated styles. */
/* eslint-disable react-hooks/refs */
import { forwardRef, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { color, motion, space, type } from '@/design/tokens';
import type { GlassReceipt } from '@/lib/settlement/types';

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export type ReceiptLine = Readonly<{ label: string; value: string; detail?: string }>;

export function receiptLines(receipt: GlassReceipt): ReceiptLine[] {
  return receipt.outcome === 'success'
    ? [
      { label: 'Stake authorization', value: money(receipt.stakeCents), detail: 'Released' },
      { label: 'Stake captured', value: '$0.00' },
      { label: 'Base service fee', value: money(receipt.baseFeeCents), detail: 'Paid separately at commit' },
      { label: 'Success fee', value: money(receipt.successFeeCents), detail: 'Paid separately on success' },
      { label: 'Forfeiture', value: '$0.00', detail: 'No forfeiture occurred' },
    ]
    : [
      { label: 'Stake charged', value: money(receipt.stakeCents) },
      { label: 'To charity', value: money(receipt.stakeCents), detail: receipt.charityName },
      { label: 'Base service fee', value: money(receipt.baseFeeCents), detail: 'Paid separately at commit' },
      { label: 'Success fee', value: '$0.00', detail: 'Never charged on a forfeit' },
      { label: 'Platform kept', value: '$0.00', detail: '100% of the stake routed to charity' },
    ];
}

function ReceiptRow({ accent, exportMode, ink, line, muted, testID }: {
  accent: string; exportMode: boolean; ink: string; line: ReceiptLine; muted: string; testID: string;
}) {
  const progress = useRef(new Animated.Value(exportMode ? 1 : 0)).current;
  useEffect(() => {
    if (exportMode) return;
    Animated.spring(progress, {
      damping: motion.easing.settle.damping,
      stiffness: motion.easing.settle.stiffness,
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [exportMode, progress]);
  return (
    <Animated.View
      style={[styles.line, {
        opacity: progress,
        transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
      }]}
      testID={testID}
    >
      <View style={styles.lineCopy}>
        <Text allowFontScaling style={[styles.label, { color: muted }]}>{line.label}</Text>
        {line.detail ? <Text allowFontScaling style={[styles.detail, { color: muted }]}>{line.detail}</Text> : null}
      </View>
      <Text allowFontScaling style={[styles.value, { color: line.label.startsWith('Stake') ? accent : ink }]}>{line.value}</Text>
    </Animated.View>
  );
}

export const GlassReceiptCard = forwardRef<View, {
  receipt: GlassReceipt; visibleLines?: number; exportMode?: boolean;
}>(({ receipt, visibleLines = 5, exportMode = false }, ref) => {
  const lines = receiptLines(receipt);
  const ink = exportMode ? color.textOnLight : color.textPrimary;
  const muted = exportMode ? '#595959' : color.textSecondary;
  const accent = receipt.outcome === 'success' ? color.gold : color.clayRed;
  return (
    <View collapsable={false} ref={ref} style={[styles.card, exportMode && styles.exportCard]} testID={exportMode ? 'glass-receipt-export' : 'glass-receipt'}>
      <View style={styles.brandRow}>
        {exportMode ? (
          <Text style={[styles.brand, { color: ink }]}>ON THE <Text style={styles.gold}>LINE</Text></Text>
        ) : (
          <Image
            accessibilityLabel="On the Line"
            resizeMode="contain"
            source={require('@/assets/logo/wordmark-horizontal.png')}
            style={styles.wordmark}
          />
        )}
        <View style={styles.ledgerMark} />
      </View>
      <Text style={[styles.kicker, { color: receipt.outcome === 'forfeit' ? color.clayRed : ink }]}>{receipt.outcome === 'success' ? 'SETTLED · SUCCESS' : 'SETTLED · FORFEIT'}</Text>
      <Text accessibilityRole="header" style={[styles.title, { color: ink }]}>Glass Receipt</Text>
      <View style={[styles.rule, { backgroundColor: muted }]} />
      {lines.map((line, index) => (exportMode || index < visibleLines) ? (
        <ReceiptRow
          accent={accent}
          exportMode={exportMode}
          ink={ink}
          key={line.label}
          line={line}
          muted={muted}
          testID={`receipt-line-${index + 1}`}
        />
      ) : null)}
      <View style={[styles.rule, { backgroundColor: muted }]} />
      <Text style={[styles.confirmation, { color: ink }]} testID="receipt-confirmation">
        {receipt.outcome === 'success'
          ? 'Your authorization was released. Nothing was captured from your stake.'
          : `Your full ${money(receipt.stakeCents)} stake was routed to ${receipt.charityName}.`}
      </Text>
      <Text style={[styles.reference, { color: muted }]}>REF {receipt.transactionReference}</Text>
      {receipt.routedReference ? <Text style={[styles.reference, { color: muted }]}>ROUTE {receipt.routedReference}</Text> : null}
      <Text style={[styles.watermark, { color: muted }]}>A clear record of where the money went · ON THE LINE</Text>
    </View>
  );
});
GlassReceiptCard.displayName = 'GlassReceiptCard';

const styles = StyleSheet.create({
  brand: { fontFamily: type.family.display, fontSize: type.size.caption, fontWeight: type.weight.bold, letterSpacing: 1.2 },
  brandRow: { alignItems: 'flex-end', flexDirection: 'row', gap: space.sm },
  card: { backgroundColor: color.surfaceRaised, borderColor: '#303030', borderRadius: space.md, borderWidth: 1, gap: space.sm, padding: space.md },
  confirmation: { fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  detail: { fontFamily: type.family.body, fontSize: 11, lineHeight: 14 },
  exportCard: { backgroundColor: color.surfaceLight, borderColor: '#D8D8D8', borderRadius: 0, minHeight: 640, padding: space.xl, width: 360 },
  gold: { color: color.gold },
  kicker: { fontFamily: type.family.mono, fontSize: 11, fontWeight: type.weight.bold, letterSpacing: 1.2 },
  label: { fontFamily: type.family.body, fontSize: type.size.caption },
  ledgerMark: { backgroundColor: color.gold, height: 2, marginBottom: 3, width: 54 },
  line: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingVertical: space.xs },
  lineCopy: { flex: 1, gap: 1, paddingRight: space.sm },
  reference: { fontFamily: type.family.mono, fontSize: 10 },
  rule: { height: StyleSheet.hairlineWidth, opacity: 0.5 },
  title: { fontFamily: type.family.display, fontSize: type.size.xl, fontWeight: type.weight.semibold },
  value: { fontFamily: type.family.mono, fontSize: type.size.body, fontWeight: type.weight.semibold },
  watermark: { fontFamily: type.family.mono, fontSize: 9, letterSpacing: 0.4, marginTop: space.sm, textAlign: 'center' },
  wordmark: { height: 24, width: 136 },
});
