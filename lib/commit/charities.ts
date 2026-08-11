export type Charity = Readonly<{
  id: string;
  name: string;
  category: string;
}>;

// Australian DGR charities for the AU launch. The `id`s are legacy placeholders
// kept stable (they key the category icons, testIDs, and demo records) — they get
// reworked into real charity/PayPal-Giving-Fund-AU identifiers when the live AU
// disbursement rail is wired at the real-money step. Categories are unchanged so
// the existing category icons (health/education/animal-welfare/disaster-relief/
// community) map straight through. Verify each on ABN Lookup / the ACNC register
// before real-money launch.
export const charities: readonly Charity[] = [
  { id: 'fred-hollows', name: 'The Fred Hollows Foundation', category: 'Health' },
  { id: 'smith-family', name: 'The Smith Family', category: 'Education' },
  { id: 'rspca-au', name: 'RSPCA Australia', category: 'Animal welfare' },
  { id: 'red-cross-au', name: 'Australian Red Cross', category: 'Disaster relief' },
  { id: 'foodbank-au', name: 'Foodbank Australia', category: 'Community' },
] as const;

export function findCharity(id: string | undefined): Charity | undefined {
  return charities.find((charity) => charity.id === id);
}
