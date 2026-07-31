import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import SettingsScreen from '@/app/settings';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

describe('global settings', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('persists the global app-sound preference', async () => {
    const { getByTestId } = render(<SettingsScreen />);
    await waitFor(() => expect(getByTestId('app-sound-toggle').props.accessibilityState).toEqual({ checked: true }));
    fireEvent.press(getByTestId('app-sound-toggle'));
    await waitFor(() => expect(AsyncStorage.getItem('on-the-line:settings:sound-enabled')).resolves.toBe('false'));
  });
});
