import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandSplash } from '@/components';
import { StripeProvider } from '@/lib/payments/stripe';
import { color } from '@/design/tokens';
import { env } from '@/lib/env';

import { initInstrumentation } from '@/lib/instrumentation';

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'BricolageGrotesque-Regular': require('@/assets/fonts/BricolageGrotesque-Regular.ttf'),
    'BricolageGrotesque-SemiBold': require('@/assets/fonts/BricolageGrotesque-SemiBold.ttf'),
    'BricolageGrotesque-Bold': require('@/assets/fonts/BricolageGrotesque-Bold.ttf'),
    'HankenGrotesk-Regular': require('@/assets/fonts/HankenGrotesk-Regular.ttf'),
    'HankenGrotesk-Medium': require('@/assets/fonts/HankenGrotesk-Medium.ttf'),
    'HankenGrotesk-Bold': require('@/assets/fonts/HankenGrotesk-Bold.ttf'),
  });
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  useEffect(() => {
    initInstrumentation();
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const splashTimer = setTimeout(() => setShowBrandSplash(false), 650);
    return () => {
      subscription.remove();
      clearTimeout(splashTimer);
    };
  }, []);

  if (fontError) throw fontError;
  if (!fontsLoaded) return null;
  if (showBrandSplash) return <BrandSplash />;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <StripeProvider publishableKey={env.stripe?.publishableKey ?? ''}>
        <QueryClientProvider client={queryClient}>
          <Stack
            screenOptions={{
              animation: reduceMotion ? 'none' : 'slide_from_right',
              contentStyle: { backgroundColor: color.surface },
              headerShown: false,
            }}
          />
        </QueryClientProvider>
      </StripeProvider>
    </SafeAreaProvider>
  );
}
