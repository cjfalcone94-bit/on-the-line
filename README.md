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

Copy `.env.example` to `.env` and inject the public Supabase and Stripe
publishable keys through the project vault. `STRIPE_SECRET_KEY` is server-only
and belongs in Supabase Edge Function secrets, never in an Expo client env.
Observability remains disabled until configured; analytics additionally
requires explicit user consent.

The Sprint 3 commit flow uses Stripe PaymentSheet tokenization and
`create-commitment-authorization`: the PaymentIntent is created with manual
capture, and a commitment row is persisted only after Stripe reports
`requires_capture` with zero received. Apply
`supabase/migrations/0002_commitments.sql` before deploying the function.
