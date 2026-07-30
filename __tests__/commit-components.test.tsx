import { fireEvent, render } from '@testing-library/react-native';
import { CharityChoice, Choice, CustomStakeInput, StakeChoice } from '@/components/commit';
import { charities } from '@/lib/commit/charities';

describe('commit controls', () => {
  it('renders a selected ledger amount and responds to touch', () => {
    const onPress = jest.fn();
    const { getByTestId, getByText } = render(<StakeChoice cents={4000} onPress={onPress} selected />);
    expect(getByText('$40')).toBeTruthy();
    expect(getByTestId('stake-4000').props.accessibilityState).toEqual({ selected: true });
    fireEvent.press(getByTestId('stake-4000'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('makes the charity hold visible and accessible', () => {
    const { getByText, getByRole } = render(<CharityChoice charity={charities[0]} onPress={jest.fn()} selected={false} />);
    expect(getByText('[HELD — charity badge pending founder]')).toBeTruthy();
    expect(getByRole('radio').props.accessibilityLabel).toMatch(/badge pending founder/i);
  });

  it('accepts a custom amount with a financial input label', () => {
    const onChange = jest.fn();
    const { getByLabelText } = render(<CustomStakeInput value="" onChange={onChange} />);
    fireEvent.changeText(getByLabelText('Custom stake amount in dollars'), '62.50');
    expect(onChange).toHaveBeenCalledWith('62.50');
  });

  it('exposes choices as radio controls', () => {
    const { getByRole } = render(<Choice label="Daily" detail="30 days" selected={false} onPress={jest.fn()} />);
    expect(getByRole('radio').props.accessibilityState).toEqual({ selected: false });
  });
});
