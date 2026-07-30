import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { StripeProvider } from '@/lib/payments/stripe';
import { color } from '@/design/tokens';
import { env } from '@/lib/env';

import { initInstrumentation } from '@/lib/instrumentation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 5 * 60 * 1000 },
  },
});

export default function RootLayout() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    initInstrumentation();
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => subscription.remove();
  }, []);

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
