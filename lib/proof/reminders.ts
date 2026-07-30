import * as Notifications from 'expo-notifications';

export function cadenceReminderSeconds(cadence: string) {
  if (cadence.startsWith('Weekly')) return 60 * 60 * 24 * 7;
  if (cadence.startsWith('3×')) return 60 * 60 * 56;
  if (cadence.startsWith('4×')) return 60 * 60 * 42;
  if (cadence.startsWith('5×')) return 60 * 60 * 34;
  return 60 * 60 * 24;
}

export async function scheduleProofReminder(title: string, cadence: string) {
  const permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return false;
  const seconds = cadenceReminderSeconds(cadence);
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Proof window open',
      body: `${title}: take today’s photo against your fixed checklist.`,
      data: { route: '/proof' },
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, repeats: true, seconds },
  });
  return true;
}
