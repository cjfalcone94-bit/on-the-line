import { render } from '@testing-library/react-native';
import { GlassReceiptCard, receiptLines } from '@/components/glass-receipt';
import type { GlassReceipt } from '@/lib/settlement/types';

const base: GlassReceipt = {
  id: 'receipt-1',
  commitmentId: 'commitment-1',
  outcome: 'success',
  stakeCents: 4000,
  baseFeeCents: 100,
  successFeeCents: 150,
  charityName: 'Direct Relief',
  transactionReference: 'AUTH-RELEASED',
  routedReference: null,
  settledAt: '2026-07-30T12:00:00.000Z',
};

describe('Glass Receipt', () => {
  it('itemizes released authorization, zero stake capture, and separate hybrid fees on success', () => {
    expect(receiptLines(base)).toEqual([
      { label: 'Stake authorization', value: '$40.00', detail: 'Released' },
      { label: 'Stake captured', value: '$0.00' },
      { label: 'Base service fee', value: '$1.00', detail: 'Paid separately at commit' },
      { label: 'Success fee', value: '$1.50', detail: 'Paid separately on success' },
      { label: 'Forfeiture', value: '$0.00', detail: 'No forfeiture occurred' },
    ]);
  });

  it('shows that the platform keeps none of a full charity forfeit', () => {
    const lines = receiptLines({ ...base, outcome: 'forfeit', successFeeCents: 0, routedReference: 'TR-CHARITY' });
    expect(lines).toContainEqual({ label: 'To charity', value: '$40.00', detail: 'Direct Relief' });
    expect(lines).toContainEqual({ label: 'Success fee', value: '$0.00', detail: 'Never charged on a forfeit' });
    expect(lines).toContainEqual({ label: 'Platform kept', value: '$0.00', detail: '100% of the stake routed to charity' });
  });

  it('uses the same receipt structure and only changes semantic outcome styling/copy', () => {
    const success = render(<GlassReceiptCard receipt={base} />);
    expect(success.getByText('SETTLED · SUCCESS')).toBeTruthy();
    expect(success.getByText('Your authorization was released. Nothing was captured from your stake.')).toBeTruthy();
    success.unmount();

    const failure = render(<GlassReceiptCard receipt={{ ...base, outcome: 'forfeit', successFeeCents: 0, routedReference: 'TR-CHARITY' }} />);
    expect(failure.getByText('SETTLED · FORFEIT')).toBeTruthy();
    expect(failure.getByText('Your full $40.00 stake was routed to Direct Relief.')).toBeTruthy();
  });

  it('progressively reveals lines without introducing a ScrollView', () => {
    const rendered = render(<GlassReceiptCard receipt={base} visibleLines={2} />);
    expect(rendered.getByTestId('receipt-line-1')).toBeTruthy();
    expect(rendered.getByTestId('receipt-line-2')).toBeTruthy();
    expect(rendered.queryByTestId('receipt-line-3')).toBeNull();
    expect(rendered.toJSON()).not.toContain('RCTScrollView');
  });
});
