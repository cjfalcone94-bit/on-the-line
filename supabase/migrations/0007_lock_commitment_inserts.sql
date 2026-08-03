-- SECURITY (audit 2026-08-03): commitment creation must be server-only.
-- The create-commitment-authorization Edge Function inserts commitments with the
-- service_role key AFTER a real Stripe authorization. The client-facing INSERT
-- policy let any authenticated user insert an 'authorized' commitment directly
-- with a forged processor_auth_reference and no real payment behind it, defeating
-- the 'real money at stake' guarantee. Remove the client insert path entirely.
-- Verified: no client/app code inserts into commitments directly; all writes use
-- the service_role admin client (which bypasses RLS), so the legit flow is unaffected.
drop policy if exists "commitments_insert_own" on public.commitments;
revoke insert on public.commitments from authenticated, anon;
