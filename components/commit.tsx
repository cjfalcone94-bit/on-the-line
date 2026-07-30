import { Image, Pressable, StyleSheet, Text, TextInput, View, type ImageSourcePropType } from 'react-native';
import { color, space, type } from '@/design/tokens';
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
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.choice, selected && styles.selected, pressed && styles.pressed]}
      testID={testID}
    >
      <Text allowFontScaling style={[styles.choiceLabel, selected && styles.selectedLabel]}>{label}</Text>
      {detail ? <Text allowFontScaling style={styles.detail}>{detail}</Text> : null}
    </Pressable>
  );
}

export function StakeChoice({ cents, selected, onPress }: { cents: number; selected: boolean; onPress: () => void }) {
  return <Choice label={formatMoney(cents)} selected={selected} onPress={onPress} testID={`stake-${cents}`} />;
}

export function CustomStakeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextInput
      accessibilityLabel="Custom stake amount in dollars"
      inputMode="decimal"
      maxLength={8}
      onChangeText={onChange}
      placeholder="$ Custom"
      placeholderTextColor={color.textSecondary}
      style={styles.input}
      value={value}
    />
  );
}

export function CharityChoice({ charity, selected, onPress }: { charity: Charity; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${charity.name}, ${charity.category}`}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.charity, selected && styles.selected, pressed && styles.pressed]}
      testID={`charity-${charity.id}`}
    >
      <Image accessible={false} source={charityIcons[charity.id]} style={styles.charityIcon} />
      <View style={styles.charityCopy}>
        <Text allowFontScaling style={[styles.choiceLabel, selected && styles.selectedLabel]}>{charity.name}</Text>
        <Text allowFontScaling style={styles.detail}>{charity.category}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  charity: { alignItems: 'center', borderColor: color.surfaceRaised, borderRadius: space.sm, borderWidth: 1, flexDirection: 'row', gap: space.sm, minHeight: 58, padding: space.sm },
  charityCopy: { flex: 1 },
  charityIcon: { height: 42, resizeMode: 'contain', width: 42 },
  choice: { borderColor: color.surfaceRaised, borderRadius: space.sm, borderWidth: 1, justifyContent: 'center', minHeight: 52, paddingHorizontal: space.md, paddingVertical: space.sm },
  choiceLabel: { color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.body },
  detail: { color: color.textSecondary, fontFamily: type.family.body, fontSize: type.size.caption },
  input: { borderColor: color.surfaceRaised, borderRadius: space.sm, borderWidth: 1, color: color.textPrimary, fontFamily: type.family.mono, fontSize: type.size.body, minHeight: 52, paddingHorizontal: space.md },
  pressed: { opacity: 0.82 },
  selected: { borderColor: color.gold },
  selectedLabel: { color: color.gold },
});
