import { router } from 'expo-router';
import { useEffect } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { BrandWordmark, OnboardingArtwork, PrimaryButton, ScreenHeader, TextAction } from '@/components';
import { color, space, type } from '@/design/tokens';
import { track } from '@/lib/analytics';
import { facts } from './trustContent';

export default function TrustScreen() {
  useEffect(() => {
    track('trust_screen_viewed');
  }, []);

  return (
    <SafeAreaView style={styles.safe} testID="trust-screen">
      <View style={styles.container}>
        <BrandWordmark layout="horizontal" />
        <ScreenHeader eyebrow="How this works" title="Nothing hidden." />
        <OnboardingArtwork />
        <View style={styles.facts}>
          {facts.map(({ number, title, body }) => (
            <View accessible accessibilityLabel={`${title}. ${body}`} key={number} style={styles.fact}>
              <Text allowFontScaling style={styles.number}>{number}</Text>
              <View style={styles.factCopy}>
                <Text allowFontScaling style={styles.factTitle}>{title}</Text>
                <Text allowFontScaling style={styles.factBody}>{body}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text allowFontScaling style={styles.footnote}>
          About $1 at commit, plus a small success fee only when you succeed. On failure, we keep none of your stake.
        </Text>
        <PrimaryButton accessibilityLabel="Browse goal templates" onPress={() => router.push('/catalog')} testID="browse-templates-button">
          Browse goal templates
        </PrimaryButton>
        <TextAction accessibilityRole="link" align="center" onPress={() => router.push('/record')}>View Commitment Record</TextAction>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: space.md, justifyContent: 'space-between', paddingHorizontal: space.lg, paddingVertical: space.md },
  fact: { alignItems: 'flex-start', borderTopColor: color.surfaceRaised, borderTopWidth: 1, flexDirection: 'row', gap: space.md, paddingTop: space.sm },
  factBody: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  factCopy: { flex: 1, gap: space.xs },
  factTitle: { color: color.textPrimary, fontFamily: type.family.body, fontSize: type.size.body, fontWeight: type.weight.semibold },
  facts: { gap: space.sm },
  footnote: { borderLeftColor: color.gold, borderLeftWidth: 2, color: color.textSecondary, fontFamily: type.family.mono, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal, paddingLeft: space.sm },
  number: { color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.caption, paddingTop: space.xs },
  safe: { backgroundColor: color.surface, flex: 1 },
});
