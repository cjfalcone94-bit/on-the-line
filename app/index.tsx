import { StyleSheet, Text, View } from 'react-native';

import { color, space, type } from '@/design/tokens';

export default function FoundationScreen() {
  return (
    <View style={styles.container} testID="foundation-screen">
      <Text style={styles.title}>On the Line</Text>
      <Text style={styles.status}>Foundation ready</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: color.surface,
    flex: 1,
    gap: space.sm,
    justifyContent: 'center',
    padding: space.lg,
  },
  title: {
    color: color.textPrimary,
    fontFamily: type.family.display,
    fontSize: type.size.display,
    fontWeight: type.weight.semibold,
  },
  status: {
    color: color.textSecondary,
    fontFamily: type.family.body,
    fontSize: type.size.body,
  },
});
