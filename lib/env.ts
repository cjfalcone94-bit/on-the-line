type PublicEnvironment = Readonly<{
  supabase: {
    url?: string;
    anonKey?: string;
  };
  posthog: {
    enabled: boolean;
    key?: string;
    host: string;
  };
  sentry: {
    enabled: boolean;
    dsn?: string;
  };
  stripe?: {
    publishableKey?: string;
  };
}>;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;
const sentryDsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

export const env: PublicEnvironment = Object.freeze({
  supabase: {
    url: supabaseUrl,
    anonKey: supabaseAnonKey,
  },
  posthog: {
    enabled: Boolean(posthogKey),
    key: posthogKey,
    host: process.env.EXPO_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com',
  },
  sentry: {
    enabled: Boolean(sentryDsn),
    dsn: sentryDsn,
  },
  stripe: {
    publishableKey: stripePublishableKey,
  },
});

export function requireSupabaseEnvironment(
  source: PublicEnvironment = env,
): { url: string; anonKey: string } {
  if (!source.supabase.url || !source.supabase.anonKey) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }

  return { url: source.supabase.url, anonKey: source.supabase.anonKey };
}
