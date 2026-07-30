# On the Line

Expo + React Native + TypeScript foundation for **On the Line** (repository
codename `stakecommit`).

## Local checks

```bash
npm ci
npm run typecheck
npm run lint
npm test -- --ci
```

Copy `.env.example` to `.env` and supply the public Supabase anon key through
the project vault. Observability remains disabled until its environment values
are configured; analytics additionally requires explicit user consent.

Sprint scope is recorded in `gates/SPRINT-DOD.md`. Product features are
deliberately absent from this foundations scaffold.
