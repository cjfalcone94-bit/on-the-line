import { requireSupabaseEnvironment } from '@/lib/env';

describe('Supabase environment guard', () => {
  it('fails closed when public configuration is absent', () => {
    expect(() =>
      requireSupabaseEnvironment({
        supabase: {},
        posthog: { enabled: false, host: 'https://us.i.posthog.com' },
        sentry: { enabled: false },
      }),
    ).toThrow(/EXPO_PUBLIC_SUPABASE_URL/);
  });

  it('returns public values when both are supplied', () => {
    expect(
      requireSupabaseEnvironment({
        supabase: { url: 'https://project.supabase.co', anonKey: 'public-anon-key' },
        posthog: { enabled: false, host: 'https://us.i.posthog.com' },
        sentry: { enabled: false },
      }),
    ).toEqual({
      url: 'https://project.supabase.co',
      anonKey: 'public-anon-key',
    });
  });
});
