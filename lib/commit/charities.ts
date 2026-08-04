export type Charity = Readonly<{
  id: string;
  name: string;
  category: string;
}>;

export const charities: readonly Charity[] = [
  { id: 'direct-relief', name: 'Direct Relief', category: 'Health' },
  { id: 'donorschoose', name: 'DonorsChoose', category: 'Education' },
  { id: 'best-friends', name: 'Best Friends Animal Society', category: 'Animal welfare' },
  { id: 'team-rubicon', name: 'Team Rubicon', category: 'Disaster relief' },
  { id: 'feeding-america', name: 'Feeding America', category: 'Community' },
] as const;

export function findCharity(id: string | undefined): Charity | undefined {
  return charities.find((charity) => charity.id === id);
}
