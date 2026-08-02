import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { InteractivePressable, ScreenEntrance } from '@/components/ui';

describe('ScreenEntrance touch delivery', () => {
  it('is touch-transparent and leaves an interactive child pressable', async () => {
    const onPress = jest.fn();
    const view = render(
      <ScreenEntrance>
        <InteractivePressable onPress={onPress} testID="nested-control">
          <Text>Choose stake</Text>
        </InteractivePressable>
      </ScreenEntrance>,
    );

    expect(view.UNSAFE_getByProps({ pointerEvents: 'box-none' })).toBeTruthy();
    fireEvent.press(view.getByTestId('nested-control'));
    await waitFor(() => expect(onPress).toHaveBeenCalledTimes(1));
  });
});
