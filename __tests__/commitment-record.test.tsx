import { fireEvent, render } from '@testing-library/react-native';
import { CommitmentRecordCard, CommitmentRecordEmpty } from '@/components/commitment-record';
import { demoCommitmentRecord, getCommitmentRecord } from '@/lib/record/service';

describe('Commitment Record', () => {
  it('renders the exact empty-state voice and approved next action', () => {
    const onBrowse = jest.fn();
    const view = render(<CommitmentRecordEmpty onBrowse={onBrowse} />);
    expect(view.getByText("No commitments yet. Pick a goal, set a stake, and we'll hold you to it — fairly.")).toBeTruthy();
    fireEvent.press(view.getByRole('button', { name: 'Browse goals' }));
    expect(onBrowse).toHaveBeenCalledTimes(1);
  });

  it('shows the past template, outcome, stake, receipt and re-commit actions', () => {
    const onReceipt = jest.fn();
    const onRecommit = jest.fn();
    const item = demoCommitmentRecord[0];
    const view = render(<CommitmentRecordCard item={item} onReceipt={onReceipt} onRecommit={onRecommit} />);
    expect(view.getByText('Daily outdoor walk')).toBeTruthy();
    expect(view.getByText('SETTLED · SUCCESS')).toBeTruthy();
    expect(view.getByText('$40 stake · Direct Relief')).toBeTruthy();
    fireEvent.press(view.getByTestId(`receipt-${item.commitmentId}`));
    fireEvent.press(view.getByTestId(`recommit-${item.commitmentId}`));
    expect(onReceipt).toHaveBeenCalledTimes(1);
    expect(onRecommit).toHaveBeenCalledTimes(1);
  });

  it('restores the full authenticated account record in settled order using the UI query', async () => {
    const rows = [
      { charity_destination_id: 'direct-relief', commitment_id: 'one', outcome: 'success', settled_at: '2026-07-30T00:00:00Z', stake_cents: 4000, template_id: 'daily-walk' },
      { charity_destination_id: 'feeding-america', commitment_id: 'two', outcome: 'forfeit', settled_at: '2026-07-29T00:00:00Z', stake_cents: 2000, template_id: 'read-20' },
    ];
    const order = jest.fn().mockResolvedValue({ data: rows, error: null });
    const select = jest.fn().mockReturnValue({ order });
    const from = jest.fn().mockReturnValue({ select });
    const client = { auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'account-a' } }, error: null }) }, from };
    const restored = await getCommitmentRecord(client as never);
    expect(from).toHaveBeenCalledWith('commitment_record');
    expect(select).toHaveBeenCalledWith('commitment_id, template_id, outcome, stake_cents, charity_destination_id, settled_at');
    expect(order).toHaveBeenCalledWith('settled_at', { ascending: false });
    expect(restored).toHaveLength(2);
  });
});
