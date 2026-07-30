import { cadenceReminderSeconds } from '@/lib/proof/reminders';

jest.mock('expo-notifications', () => ({
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

describe('proof cadence reminders', () => {
  it('uses the template cadence rather than one global reminder interval', () => {
    expect(cadenceReminderSeconds('Daily · 30 days')).toBe(60 * 60 * 24);
    expect(cadenceReminderSeconds('3× weekly · 4 weeks')).toBe(60 * 60 * 56);
    expect(cadenceReminderSeconds('Weekly · 8 weeks')).toBe(60 * 60 * 24 * 7);
  });
});
