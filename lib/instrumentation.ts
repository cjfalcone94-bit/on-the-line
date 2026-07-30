/**
 * Analytics + crash reporting stub — wired Sprint 1 per the playbook, behind env
 * flags AND user consent (`ANALYTICS-SPEC.md`; `TECH-ARCHITECTURE.md` §9). Two
 * hard rules for On the Line, same shape as the SteadyStart precedent:
 *   1. Nothing leaves the device unless the app is configured AND the user has
 *      opted in — PostHog starts OPTED OUT (defaultOptIn: false).
 *   2. No financial/PII value ever leaves — every Sentry payload is scrubbed by
 *      `scrubDeep` before send (card details, stake amounts, charity destination,
 *      proof-photo URIs are all financial/PII surfaces here, not health data).
 *
 * App code never imports from here directly — it uses the typed, consent-gated
 * `track()` in `features/analytics` (Sprint 1 scope item), which is the ONLY
 * capture path. Drop at <app-repo>/lib/instrumentation.ts once the repo exists;
 * no live DSN/API key is set here (credential wall — see gate §D).
 */
import * as Sentry from '@sentry/react-native';
import PostHog from 'posthog-react-native';
import { env } from './env';
import { scrubDeep } from './privacy';

let posthog: PostHog | null = null;
let analyticsConsentGranted = false;

/** Call once at app start (before rendering the tree). */
export function initInstrumentation() {
  if (env.sentry.enabled) {
    Sentry.init({
      dsn: env.sentry.dsn,
      sendDefaultPii: false,
      tracesSampleRate: 0.2,
      beforeSend(event) {
        if (event.user) event.user = { id: event.user.id };
        // Financial/PII scrub across every carrier surface before the event leaves.
        return scrubDeep(event);
      },
      beforeBreadcrumb(breadcrumb) {
        return scrubDeep(breadcrumb);
      },
    });
  }

  if (env.posthog.enabled) {
    posthog = new PostHog(env.posthog.key!, {
      host: env.posthog.host,
      defaultOptIn: false, // consent-gated: flips on only via setAnalyticsConsent()
    });
  }
}

/**
 * Low-level PostHog capture. Internal to the analytics layer — the four
 * `ANALYTICS-SPEC.md` funnels (activation, commit, verification & settle,
 * retention) call this only through the typed `track()` wrapper, which
 * validates the event name against the registry and scrubs first.
 */
export function captureRaw(
  event: string,
  props?: Record<string, string | number | boolean>,
): boolean {
  if (!posthog || !analyticsConsentGranted) return false;
  posthog.capture(event, props);
  return true;
}

/** Reflect the user's analytics consent into PostHog. OFF (default) ⇒ nothing sent. */
export function setAnalyticsConsent(granted: boolean) {
  analyticsConsentGranted = granted;
  if (!posthog) return;
  if (granted) posthog.optIn();
  else posthog.optOut();
}

export function identify(userId: string) {
  posthog?.identify(userId);
  Sentry.setUser({ id: userId });
}

export function resetAnalytics() {
  analyticsConsentGranted = false;
  posthog?.reset();
  Sentry.setUser(null);
}

/** Observable for privacy tests/settings UI; analytics always begins false. */
export function hasAnalyticsConsent(): boolean {
  return analyticsConsentGranted;
}
