jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
}));

jest.mock('posthog-react-native', () =>
  jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    identify: jest.fn(),
    optIn: jest.fn(),
    optOut: jest.fn(),
    reset: jest.fn(),
  })),
);

import {
  captureRaw,
  hasAnalyticsConsent,
  resetAnalytics,
  setAnalyticsConsent,
} from '@/lib/instrumentation';

describe('instrumentation consent', () => {
  afterEach(() => resetAnalytics());

  it('defaults analytics consent off and blocks capture', () => {
    expect(hasAnalyticsConsent()).toBe(false);
    expect(captureRaw('app_opened_first_time')).toBe(false);
  });

  it('changes only after an explicit consent decision', () => {
    setAnalyticsConsent(true);
    expect(hasAnalyticsConsent()).toBe(true);
  });
});
