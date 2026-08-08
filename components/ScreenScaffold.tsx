import type { ReactNode } from 'react';
import Constants from 'expo-constants';
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
  // Top/bottom safe-area padding. useSafeAreaInsets can return top=0 on device
  // when the SafeAreaProvider hasn't measured / initialWindowMetrics is null,
  // which left content jammed under the notch on builds 21–22. Constants
  // .statusBarHeight is a synchronous, always-present iOS floor, so Math.max
  // guarantees a non-zero top inset regardless of safe-area-context timing.
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Constants.statusBarHeight ?? 0);
  return (
    <View style={[styles.safe, { paddingBottom: insets.bottom, paddingTop: topInset }]} testID={testID}>
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
  // Small nav gap only: the hero breathing room now lives on ScreenHeader itself
  // (see components/ui.tsx) so it's consistent regardless of whether a screen puts
  // its hero in the fixed header slot or the scroll content. A nav row (Back link)
  // at the top of scroll content sits just below the safe area, like an iOS nav bar.
  contentContainer: { flexGrow: 1, paddingTop: space.sm },
  footer: { backgroundColor: color.surface, borderTopColor: color.surfaceRaised, borderTopWidth: StyleSheet.hairlineWidth, paddingBottom: space.sm, paddingHorizontal: space.lg, paddingTop: space.sm },
  // A little air below the status bar for the nav row (Back / Settings).
  header: { backgroundColor: color.surface, paddingTop: space.sm },
  safe: { backgroundColor: color.surface, flex: 1, minHeight: 0 },
});
