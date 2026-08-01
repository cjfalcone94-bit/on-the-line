import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { InteractivePressable } from '@/components/ui';
import { fireHaptic } from '@/lib/feedback';
import { withSpring } from 'react-native-reanimated';

jest.mock('@/lib/feedback', () => ({ fireHaptic: jest.fn(() => Promise.resolve()) }));

describe('InteractivePressable felt feedback', () => {
  it('fires its haptic and springs into and out of the press state', async () => {
    const onPress = jest.fn();
    const view = render(<InteractivePressable onPress={onPress} testID="felt"><Text>Alive</Text></InteractivePressable>);
    const pressable = view.getByTestId('felt');

    fireEvent(pressable, 'pressIn', { nativeEvent: {} });
    expect(withSpring).toHaveBeenCalledWith(1, { damping: 26, stiffness: 220 });

    fireEvent.press(pressable);
    await waitFor(() => expect(fireHaptic).toHaveBeenCalledWith('light'));
    expect(onPress).toHaveBeenCalledTimes(1);

    fireEvent(pressable, 'pressOut', { nativeEvent: {} });
    expect(withSpring).toHaveBeenCalledWith(0, { damping: 26, stiffness: 220 });
  });
});
