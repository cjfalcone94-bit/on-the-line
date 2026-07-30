import { captureRaw } from './instrumentation';
import { scrubDeep } from './privacy';

export const funnels = {
  activation: [
    'app_opened_first_time',
    'onboarding_completed',
    'trust_screen_viewed',
    'template_catalog_viewed',
  ],
  commit: [
    'template_selected',
    'stake_amount_selected',
    'charity_destination_selected',
    'fee_disclosure_viewed',
    'card_authorization_started',
    'commitment_created',
  ],
  verificationAndSettle: [
    'proof_submitted',
    'verification_resolved',
    'appeal_submitted',
    'settlement_resolved',
    'glass_receipt_viewed',
  ],
  retention: ['commitment_record_viewed', 're_commit_from_record'],
} as const;

export type AnalyticsEvent = (typeof funnels)[keyof typeof funnels][number];
type AnalyticsProperties = Record<string, string | number | boolean>;

const registeredEvents = new Set<AnalyticsEvent>(Object.values(funnels).flat());

export function isRegisteredEvent(event: string): event is AnalyticsEvent {
  return registeredEvents.has(event as AnalyticsEvent);
}

export function track(event: AnalyticsEvent, properties?: AnalyticsProperties): boolean {
  return captureRaw(event, properties ? scrubDeep(properties) : undefined);
}
