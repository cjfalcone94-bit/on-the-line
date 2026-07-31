import { fireEvent, render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';
import { Choice, CustomStakeInput } from '@/components/commit';
import { PrimaryButton, TextAction } from '@/components/ui';
import { color } from '@/design/tokens';

function flattenedStyle(node: { props: { style: unknown } }) {
  return StyleSheet.flatten(node.props.style);
}

describe('focus-visible and hover interaction states', () => {
  it.each([
    ['primary button', <PrimaryButton key="primary" onPress={jest.fn()}>Continue</PrimaryButton>, 'Continue'],
    ['text action', <TextAction key="text" onPress={jest.fn()}>Back</TextAction>, 'Back'],
    ['selectable row', <Choice key="choice" label="Choice" onPress={jest.fn()} selected={false} />, 'Choice'],
  ])('%s exposes a visible white focus treatment', (_name, component, label) => {
    const view = render(component);
    const control = view.getByRole(label === 'Choice' ? 'radio' : 'button', { name: label });
    fireEvent(control, 'focus');
    expect(flattenedStyle(control).borderColor).toBe(color.textPrimary);
    expect(flattenedStyle(control).borderWidth).toBe(2);
  });

  it('gives the amount input a visible focus treatment', () => {
    const view = render(<CustomStakeInput onChange={jest.fn()} value="" />);
    const input = view.getByLabelText('Custom stake amount in dollars');
    fireEvent(input, 'focus');
    expect(flattenedStyle(input).borderColor).toBe(color.textPrimary);
    expect(flattenedStyle(input).borderWidth).toBe(2);
  });

  it('changes a button on pointer hover', () => {
    const view = render(<PrimaryButton onPress={jest.fn()}>Continue</PrimaryButton>);
    const control = view.getByRole('button', { name: 'Continue' });
    fireEvent(control, 'hoverIn');
    expect(flattenedStyle(control).opacity).toBe(0.9);
  });
});
