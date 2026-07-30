import { fireEvent, render } from '@testing-library/react-native';
import { FixedChecklist, PhotoPreview } from '@/components/proof';

describe('proof components', () => {
  it('renders the template criteria as an explicitly read-only checklist', () => {
    const screen = render(<FixedChecklist criteria={['Exact first criterion', 'Exact second criterion']} />);
    expect(screen.getByText('READ ONLY')).toBeTruthy();
    expect(screen.getByText('Exact first criterion')).toBeTruthy();
    expect(screen.getByTestId('fixed-proof-checklist').props.accessibilityLabel).toContain('Read only');
    expect(screen.queryByRole('checkbox')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
  });

  it('provides an accessible photo preview and retake action', () => {
    const onRetake = jest.fn();
    const screen = render(<PhotoPreview onRetake={onRetake} uri="file:///proof.jpg" />);
    expect(screen.getByLabelText('Your selected proof photo')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Retake or choose another' }));
    expect(onRetake).toHaveBeenCalledTimes(1);
  });
});
