# Sprint 6 financial-surface red-team

Date: 2026-07-30. Scope: commitment authorization, hybrid fees, settlement, receipts, webhook, and retry queue.

| Attack | Control | Result |
|---|---|---|
| Client calls capture directly | Settlement functions reject requests without a server-only secret and independently require a resolved verification record | Green |
| Replay causes a second charge/transfer | Stable per-commitment idempotency keys cover authorization, base fee, release, success fee, capture, and charity transfer | Green |
| Cancelled commitment settles | Contract rejects `voided`; database compare-and-set claims only `authorized` rows | Green |
| Failure fee is carved from stake | Forfeit contract captures and transfers the same `stake_cents`; it invokes no fee operation | Green |
| Cross-user receipt/history access | RLS is enabled and forced; owner-only SELECT and no client mutation policies | Green |
| Forged Stripe webhook | Raw payload is verified with Stripe’s signing secret; missing/invalid signatures return 400 | Green |
| Card-testing hammer | Separate per-user authorization and commitment-creation counters return 429 after five requests per minute | Green |
| Edge invocation fails after verification commits | Default-deny settlement outbox retries with bounded exponential backoff; processor operations remain idempotent | Green |
| Declared charity is unavailable | Versioned server-vetted destination lookup routes to the single configured fallback and records `fallback_used` | Yellow: destination rows and fallback must be provisioned during migration apply |
| Processor/KYC configuration is wrong | No live secret is committed; mocked contracts prove call shape | Yellow: live Stripe/Connect run is deliberately pending Phase 9 |

No pooled ledger, peer payout, escrow, FBO, or Glass Receipt screen was added.
