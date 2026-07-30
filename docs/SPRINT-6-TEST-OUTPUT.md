# Sprint 6 verification output

Run from `/workspace/.apps/on-the-line` on 2026-07-30:

```text
$ npm run typecheck
> on-the-line@1.0.0 typecheck
> tsc --noEmit

$ npm run lint
> on-the-line@1.0.0 lint
> expo lint

$ npm test -- --ci --runInBand
> on-the-line@1.0.0 test
> jest --ci --runInBand

PASS __tests__/settlement-contract.test.ts
PASS __tests__/catalog.test.tsx
PASS __tests__/trust.test.tsx
PASS __tests__/verification-components.test.tsx
PASS __tests__/commit-components.test.tsx
PASS __tests__/env.test.ts
PASS __tests__/commit-contract.test.ts
PASS __tests__/proof-components.test.tsx
PASS __tests__/commit-logic.test.ts
PASS __tests__/verification-security.test.ts
PASS __tests__/proof-reminders.test.ts
PASS __tests__/instrumentation.test.ts
PASS __tests__/verification-contract.test.ts
PASS __tests__/analytics.test.ts
PASS __tests__/proof-queue.test.ts
PASS __tests__/proof-contract.test.ts
PASS __tests__/tokens.test.ts
PASS __tests__/privacy.test.ts

Test Suites: 18 passed, 18 total
Tests:       69 passed, 69 total
Snapshots:   0 total
```

The Stripe calls in the Sprint 6 contract suite are mocks. Migration/function apply and a live-key run remain pending for Phase 9.

