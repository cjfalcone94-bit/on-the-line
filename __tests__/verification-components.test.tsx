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
  it.each(['pending', 'in_review', 'needs_review', 'appealed'] as const)('renders the unresolved %s state and published user-favouring SLA', (status) => {
    const view = render(<VerificationCard submission={{ ...base, status }} />);
    expect(view.getByTestId(`verification-${status}`)).toBeTruthy();
    expect(view.getByText('PUBLISHED SLA · WITHIN 24 HOURS')).toBeTruthy();
    expect(view.getByText(/automatically passes in your favour/)).toBeTruthy();
    expect(view.getByText(/never count against you/)).toBeTruthy();
  });

  it('renders a human-readable SLA deadline, not a raw machine timestamp', () => {
    const view = render(<VerificationCard submission={{ ...base, status: 'pending' }} />);
    const paragraph = view.getByText(/If review is not resolved by/).props.children.join('');
    expect(paragraph).not.toMatch(/\d{4}/); // no year — "Aug 9, 2:09 AM" style
    expect(paragraph).not.toMatch(/:\d{2}:\d{2}/); // no seconds
  });

  it('resolves the passed state without the contradictory unresolved-SLA paragraph', () => {
    const view = render(<VerificationCard submission={{ ...base, status: 'passed' }} />);
    expect(view.getByTestId('verification-passed')).toBeTruthy();
    expect(view.getByText('VERIFICATION RESULT')).toBeTruthy();
    expect(view.getByText('Passed')).toBeTruthy();
    expect(view.queryByText(/If review is not resolved/)).toBeNull();
    expect(view.queryByText('PUBLISHED SLA · WITHIN 24 HOURS')).toBeNull();
  });

  it('provides an accessible 52pt appeal action', () => {
    const onPress = jest.fn();
    const view = render(<AppealAction onPress={onPress} />);
    fireEvent.press(view.getByTestId('appeal-decision'));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(view.getByLabelText('Appeal this decision')).toBeTruthy();
  });
});
