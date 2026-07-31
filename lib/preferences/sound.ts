import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_ENABLED_KEY = 'on-the-line:settings:sound-enabled';

export async function getSoundEnabled(): Promise<boolean> {
  return (await AsyncStorage.getItem(SOUND_ENABLED_KEY)) !== 'false';
}

export async function setSoundEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SOUND_ENABLED_KEY, String(enabled));
}
