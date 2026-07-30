import { fireEvent, render } from '@testing-library/react-native';
import { AppealAction, VerificationCard } from '@/components/verification';

const base = {
  appealAllowed: false,
  id: 'proof-1',
  resolutionType: null,
  slaDeadline: '2026-07-31T12:00:00.000Z',
  submittedAt: '2026-07-30T12:00:00.000Z',
} as const;

describe('verification status UI', () => {
  it.each(['pending', 'in_review', 'passed', 'needs_review', 'appealed'] as const)('renders the %s state and published user-favouring SLA', (status) => {
    const view = render(<VerificationCard submission={{ ...base, status }} />);
    expect(view.getByTestId(`verification-${status}`)).toBeTruthy();
    expect(view.getByText('PUBLISHED SLA · WITHIN 24 HOURS')).toBeTruthy();
    expect(view.getByText(/automatically passes in your favour/)).toBeTruthy();
    expect(view.getByText(/never count against you/)).toBeTruthy();
  });

  it('provides an accessible 52pt appeal action', () => {
    const onPress = jest.fn();
    const view = render(<AppealAction onPress={onPress} />);
    fireEvent.press(view.getByTestId('appeal-decision'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(view.getByLabelText('Appeal this decision')).toBeTruthy();
  });
});
