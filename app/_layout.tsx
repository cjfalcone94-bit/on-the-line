import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { initInstrumentation } from '@/lib/instrumentation';

export default function RootLayout() {
  useEffect(() => {
    initInstrumentation();
  }, []);

  return <Stack screenOptions={{ headerShown: false }} />;
}
