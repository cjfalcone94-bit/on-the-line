import { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { color, space, tabularNums, type } from '@/design/tokens';
import { InteractivePressable } from '@/components/ui';
import type { Charity } from '@/lib/commit/charities';
import { formatMoney } from '@/lib/commit/money';

const charityIcons: Record<string, ImageSourcePropType> = {
  'direct-relief': require('@/assets/charity-icons/health.png'),
  donorschoose: require('@/assets/charity-icons/education.png'),
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

// Preset stake amounts render as chips, not ledger rows: a stake is a discrete
// pick-one control, and the gold fill on selection is the allowlisted
// "active/selected interaction" use of the accent (tokens §3).
export function StakeChoice({ cents, selected, onPress }: { cents: number; selected: boolean; onPress: () => void }) {
  return (
    <InteractivePressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, selected }}
      aria-checked={selected}
      haptic="selection"
      onPress={onPress}
      style={({ pressed, focused, hovered }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}
      testID={`stake-${cents}`}
    >
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{formatMoney(cents)}</Text>
    </InteractivePressable>
  );
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
      style={({ pressed, focused, hovered }) => [styles.charity, compact && styles.charityCompact, selected && styles.charitySelected, pressed && styles.pressed, hovered && styles.hovered, focused && styles.focused]}
      testID={`charity-${charity.id}`}
    >
      <Image accessible={false} source={charityIcons[charity.id]} style={[styles.charityIcon, compact && styles.charityIconCompact]} />
      <View style={styles.charityCopy}>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.choiceLabel, selected && styles.selectedLabel]}>{charity.name}</Text>
        <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={styles.detail}>{charity.category}</Text>
      </View>
      <Text maxFontSizeMultiplier={type.maxScale} allowFontScaling style={[styles.chevron, selected && styles.chevronSelected]}>›</Text>
    </InteractivePressable>
  );
}

const styles = StyleSheet.create({
  // Transparent left border reserves the selected gold rule's width so rows
  // don't shift horizontally on selection.
  charity: { alignItems: 'center', borderBottomColor: color.surfaceRaised, borderBottomWidth: StyleSheet.hairlineWidth, borderLeftColor: 'transparent', borderLeftWidth: 2, flexDirection: 'row', gap: space.smd, minHeight: 58, paddingHorizontal: space.sm, paddingVertical: space.sm },
  charityCompact: { minHeight: 48, paddingVertical: space.xs },
  charityCopy: { flex: 1, gap: 1 },
  charityIcon: { height: 44, resizeMode: 'contain', width: 44 },
  charityIconCompact: { height: 32, width: 32 },
  charitySelected: { borderLeftColor: color.gold },
  chevron: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.lg, lineHeight: type.size.lg },
  chevronSelected: { color: color.gold },
  chip: { alignItems: 'center', borderColor: color.stroke, borderRadius: space.smd, borderWidth: 1, flexGrow: 1, justifyContent: 'center', minHeight: 48, paddingHorizontal: space.md },
  chipLabel: { ...tabularNums, color: color.textPrimary, fontFamily: type.family.figure, fontSize: type.size.body },
  chipLabelSelected: { color: color.surface, fontFamily: type.family.figureBold },
  chipSelected: { backgroundColor: color.gold, borderColor: color.gold },
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
