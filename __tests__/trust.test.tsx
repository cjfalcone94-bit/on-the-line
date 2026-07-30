import { facts } from '@/screens/trustContent';
import { render } from '@testing-library/react-native';
import { HeldArtwork } from '@/components';

describe('trust screen content', () => {
  it('states authorization, success, and charity-only failure plainly', () => {
    expect(facts.map((fact) => fact.title)).toEqual([
      'Authorized, not charged',
      'Success costs no stake',
      'Failure has one destination',
    ]);
    expect(facts[0].body).toContain('never charged unless a failure is verified');
    expect(facts[1].body).toContain('authorization is simply released');
    expect(facts[2].body).toContain('never to us or another user');
  });

  it('keeps financial framing free of hype and banned language', () => {
    const copy = facts.flatMap((fact) => [fact.title, fact.body]).join(' ').toLowerCase();
    expect(copy).not.toMatch(/jackpot|bet the house|!/);
  });

  it('renders the required founder-handoff HOLD instead of fake artwork', () => {
    const { getByTestId, getByText } = render(<HeldArtwork />);
    expect(getByTestId('founder-artwork-hold')).toBeTruthy();
    expect(getByText('[HELD — onboarding illustration pending founder]')).toBeTruthy();
  });
});
