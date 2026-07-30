import type { PropsWithChildren } from 'react';

export function StripeProvider(props: PropsWithChildren<{ publishableKey: string }>): React.ReactNode;

export function useStripe(): {
  initPaymentSheet(options: Record<string, unknown>): Promise<{ error?: { message: string } }>;
  presentPaymentSheet(): Promise<{ error?: { message: string } }>;
};
