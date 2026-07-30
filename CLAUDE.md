# On the Line — repository instructions

- Codename: `stakecommit`; product brand: **On the Line**.
- The current delivery boundary is `gates/SPRINT-DOD.md`. Do not add work from a later sprint.
- Use the pinned Expo/React Native/TypeScript stack and the standard root-level repo shape.
- `design/tokens.ts` is locked. UI code must consume it rather than inventing palette, spacing, motion, or haptics.
- Supabase credentials come from environment variables. Never commit or log secrets.
- Every database migration enables and forces RLS in the same file as table creation.
- Analytics is opt-in and off by default. Never send PII, exact financial values, card data, charity destinations, or proof URIs.
- Before committing, run `npm run typecheck`, `npm run lint`, and `npm test -- --ci`.
- Sprint 1 contains foundations only: no catalog, commitment, proof, verification, settlement, payments, custody, pooling, or feature implementation.
