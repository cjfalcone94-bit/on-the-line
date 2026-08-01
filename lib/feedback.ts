import * as Haptics from 'expo-haptics';
import { getSoundEnabled } from '@/lib/preferences/sound';

export type HapticCue = 'light' | 'selection' | 'success' | 'warning' | 'rigid' | 'none';

/** One preference governs all optional sensory feedback (sound and haptics). */
export async function fireHaptic(cue: HapticCue = 'light'): Promise<void> {
  if (cue === 'none' || !(await getSoundEnabled())) return;
  if (cue === 'selection') return Haptics.selectionAsync();
  if (cue === 'success') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  if (cue === 'warning') return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  return Haptics.impactAsync(cue === 'rigid' ? Haptics.ImpactFeedbackStyle.Rigid : Haptics.ImpactFeedbackStyle.Light);
}
