import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { OnboardingArtwork, PrimaryButton, ScreenEntrance, ScreenHeader, ScreenScaffold, TextAction } from '@/components';
import { color, space, tabularNums, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { facts } from './trustContent';
import { DisclosureCard, StepRow } from '@/components/premium';

export default function TrustScreen() {
  const compact = useWindowDimensions().height <= 700;
  useEffect(() => {
    track('trust_screen_viewed');
  }, []);

  return (
    <ScreenScaffold
      contentContainerStyle={[styles.container, compact && styles.containerCompact]}
      footer={<View style={styles.footerStack}><PrimaryButton accessibilityLabel="Browse goal templates" onPress={() => router.push('/catalog')} testID="browse-templates-button">Browse goal templates</PrimaryButton><TextAction accessibilityRole="link" align="center" onPress={() => router.push('/record')}>View Commitment Record</TextAction></View>}
      testID="trust-screen"
    >
      <ScreenEntrance direction="right" style={styles.entrance}>
        <ScreenHeader compact={compact} eyebrow="How this works" title="Nothing hidden." />
        {/* Left-aligned: a centered wordmark floated as an orphan on this
            otherwise left-aligned screen. */}
        <OnboardingArtwork align="start" compact={compact} />
        {/* The step numbers are the strongest visual anchor on this screen —
            they carry the sequence, so the eye can follow the money without
            reading every word. */}
        <View style={styles.facts}>
          {facts.map(({ number, icon, title, body }, index) => (
            <View accessible accessibilityLabel={`${title}. ${body}`} key={number}>
              <StepRow body={body} compact={compact} icon={icon} index={index + 1} last={index === facts.length - 1} title={title} />
            </View>
          ))}
        </View>
        {/* Transparent financial disclosure, not marketing copy — so it gets the
            register of a fee table rather than a highlighted callout. */}
        <DisclosureCard>
          About $1 at commit, plus a small success fee only when you succeed. On failure, we keep none of your stake.
        </DisclosureCard>
      </ScreenEntrance>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  containerCompact: { gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.xs },
  fact: { alignItems: 'flex-start', borderTopColor: color.surfaceRaised, borderTopWidth: 1, flexDirection: 'row', gap: space.md, paddingTop: space.sm },
  factCompact: { gap: space.sm, paddingTop: space.xs },
  factBody: { ...tabularNums, color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  factCopy: { flex: 1, gap: space.xs },
  factTitle: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.body },
  facts: { gap: space.sm },
  // ≥24pt between the primary CTA and the record link; footer padding + safe
  // area keep ≥16pt below the link.
  footerStack: { gap: space.lg, paddingBottom: space.sm },
  footnote: { ...tabularNums, borderLeftColor: color.gold, borderLeftWidth: 2, color: color.textSecondary, fontFamily: type.family.figure, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, paddingLeft: space.sm },
  number: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.caption, paddingTop: space.xs },
  entrance: { gap: space.md },
});
