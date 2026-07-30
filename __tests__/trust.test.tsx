import { facts } from '@/screens/trustContent';
import { render } from '@testing-library/react-native';
import { OnboardingArtwork } from '@/components';

describe('trust screen content', () => {
  it('states authorization, success, and charity-only failure plainly', () => {
    expect(facts.map((fact) => fact.title)).toEqual([
      'Stake authorized, base fee charged',
      'Success releases the stake',
      'Failure has one destination',
    ]);
    expect(facts[0].body).toContain('separate base service fee');
    expect(facts[1].body).toContain('separate small success fee');
    expect(facts[2].body).toContain('100% of your stake');
    expect(facts[2].body).toContain('keep none');
  });

  it('keeps financial framing free of hype and banned language', () => {
    const copy = facts.flatMap((fact) => [fact.title, fact.body]).join(' ').toLowerCase();
    expect(copy).not.toMatch(/jackpot|bet the house|!/);
  });

  it('renders the founder-delivered onboarding illustration', () => {
    const { getByTestId } = render(<OnboardingArtwork />);
    expect(getByTestId('onboarding-artwork')).toBeTruthy();
  });
});
