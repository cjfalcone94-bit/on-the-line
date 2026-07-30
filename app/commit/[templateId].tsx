import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useStripe } from '@/lib/payments/stripe';
import { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { CharityChoice, CustomStakeInput, StakeChoice } from '@/components/commit';
import { PrimaryButton, ScreenHeader, StatePanel, TextAction } from '@/components';
import { color, space, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { charities, findCharity } from '@/lib/commit/charities';
import { dollarsToCents, formatMoney, stakePresets } from '@/lib/commit/money';
import { finalizeCommitment, prepareAuthorization } from '@/lib/commit/service';
import { env } from '@/lib/env';
import { findTemplate } from '@/lib/catalog/templates';
import { scheduleProofReminder } from '@/lib/proof/reminders';

type Step = 'stake' | 'charity' | 'disclosure' | 'card' | 'confirmed';

export default function CommitScreen() {
  const { templateId, stakeCents: prefillStake, charityId: prefillCharity, fromRecord } = useLocalSearchParams<{
    templateId: string; stakeCents?: string; charityId?: string; fromRecord?: string;
  }>();
  const template = findTemplate(templateId);
  const stripe = useStripe();
  const [step, setStep] = useState<Step>('stake');
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

  if (!template) {
    return <SafeAreaView style={styles.safe}><View style={styles.container}><StatePanel title="Goal unavailable." body="This template can’t be committed to right now. Nothing changed." actionLabel="Back to catalog" onAction={() => router.replace('/catalog')} /></View></SafeAreaView>;
  }

  const selectStake = (cents: number) => {
    setStakeCents(cents);
    setCustom('');
    Haptics.selectionAsync();
    track('stake_amount_selected');
  };

  const authorize = async () => {
    if (!stakeCents || !charity || !env.stripe?.publishableKey) {
      setError('Card authorization is unavailable right now. Nothing was charged. Check your connection and try again.');
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      void scheduleProofReminder(template.title, template.cadence);
    } catch {
      setError(stakeAuthorized
        ? 'We could not confirm the commitment. Do not try again yet. Check your commitments—the base fee may have been charged, but your stake was not captured.'
        : 'We could not authorize your card. Nothing was charged. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} testID="commit-screen">
      <View style={styles.container}>
        <TextAction onPress={() => step === 'stake' ? router.back() : setStep(step === 'charity' ? 'stake' : step === 'disclosure' ? 'charity' : 'disclosure')}>‹ Back</TextAction>
        {step === 'stake' ? (
          <>
            <ScreenHeader eyebrow="01 · stake" title="Put a clear amount on it." body={`${template.title} · ${template.cadence}`} />
            <View accessibilityRole="radiogroup" style={styles.grid}>
              {stakePresets.map((cents) => <StakeChoice cents={cents} key={cents} onPress={() => selectStake(cents)} selected={stakeCents === cents} />)}
            </View>
            <CustomStakeInput onChange={(value) => { setCustom(value); setStakeCents(dollarsToCents(value)); }} value={custom} />
            <Text style={styles.note}>Custom stake: $5–$1,000. Your card will be authorized, not charged.</Text>
            <PrimaryButton disabled={!stakeCents} onPress={() => setStep('charity')}>Choose charity</PrimaryButton>
          </>
        ) : null}
        {step === 'charity' ? (
          <>
            <ScreenHeader eyebrow="02 · destination" title="Choose where failure goes." body="This destination is locked after you commit. To change it, you must void and start again." />
            <View accessibilityRole="radiogroup" style={styles.charities}>
              {charities.map((item) => <CharityChoice charity={item} key={item.id} onPress={() => { setCharityId(item.id); Haptics.selectionAsync(); track('charity_destination_selected'); }} selected={charityId === item.id} />)}
            </View>
            <PrimaryButton disabled={!charity} onPress={() => { setStep('disclosure'); track('fee_disclosure_viewed'); }}>Review the mechanic</PrimaryButton>
          </>
        ) : null}
        {step === 'disclosure' && stakeCents && charity ? (
          <>
            <ScreenHeader eyebrow="03 · plain terms" title="No surprises." body="Read this before any card authorization." />
            <View style={styles.ledger}>
              <Text style={styles.ledgerLabel}>IF YOU FAIL</Text>
              <Text style={styles.amount}>{formatMoney(stakeCents)} → {charity.name}</Text>
              <Text style={styles.ledgerBody}>If you fail, 100% of {formatMoney(stakeCents)} goes to {charity.name}. We keep none of it and charge no success fee.</Text>
              <View style={styles.rule} />
              <Text style={styles.ledgerLabel}>IF YOU SUCCEED</Text>
              <Text style={[styles.amount, styles.successAmount]}>Stake released</Text>
              <Text style={styles.ledgerBody}>Your stake is not charged. A separate small success fee—about $1–$2, or roughly 3% capped—is charged.</Text>
              <View style={styles.rule} />
              <Text style={styles.ledgerLabel}>ON EVERY COMMITMENT</Text>
              <Text style={styles.amount}>About $1</Text>
              <Text style={styles.ledgerBody}>A separate base service fee is charged now. It never comes out of your stake.</Text>
            </View>
            <Text style={styles.authorization}>Next, Stripe will authorize a temporary card hold. It does not charge your card.</Text>
            <PrimaryButton onPress={() => setStep('card')}>Continue to card authorization</PrimaryButton>
          </>
        ) : null}
        {step === 'card' ? (
          <>
            <ScreenHeader eyebrow="04 · authorize" title="Authorize the stake." body="Stripe securely collects your card details. On the Line never sees or stores raw card data." />
            <View style={styles.ledger}>
              <Text style={styles.ledgerLabel}>TEMPORARY AUTHORIZATION</Text>
              <Text style={styles.amount}>{formatMoney(stakeCents ?? 0)}</Text>
              <Text style={styles.ledgerBody}>This amount is a hold only. The separate base service fee is charged when the commitment is created.</Text>
            </View>
            {busy ? <AuthorizationSkeleton /> : null}
            {error ? <StatePanel title="Authorization didn’t complete." body={error} actionLabel="Try again" onAction={authorize} /> : null}
            {!busy && !error ? <PrimaryButton onPress={authorize}>Authorize stake and pay base fee</PrimaryButton> : null}
          </>
        ) : null}
        {step === 'confirmed' ? (
          <>
            <ScreenHeader eyebrow="commitment active" title="Stake authorized." body={`The base fee is paid. The stake is charged only after a verified failure on ${template.cadence}.`} />
            <View style={styles.ledger}>
              <Text style={styles.ledgerLabel}>STAKE AUTHORIZED</Text>
              <Text style={styles.amount}>{formatMoney(stakeCents ?? 0)}</Text>
              <Text style={styles.ledgerBody}>Destination · {charity?.name}</Text>
              <Text style={styles.ledgerBody}>Authorization review · {expiry ? new Date(expiry).toLocaleDateString() : 'before the next proof window'}</Text>
            </View>
            <Text style={styles.authorization}>If this authorization expires, we’ll ask you to re-authorize before the next proof window. If that remains unresolved, the commitment is voided—no charge and no forfeiture.</Text>
            <PrimaryButton
              disabled={!commitmentId}
              onPress={() => router.replace({ pathname: '/proof/[commitmentId]', params: { commitmentId: commitmentId!, templateId: template.id } })}
            >
              Submit today’s proof
            </PrimaryButton>
          </>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  amount: { color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.xl },
  authorization: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  charities: { gap: space.xs },
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingBottom: space.md, paddingHorizontal: space.lg },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  ledger: { backgroundColor: color.surfaceRaised, borderRadius: space.md, gap: space.sm, padding: space.md },
  ledgerBody: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.body, lineHeight: type.size.body * type.lineHeight.normal },
  ledgerLabel: { color: color.textSecondary, fontFamily: type.family.mono, fontSize: 11, letterSpacing: 1 },
  note: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption },
  rule: { backgroundColor: color.textSecondary, height: StyleSheet.hairlineWidth },
  safe: { backgroundColor: color.surface, flex: 1 },
  successAmount: { color: color.gold },
  skeleton: { borderLeftColor: color.textSecondary, borderLeftWidth: 2, gap: space.sm, paddingLeft: space.md, paddingVertical: space.sm },
  skeletonLine: { backgroundColor: color.textSecondary, borderRadius: space.xs, height: 14, opacity: 0.18 },
  skeletonShort: { width: '52%' },
});

function AuthorizationSkeleton() {
  return (
    <View accessibilityLabel="Preparing secure card authorization" style={styles.skeleton} testID="authorization-loading">
      <View style={[styles.skeletonLine, styles.skeletonShort]} />
      <View style={styles.skeletonLine} />
      <Text style={styles.note}>Preparing secure card authorization…</Text>
    </View>
  );
}
