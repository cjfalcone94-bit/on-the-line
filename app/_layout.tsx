import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
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
    'ClashDisplay-Semibold': require('@/assets/fonts/ClashDisplay-Semibold.otf'),
    'ClashDisplay-Bold': require('@/assets/fonts/ClashDisplay-Bold.otf'),
    'Satoshi-Regular': require('@/assets/fonts/Satoshi-Regular.otf'),
    'Satoshi-Medium': require('@/assets/fonts/Satoshi-Medium.otf'),
    'Satoshi-Bold': require('@/assets/fonts/Satoshi-Bold.otf'),
    'SpaceMono-Regular': require('@/assets/fonts/SpaceMono-Regular.ttf'),
    'SpaceMono-Bold': require('@/assets/fonts/SpaceMono-Bold.ttf'),
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
  );
}
