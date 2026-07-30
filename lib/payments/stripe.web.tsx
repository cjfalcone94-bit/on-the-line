import type { PropsWithChildren } from 'react';

export function StripeProvider({ children }: PropsWithChildren<{ publishableKey: string }>) {
  return children;
}

export function useStripe() {
  return {
    initPaymentSheet: async () => ({
      error: { message: 'Card authorization is available in the iPhone app.' },
    }),
    presentPaymentSheet: async () => ({
      error: { message: 'Card authorization is available in the iPhone app.' },
    }),
  };
}
