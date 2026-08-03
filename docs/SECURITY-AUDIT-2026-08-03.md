# Security Audit — 2026-08-03 (pre-public)

Three independent adversarial reviews (RLS/schema, edge functions + payments, client/config/CI) before making the repo public. Secret scan of tree + full git history: **CLEAN** (no creds/keys/private material ever committed; only a Stripe *publishable test* key + Supabase URL, both already public in the shipped binary).

## Repo-visibility verdict: SAFE TO PUBLICIZE
No secret is exposed by making the source public. Going public does not unlock any exploit that the running app doesn't already expose.

## Fixed in this commit
- **CRITICAL — forge-commitment RLS hole.** `commitments` had a client INSERT policy (`commitments_insert_own`) letting any authenticated user insert an 'authorized' commitment directly with a forged `processor_auth_reference` and no real payment. Fix: `migrations/0007_lock_commitment_inserts.sql` drops the policy + revokes INSERT from authenticated/anon; creation is service_role-only via the Edge Function (verified no client code inserts directly).
- **MEDIUM — unhandled Stripe exception** in `create-commitment-authorization` finalize: `paymentIntents.retrieve` now wrapped in try/catch → controlled 409 (was a potential 500/probe vector).

## Tracked — PRE-LAUNCH BLOCKERS (not repo-visibility issues; app is sandbox-only today so not live-exploitable)
- **CRITICAL — unappealed human-fail never forfeits.** A moderator 'fail' on a non-appeal initial review sets `resolved_at` but never calls `charge-on-fail`, and `sla-sweep` only scans `resolved_at IS NULL`. A user who fails and does nothing is never charged; charity gets $0. Fix before launch: on `human_fail`(non-appeal) enqueue an appeal-deadline settlement job + a sweep that forfeits after the window. Add a regression test (unappealed human_fail → settled-forfeit). Confirm no out-of-band cron already covers it.
- **MEDIUM — AI vision moderation trusts provider output** with no schema/bounds validation; adversarial image/prompt-injection could force a false auto-pass (releases stake). Fix: strict zod validation (confidence in [0,1], criterionResults length == criteria), raise/remove pure auto-pass above a stake threshold, add perceptual-hash replay check.
- **LOW — disputes/chargebacks/refunds not reconciled** (`processor-webhook` verifies signature correctly but no-ops the event).
- **LOW — charity destination version hardcoded** (`settlement-handler.ts` `version=1`) can silently reroute to fallback charity if a destination is rotated.
- **LOW — race correctness**: `moderate-verification`/`ai-first-pass` don't check their guarded update affected a row before logging/triggering (money movement is still safe — `assertSettleable` re-derives from live state).
- **INFO — CORS `*`** on bearer-auth endpoints (no credential-theft risk with bearer tokens; tighten to app origins).

## Verified correctly hardened (no action)
RLS enabled+forced on all 13 tables; moderation/settlement/rate-limit tables service-role-only; audit tables append-only; SECURITY DEFINER functions pin search_path; auth (getUser) on every user endpoint; IDOR-scoped by owner_id; webhook HMAC verification; server-side amount integrity (client can't set amounts); Stripe idempotency keys; moderator RBAC via app_metadata; proof-path prefix guard; server-hashed criteria (client can't lighten pass bar); internal endpoints gated by shared-secret headers; secure-store for auth tokens; no hardcoded secrets; CI safe for public (no pull_request_target, secret jobs gated to main, no script injection, gitleaks backstop).
