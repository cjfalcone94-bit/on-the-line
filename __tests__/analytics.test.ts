jest.mock('@/lib/instrumentation', () => ({
  captureRaw: jest.fn(() => false),
}));

import { funnels, isRegisteredEvent, track } from '@/lib/analytics';
import { captureRaw } from '@/lib/instrumentation';

describe('analytics registry and consent-safe capture path', () => {
  it('registers all four specified funnels and their 17 events', () => {
    expect(Object.keys(funnels)).toEqual([
      'activation',
      'commit',
      'verificationAndSettle',
      'retention',
    ]);
    expect(Object.values(funnels).flat()).toHaveLength(17);
    expect(isRegisteredEvent('settlement_resolved')).toBe(true);
    expect(isRegisteredEvent('unregistered_event')).toBe(false);
  });

  it('reports no capture while instrumentation is consent-default-off', () => {
    expect(track('app_opened_first_time')).toBe(false);
    expect(captureRaw).toHaveBeenCalledWith('app_opened_first_time', undefined);
  });
});
