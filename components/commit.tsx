import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { color, space, tabularNums, type } from '@/design/tokens';
import { InteractivePressable } from '@/components/ui';
import type { Charity } from '@/lib/commit/charities';
import { formatMoney } from '@/lib/commit/money';

const charityIcons: Record<string, ImageSourcePropType> = {
  'direct-relief': require('@/assets/charity-icons/health.png'),
  donorschoose: require('@/assets/charity-icons/education.png'),
  'rainforest-trust': require('@/assets/charity-icons/environment.png'),
  'best-friends': require('@/assets/charity-icons/animal-welfare.png'),
  'team-rubicon': require('@/assets/charity-icons/disaster-relief.png'),
  'feeding-america': require('@/assets/charity-icons/community.png'),
};

export function Choice({ label, detail, selected, onPress, testID }: { label: string; detail?: string; selected: boolean; onPress: () => void; testID?: string }) {
  return (
    <InteractivePressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      aria-checked={selected}
      haptic="selection"
      onPress={onPress}
      style={({ pressed, focused, hovered }) => [styles.choice, selected && styles.selected, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}
      testID={testID}
    >
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.choiceLabel, selected && styles.selectedLabel]}>{label}</Text>
      {detail ? <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.detail}>{detail}</Text> : null}
    </InteractivePressable>
  );
}

export function StakeChoice({ cents, selected, onPress }: { cents: number; selected: boolean; onPress: () => void }) {
  return <Choice label={formatMoney(cents)} selected={selected} onPress={onPress} testID={`stake-${cents}`} />;
}

export function CustomStakeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      accessibilityLabel="Custom stake amount in dollars"
      inputMode="decimal"
      maxLength={8}
      onChangeText={onChange}
      onBlur={() => setFocused(false)}
      onFocus={() => setFocused(true)}
      placeholder="$ Custom"
      placeholderTextColor={color.textSecondary}
      style={[styles.input, focused && styles.focused]}
      value={value}
    />
  );
}

export function CharityChoice({ charity, selected, onPress, compact = false }: { charity: Charity; selected: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <InteractivePressable
      accessibilityLabel={`${charity.name}, ${charity.category}`}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      aria-checked={selected}
      onPress={onPress}
      style={({ pressed, focused, hovered }) => [styles.charity, compact && styles.charityCompact, selected && styles.selected, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}
      testID={`charity-${charity.id}`}
    >
      <Image accessible={false} source={charityIcons[charity.id]} style={[styles.charityIcon, compact && styles.charityIconCompact]} tintColor={color.textPrimary} />
      <View style={styles.charityCopy}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.choiceLabel, selected && styles.selectedLabel]}>{charity.name}</Text>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.detail}>{charity.category}</Text>
      </View>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  charity: { alignItems: 'center', borderBottomColor: color.surfaceRaised, borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: space.sm, minHeight: 58, paddingHorizontal: space.xs, paddingVertical: space.sm },
  charityCompact: { minHeight: 48, paddingVertical: space.xs },
  charityCopy: { flex: 1 },
  charityIcon: { height: 42, resizeMode: 'contain', width: 42 },
  charityIconCompact: { height: 32, width: 32 },
  choice: { borderBottomColor: color.surfaceRaised, borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 52, paddingHorizontal: space.sm, paddingVertical: space.sm },
  choiceLabel: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.body },
  detail: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption },
  focused: { borderColor: color.gold, borderWidth: 2 },
  hovered: { opacity: 0.9 },
  input: { ...tabularNums, borderColor: color.surfaceRaised, borderRadius: space.sm, borderWidth: 1, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.body, minHeight: 52, paddingHorizontal: space.md },
  pressed: { opacity: 0.82 },
  selected: { borderBottomColor: color.gold, borderBottomWidth: 2 },
  selectedLabel: { ...tabularNums, color: color.gold, fontFamily: type.family.figureBold },
});
