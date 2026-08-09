/* React Native Animated values are intentionally stable refs consumed by native animated styles. */
/* eslint-disable react-hooks/refs */
import { forwardRef, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { BrandWordmark } from '@/components/ui';
import { color, motion, space, tabularNums, type } from '@/design/tokens';
import type { GlassReceipt } from '@/lib/settlement/types';

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;
export type ReceiptLine = Readonly<{ label: string; value: string; detail?: string }>;

export function receiptLines(receipt: GlassReceipt): ReceiptLine[] {
  const sandbox = receipt.transactionReference === 'SANDBOX-NO-PAYMENT';
  if (sandbox) {
    return receipt.outcome === 'success'
      ? [
        { label: 'Mock authorization', value: money(receipt.stakeCents), detail: 'Simulated release' },
        { label: 'Real stake captured', value: '$0.00' },
        { label: 'Real base fee', value: '$0.00', detail: 'No payment in sandbox' },
        { label: 'Real success fee', value: '$0.00', detail: 'No payment in sandbox' },
        { label: 'Real forfeiture', value: '$0.00', detail: 'Simulation only' },
      ]
      : [
        { label: 'Mock stake outcome', value: money(receipt.stakeCents), detail: 'Simulated forfeit' },
        { label: 'Mock charity route', value: money(receipt.stakeCents), detail: receipt.charityName },
        { label: 'Real base fee', value: '$0.00', detail: 'No payment in sandbox' },
        { label: 'Real success fee', value: '$0.00', detail: 'No payment in sandbox' },
        { label: 'Real money moved', value: '$0.00', detail: 'Simulation only' },
      ];
  }
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
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.label, { color: muted }]}>{line.label}</Text>
        {line.detail ? <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.detail, { color: muted }]}>{line.detail}</Text> : null}
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.value, { color: line.label.startsWith('Stake') ? accent : ink }]}>{line.value}</Text>
    </Animated.View>
  );
}

export const GlassReceiptCard = forwardRef<View, {
  receipt: GlassReceipt; visibleLines?: number; exportMode?: boolean; compact?: boolean;
}>(({ receipt, visibleLines = 5, exportMode = false, compact = false }, ref) => {
  const lines = receiptLines(receipt);
  const ink = exportMode ? color.textOnLight : color.textPrimary;
  const muted = exportMode ? '#595959' : color.textSecondary;
  const accent = receipt.outcome === 'success' ? color.gold : color.clayRed;
  const sandbox = receipt.transactionReference === 'SANDBOX-NO-PAYMENT';
  return (
    <View collapsable={false} ref={ref} style={[styles.card, compact && !exportMode && styles.cardCompact, exportMode && styles.exportCard]} testID={exportMode ? 'glass-receipt-export' : 'glass-receipt'}>
      <View style={styles.brandRow}>
        {/* BrandWordmark already carries the gold ledger mark; the standalone
            gold dash only accompanies the plain-text export brand. Rendering
            both stacked a stray second dash beside the wordmark. */}
        {exportMode ? (
          <>
            <Text maxFontSizeMultiplier={type.maxScale} style={[styles.brand, { color: ink }]}>ON THE <Text maxFontSizeMultiplier={type.maxScale} style={styles.gold}>LINE</Text></Text>
            <View style={styles.ledgerMark} />
          </>
        ) : <BrandWordmark />}
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} style={[styles.kicker, { color: receipt.outcome === 'forfeit' ? color.clayRed : ink }]}>{receipt.outcome === 'success' ? 'SETTLED · SUCCESS' : 'SETTLED · FORFEIT'}</Text>
      <Text maxFontSizeMultiplier={type.maxScale} accessibilityRole="header" style={[styles.title, { color: ink }]}>Glass Receipt</Text>
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
      <Text maxFontSizeMultiplier={type.maxScale} style={[styles.confirmation, { color: ink }]} testID="receipt-confirmation">
        {sandbox
          ? `Sandbox simulation complete: ${receipt.outcome}. No card was charged and no money moved.`
          : receipt.outcome === 'success'
          ? 'Your authorization was released. Nothing was captured from your stake.'
          : `Your full ${money(receipt.stakeCents)} stake was routed to ${receipt.charityName}.`}
      </Text>
      <Text maxFontSizeMultiplier={type.maxScale} style={[styles.reference, { color: muted }]}>REF {receipt.transactionReference}</Text>
      {receipt.routedReference ? <Text maxFontSizeMultiplier={type.maxScale} style={[styles.reference, { color: muted }]}>ROUTE {receipt.routedReference}</Text> : null}
      <Text maxFontSizeMultiplier={type.maxScale} style={[styles.watermark, { color: muted }]}>A clear record of where the money went · ON THE LINE</Text>
    </View>
  );
});
GlassReceiptCard.displayName = 'GlassReceiptCard';

const styles = StyleSheet.create({
  brand: { fontFamily: type.family.displayBold, fontSize: type.size.caption, letterSpacing: 1.2 },
  brandRow: { alignItems: 'flex-end', flexDirection: 'row', gap: space.sm },
  card: { backgroundColor: color.surfaceRaised, borderColor: '#303030', borderRadius: space.md, borderWidth: 1, gap: space.sm, padding: space.md },
  cardCompact: { gap: space.xs, padding: space.sm },
  confirmation: { ...tabularNums, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  detail: { fontFamily: type.family.body, fontSize: 11, lineHeight: 14 },
  exportCard: { backgroundColor: color.surfaceLight, borderColor: '#D8D8D8', borderRadius: 0, minHeight: 640, padding: space.xl, width: 360 },
  gold: { color: color.gold },
  kicker: { ...tabularNums, fontFamily: type.family.figureBold, fontSize: 11, letterSpacing: 1.2 },
  label: { fontFamily: type.family.body, fontSize: type.size.caption },
  ledgerMark: { backgroundColor: color.gold, height: 2, marginBottom: 3, width: 54 },
  line: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42, paddingVertical: space.xs },
  lineCopy: { flex: 1, gap: 1, paddingRight: space.sm },
  reference: { ...tabularNums, fontFamily: type.family.figure, fontSize: 10 },
  rule: { height: StyleSheet.hairlineWidth, opacity: 0.5 },
  title: { fontFamily: type.family.display, fontSize: type.size.xl },
  value: { ...tabularNums, fontFamily: type.family.figureBold, fontSize: type.size.body },
  watermark: { ...tabularNums, fontFamily: type.family.figure, fontSize: 9, letterSpacing: 0.4, marginTop: space.sm, textAlign: 'center' },
});
