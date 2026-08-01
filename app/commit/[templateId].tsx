import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import { router, useLocalSearchParams } from 'expo-router';
import { useStripe } from '@/lib/payments/stripe';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { CharityChoice, CustomStakeInput, StakeChoice } from '@/components/commit';
import { LedgerSkeletonLine, PrimaryButton, ScreenEntrance, ScreenHeader, StatePanel, TextAction } from '@/components';
import { color, space, tabularNums, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { charities, findCharity } from '@/lib/commit/charities';
import { dollarsToCents, formatMoney, stakePresets } from '@/lib/commit/money';
import { finalizeCommitment, prepareAuthorization } from '@/lib/commit/service';
import { env } from '@/lib/env';
import { findTemplate } from '@/lib/catalog/templates';
import { scheduleProofReminder } from '@/lib/proof/reminders';
import { getSoundEnabled } from '@/lib/preferences/sound';
import { fireHaptic } from '@/lib/feedback';

type Step = 'stake' | 'charity' | 'disclosure' | 'card' | 'confirmed';

export default function CommitScreen() {
  const { templateId, stakeCents: prefillStake, charityId: prefillCharity, fromRecord } = useLocalSearchParams<{
    templateId: string; stakeCents?: string; charityId?: string; fromRecord?: string;
  }>();
  const template = findTemplate(templateId);
  const stripe = useStripe();
  const commitmentPlayer = useAudioPlayer(require('@/assets/sounds/commitment-created.wav'));
  const compact = useWindowDimensions().height <= 700;
  const [step, setStep] = useState<Step>('stake');
  const [charityPage, setCharityPage] = useState(0);
  const parsedPrefillStake = Number(prefillStake);
  const [stakeCents, setStakeCents] = useState<number | undefined>(
    fromRecord === '1' && Number.isInteger(parsedPrefillStake) ? parsedPrefillStake : undefined,
  );
  const [custom, setCustom] = useState('');
  const [charityId, setCharityId] = useState<string | undefined>(
    fromRecord === '1' && findCharity(prefillCharity) ? prefillCharity : undefined,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [expiry, setExpiry] = useState<string>();
  const [commitmentId, setCommitmentId] = useState<string>();
  const charity = findCharity(charityId);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => undefined);
  }, []);

  if (!template) {
    return <SafeAreaView style={styles.safe}><View style={styles.container}><StatePanel title="Goal unavailable." body="This template can’t be committed to right now. Nothing changed." actionLabel="Back to catalog" onAction={() => router.replace('/catalog')} /></View></SafeAreaView>;
  }

  const selectStake = (cents: number) => {
    setStakeCents(cents);
    setCustom('');
    track('stake_amount_selected');
  };

  const authorize = async () => {
    if (!stakeCents || !charity || !env.stripe?.publishableKey) {
      setError('Card authorization is unavailable right now. Nothing was charged. Check your connection and try again.');
      void fireHaptic('warning').catch(() => undefined);
      return;
    }
    setBusy(true);
    setError(undefined);
    track('card_authorization_started');
    let stakeAuthorized = false;
    try {
      const prepared = await prepareAuthorization({ templateId: template.id, stakeCents, charityId: charity.id, cadence: template.cadence });
      const initialized = await stripe.initPaymentSheet({
        merchantDisplayName: 'On the Line',
        paymentIntentClientSecret: prepared.clientSecret,
        allowsDelayedPaymentMethods: false,
        appearance: { colors: { background: color.surface, primary: color.textPrimary, componentBackground: color.surfaceRaised, primaryText: color.textPrimary, secondaryText: color.textSecondary } },
      });
      if (initialized.error) throw new Error(initialized.error.message);
      const presented = await stripe.presentPaymentSheet();
      if (presented.error) throw new Error(presented.error.message);
      stakeAuthorized = true;
      const result = await finalizeCommitment(prepared.paymentIntentId);
      setExpiry(result.authorizationExpiresAt);
      setCommitmentId(result.commitmentId);
      setStep('confirmed');
      track('commitment_created');
      void fireHaptic('success').catch(() => undefined);
      void getSoundEnabled().then(async (enabled) => {
        if (!enabled) return;
        // Expo Audio exposes volume as a mutable native-player property.
        commitmentPlayer.volume = 0.16;
        await commitmentPlayer.seekTo(0);
        commitmentPlayer.play();
      }).catch(() => undefined);
      void scheduleProofReminder(template.title, template.cadence);
    } catch {
      setError(stakeAuthorized
        ? 'We could not confirm the commitment. Do not try again yet. Check your commitments—the base fee may have been charged, but your stake was not captured.'
        : 'We could not authorize your card. Nothing was charged. Please try again.');
      void fireHaptic('warning').catch(() => undefined);
    } finally {
      setBusy(false);
    }
  };

  const primaryAction = step === 'stake'
    ? { disabled: !stakeCents, label: 'Choose charity', onPress: () => setStep('charity') }
    : step === 'charity'
      ? { disabled: !charity, label: 'Review the mechanic', onPress: () => { setStep('disclosure'); track('fee_disclosure_viewed'); } }
      : step === 'disclosure'
        ? { disabled: false, label: 'Continue to card authorization', onPress: () => setStep('card') }
        : step === 'card' && !busy && !error
          ? { disabled: false, label: 'Authorize stake and pay base fee', onPress: authorize }
          : step === 'confirmed'
            ? { disabled: !commitmentId, label: 'Submit today’s proof', onPress: () => router.replace({ pathname: '/proof/[commitmentId]', params: { commitmentId: commitmentId!, templateId: template.id } }) }
            : undefined;

  return (
    <SafeAreaView style={styles.safe} testID="commit-screen">
      <ScreenEntrance direction="right" style={[styles.container, compact && styles.containerCompact]}>
        <TextAction onPress={() => step === 'stake' ? router.back() : setStep(step === 'charity' ? 'stake' : step === 'disclosure' ? 'charity' : 'disclosure')}>‹ Back</TextAction>
        <ScrollView
          bounces={false}
          contentContainerStyle={[styles.content, compact && styles.contentCompact]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          style={styles.contentRegion}
        >
        {step === 'stake' ? (
          <>
            <ScreenHeader compact={compact} eyebrow="01 · stake" title="Put a clear amount on it." body={`${template.title} · ${template.cadence}`} />
            <View accessibilityRole="radiogroup" style={styles.grid}>
              {stakePresets.map((cents) => <StakeChoice cents={cents} key={cents} onPress={() => selectStake(cents)} selected={stakeCents === cents} />)}
            </View>
            <CustomStakeInput onChange={(value) => { setCustom(value); setStakeCents(dollarsToCents(value)); }} value={custom} />
            <Text maxFontSizeMultiplier={type.maxScale} style={styles.note}>Custom stake: $5–$1,000. Your card will be authorized, not charged.</Text>
          </>
        ) : null}
        {step === 'charity' ? (
          <>
            <ScreenHeader compact={compact} eyebrow="02 · destination" title="Choose where failure goes." body="This destination is locked after you commit. To change it, you must void and start again." />
            <View accessibilityRole="radiogroup" style={styles.charities}>
              {charities.slice(charityPage * 3, charityPage * 3 + 3).map((item) => <CharityChoice charity={item} compact={compact} key={item.id} onPress={() => { setCharityId(item.id); track('charity_destination_selected'); }} selected={charityId === item.id} />)}
            </View>
            <View style={styles.pageActions}>
              {charityPage > 0 ? <TextAction onPress={() => setCharityPage(0)}>‹ First 3</TextAction> : <View />}
              {charityPage === 0 ? <TextAction align="end" onPress={() => setCharityPage(1)}>More charities ›</TextAction> : null}
            </View>
          </>
        ) : null}
        {step === 'disclosure' && stakeCents && charity ? (
          <>
            <ScreenHeader compact={compact} eyebrow="03 · plain terms" title="No surprises." body="Read this before any card authorization." />
            <View style={styles.ledger}>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>IF YOU FAIL</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.amount}>{formatMoney(stakeCents)} → {charity.name}</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>If you fail, 100% of {formatMoney(stakeCents)} goes to {charity.name}. We keep none of it and charge no success fee.</Text>
              <View style={styles.rule} />
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>IF YOU SUCCEED</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={[styles.amount, styles.successAmount]}>Stake released</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>Your stake is not charged. A separate small success fee—about $1–$2, or roughly 3% capped—is charged.</Text>
              <View style={styles.rule} />
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>ON EVERY COMMITMENT</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.amount}>About $1</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>A separate base service fee is charged now. It never comes out of your stake.</Text>
            </View>
            <Text maxFontSizeMultiplier={type.maxScale} style={styles.authorization}>Next, Stripe will authorize a temporary card hold. It does not charge your card.</Text>
          </>
        ) : null}
        {step === 'card' ? (
          <>
            <ScreenHeader compact={compact} eyebrow="04 · authorize" title="Authorize the stake." body="Stripe securely collects your card details. On the Line never sees or stores raw card data." />
            <View style={styles.ledger}>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>TEMPORARY AUTHORIZATION</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.amount}>{formatMoney(stakeCents ?? 0)}</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>This amount is a hold only. The separate base service fee is charged when the commitment is created.</Text>
            </View>
            {busy ? <AuthorizationSkeleton /> : null}
            {error ? <StatePanel title="Authorization didn’t complete." body={error} actionLabel="Try again" onAction={authorize} /> : null}
          </>
        ) : null}
        {step === 'confirmed' ? (
          <>
            <ScreenHeader compact={compact} eyebrow="commitment active" title="Stake authorized." body={`The base fee is paid. The stake is charged only after a verified failure on ${template.cadence}.`} />
            <View style={styles.ledger}>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerLabel}>STAKE AUTHORIZED</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.amount}>{formatMoney(stakeCents ?? 0)}</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>Destination · {charity?.name}</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.ledgerBody}>Authorization review · {expiry ? new Date(expiry).toLocaleDateString() : 'before the next proof window'}</Text>
            </View>
            <Text maxFontSizeMultiplier={type.maxScale} style={styles.authorization}>If this authorization expires, we’ll ask you to re-authorize before the next proof window. If that remains unresolved, the commitment is voided—no charge and no forfeiture.</Text>
          </>
        ) : null}
        </ScrollView>
        <View style={styles.footer} testID="commit-primary-footer">
          {primaryAction ? <PrimaryButton disabled={primaryAction.disabled} haptic={step === 'card' ? 'none' : 'light'} onPress={primaryAction.onPress}>{primaryAction.label}</PrimaryButton> : null}
        </View>
      </ScreenEntrance>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  amount: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.xl },
  authorization: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  charities: { gap: space.xs },
  container: { flex: 1, paddingHorizontal: space.lg },
  containerCompact: { paddingHorizontal: space.md },
  content: { gap: space.md, paddingBottom: space.md },
  contentCompact: { gap: space.sm },
  contentRegion: { flex: 1 },
  footer: { borderTopColor: color.surfaceRaised, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: space.sm, paddingTop: space.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  ledger: { borderLeftColor: color.gold, borderLeftWidth: 2, gap: space.sm, paddingHorizontal: space.md, paddingVertical: space.sm },
  ledgerBody: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  ledgerLabel: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.figure, fontSize: 11, letterSpacing: 1 },
  note: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption },
  pageActions: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 44 },
  rule: { backgroundColor: color.textSecondary, height: StyleSheet.hairlineWidth },
  safe: { backgroundColor: color.surface, flex: 1 },
  successAmount: { color: color.gold },
  skeleton: { borderLeftColor: color.textSecondary, borderLeftWidth: 2, gap: space.sm, paddingLeft: space.md, paddingVertical: space.sm },
});

function AuthorizationSkeleton() {
  return (
    <View accessibilityLabel="Preparing secure card authorization" style={styles.skeleton} testID="authorization-loading">
      <LedgerSkeletonLine width="52%" />
      <LedgerSkeletonLine />
      <Text maxFontSizeMultiplier={type.maxScale} style={styles.note}>Preparing secure card authorization…</Text>
    </View>
  );
}
