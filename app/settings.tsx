import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { InteractivePressable, ScreenEntrance, ScreenHeader, TextAction } from '@/components';
import { color, space, type } from '@/design/tokens';
import { getSoundEnabled, setSoundEnabled } from '@/lib/preferences/sound';

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabledState] = useState(true);

  useEffect(() => {
    getSoundEnabled().then(setSoundEnabledState).catch(() => undefined);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabledState(next);
    void setSoundEnabled(next);
  };

  return (
    <SafeAreaView style={styles.safe} testID="settings-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenEntrance direction="right"><TextAction onPress={() => router.back()}>‹ Back</TextAction>
        <ScreenHeader eyebrow="App controls" title="Settings" body="Sound and haptics follow one device preference." /></ScreenEntrance>
        <ScreenEntrance delay={45} direction="left" style={styles.section}>
          <InteractivePressable
            accessibilityLabel={`App sound ${soundEnabled ? 'on' : 'off'}`}
            accessibilityRole="switch"
            accessibilityState={{ checked: soundEnabled }}
            haptic="selection"
            onPress={toggleSound}
            style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
            testID="app-sound-toggle"
          >
            <View style={styles.settingCopy}>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.settingTitle}>Sound &amp; haptics</Text>
              <Text maxFontSizeMultiplier={type.maxScale} style={styles.settingBody}>Press feedback, commitment confirmation, and Glass Receipt cues. The hardware silent switch is always respected.</Text>
            </View>
            <Text maxFontSizeMultiplier={type.maxScale} style={styles.value}>{soundEnabled ? 'ON' : 'OFF'}</Text>
          </InteractivePressable>
        </ScreenEntrance>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg, paddingBottom: space.xl, paddingHorizontal: space.lg },
  pressed: { opacity: 0.65 },
  safe: { backgroundColor: color.surface, flex: 1 },
  section: { borderTopColor: color.textSecondary, borderTopWidth: StyleSheet.hairlineWidth },
  settingBody: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption, lineHeight: type.size.caption * type.lineHeight.normal },
  settingCopy: { flex: 1, gap: space.xs, paddingRight: space.md },
  settingRow: { alignItems: 'center', borderBottomColor: color.textSecondary, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', justifyContent: 'space-between', minHeight: 88, paddingVertical: space.md },
  settingTitle: { color: color.textPrimary, fontFamily: type.family.bodyMedium, fontSize: type.size.body },
  value: { color: color.textPrimary, fontFamily: type.family.bodyBold, fontSize: type.size.caption },
});
