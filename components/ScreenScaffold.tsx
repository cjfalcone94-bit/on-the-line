import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, space } from '@/design/tokens';

type ScreenScaffoldProps = {
  children: ReactNode;
  footer?: ReactNode;
  header?: ReactNode;
  testID?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  footerStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle' | 'style'>;
};

/**
 * The app-wide viewport contract: safe-area shell, optional fixed header,
 * overflow-only scrolling content, and a footer that never participates in
 * content layout. Primary actions belong in `footer`.
 */
export function ScreenScaffold({
  children,
  contentContainerStyle,
  contentStyle,
  footer,
  footerStyle,
  header,
  scrollViewProps,
  testID,
}: ScreenScaffoldProps) {
  // Top/bottom safe-area padding comes from useSafeAreaInsets — the native
  // SafeAreaView is deprecated in safe-area-context 5.x and failed to apply
  // the top inset on device (content rendered under the status bar/notch).
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: insets.top }]} testID={testID}>
      {header ? <View style={styles.header}>{header}</View> : null}
      <ScrollView
        bounces={false}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        {...scrollViewProps}
        contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
        style={[styles.content, contentStyle]}
      >
        {children}
      </ScrollView>
      {footer ? <View style={[styles.footer, footerStyle]} testID="screen-scaffold-footer">{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, minHeight: 0 },
  contentContainer: { flexGrow: 1 },
  footer: { backgroundColor: color.surface, borderTopColor: color.surfaceRaised, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
  header: { backgroundColor: color.surface },
  safe: { backgroundColor: color.surface, flex: 1, minHeight: 0 },
});
