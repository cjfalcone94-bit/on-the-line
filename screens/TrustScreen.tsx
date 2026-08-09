import { router } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { OnboardingArtwork, PrimaryButton, ScreenEntrance, ScreenHeader, ScreenScaffold, TextAction } from '@/components';
import { color, space, tabularNums, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { facts } from './trustContent';

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
        <View style={styles.facts}>
          {facts.map(({ number, title, body }) => (
            <View accessible accessibilityLabel={`${title}. ${body}`} key={number} style={[styles.fact, compact && styles.factCompact]}>
              <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.number}>{number}</Text>
              <View style={styles.factCopy}>
                <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.factTitle}>{title}</Text>
                <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.factBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.footnote}>
          About $1 at commit, plus a small success fee only when you succeed. On failure, we keep none of your stake.
        </Text>
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
