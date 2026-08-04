-- Sprint 9: replace the dead Stripe Connect charity transfer with Change (getchange.io)
-- disbursements, and add the durable money-safety state the live-payment review demands.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.
--
-- Fixes folded in from docs/LIVE-PAYMENT-REVIEW-2026-08-04.md:
--   C1 — charity leg was operationally unwired (no seeded destinations, no onward mover).
--   C2 — a failed onward move after capture stranded real money with only a stuck row.
--   H3 — a base-fee-fail whose auth-release also failed could leave a lingering card hold.

-- ---------------------------------------------------------------------------
-- 1. charity_destinations: Stripe Connect account id -> Change nonprofit identity.
-- ---------------------------------------------------------------------------
-- The table was never seeded (C1), so dropping the Stripe column is a no-op on data.
-- commitments.charity_destination_id stays the immutable slug ('direct-relief', ...);
-- this table resolves slug -> provider_nonprofit_id at settlement time.
alter table public.charity_destinations
  drop column stripe_destination_id,
  add column provider text not null default 'change'
    check (provider in ('change', 'goodstack')),
  add column provider_nonprofit_id text,  -- Change nonprofit_id; NULL until backfilled by EIN.
  add column ein text;                     -- source-of-truth for re-resolution; never invented.

-- ---------------------------------------------------------------------------
-- 2. charity_disbursements: durable per-commitment onward-donation state (C2/R3).
-- ---------------------------------------------------------------------------
-- One row per forfeited commitment. The stake is captured to our balance FIRST, so this
-- row is the ledger of money OWED TO CHARITY between capture and Change's monthly invoice.
-- A 'failed'/'pending' row is retryable by settlement-sweep and is never silently kept.
-- external_id = commitment_id is our own idempotency guard because Change's native
-- idempotency is undocumented (review R3).
create table public.charity_disbursements (
  commitment_id          uuid primary key references public.commitments(id),
  owner_id               uuid not null references auth.users(id) on delete cascade,
  charity_destination_id text not null,           -- slug, e.g. 'direct-relief'
  nonprofit_id           text not null,           -- resolved Change nonprofit_id
  amount_cents           integer not null check (amount_cents > 0),
  currency               text not null default 'usd' check (currency = 'usd'),
  external_id            text not null,           -- = commitment_id::text; our dedupe key
  provider               text not null default 'change' check (provider in ('change', 'goodstack')),
  provider_donation_id   text,                    -- Change donation id (set on success)
  provider_status        text,                    -- last provider-reported status
  status                 text not null default 'pending'
    check (status in ('pending', 'succeeded', 'failed')),
  last_error             text,
  confirmed_at           timestamptz,             -- set by change-webhook on sent/received
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);
alter table public.charity_disbursements enable row level security;
alter table public.charity_disbursements force row level security;
revoke all on public.charity_disbursements from public, anon, authenticated;
grant all on public.charity_disbursements to service_role;
create index charity_disbursements_status_idx
  on public.charity_disbursements (status) where status <> 'succeeded';
create index charity_disbursements_donation_idx
  on public.charity_disbursements (provider_donation_id);

-- Compare-and-set failure marker: only a still-pending row degrades to 'failed', so a
-- webhook or a later retry that already recorded success can never be clobbered.
create or replace function public.mark_disbursement_failed(
  p_commitment_id uuid, p_error text
) returns void language plpgsql security definer set search_path = public, pg_temp as $$
begin
  update public.charity_disbursements
    set status = 'failed', last_error = p_error, updated_at = now()
    where commitment_id = p_commitment_id and status = 'pending';
end;
$$;
revoke all on function public.mark_disbursement_failed(uuid, text) from public, anon, authenticated;
grant execute on function public.mark_disbursement_failed(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- 3. private_pending_releases: guaranteed auth-hold release (H3).
-- ---------------------------------------------------------------------------
-- When a base-fee charge fails at finalize we cancel (release) the stake auth. If that
-- cancel ALSO fails, we previously swallowed the error and marked the commitment voided,
-- leaving a lingering hold on the user's card. We now record the owed release durably so
-- release-sweep can retry it to completion.
create table public.private_pending_releases (
  commitment_id   uuid primary key references public.commitments(id),
  auth_reference  text not null,
  reason          text not null,
  attempts        integer not null default 0,
  last_error      text,
  next_attempt_at timestamptz not null default now(),
  created_at      timestamptz not null default now()
);
alter table public.private_pending_releases enable row level security;
alter table public.private_pending_releases force row level security;
revoke all on public.private_pending_releases from public, anon, authenticated;
grant all on public.private_pending_releases to service_role;
create index private_pending_releases_due_idx on public.private_pending_releases (next_attempt_at);

-- ---------------------------------------------------------------------------
-- 4. SEED TEMPLATE — DATA STEP, apply only after the founder confirms real EINs.
-- ---------------------------------------------------------------------------
-- Do NOT invent EINs or nonprofit ids. Fill EIN from the charity's IRS record, then
-- resolve provider_nonprofit_id via GET /v1/nonprofits?ein= (change-disbursement.ts
-- lookupNonprofit) before uncommenting. Launch with 5 charities to stay inside Change's
-- Starter tier (review R1). Mark exactly one is_fallback=true.
--
-- insert into public.charity_destinations
--   (id, version, display_name, provider, provider_nonprofit_id, ein, active, is_fallback) values
--   ('direct-relief',   1, 'Direct Relief',                'change', '<CHANGE_NONPROFIT_ID>', '<EIN 95-1831116>', true, true),
--   ('donorschoose',    1, 'DonorsChoose',                 'change', '<CHANGE_NONPROFIT_ID>', '<EIN __-_______>', true, false),
--   ('best-friends',    1, 'Best Friends Animal Society',  'change', '<CHANGE_NONPROFIT_ID>', '<EIN __-_______>', true, false),
--   ('team-rubicon',    1, 'Team Rubicon',                 'change', '<CHANGE_NONPROFIT_ID>', '<EIN __-_______>', true, false),
--   ('feeding-america', 1, 'Feeding America',              'change', '<CHANGE_NONPROFIT_ID>', '<EIN __-_______>', true, false);
-- After seeding: alter table public.charity_destinations alter column provider_nonprofit_id set not null;

-- ---------------------------------------------------------------------------
-- 5. Scheduling contract for release-sweep (apply after storing the secret in Vault),
--    mirroring the sla-sweep / forfeit-sweep contracts:
--   select cron.schedule(
--     'release-sweep-15min', '*/15 * * * *',
--     $$select net.http_post(
--       url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
--         || '/functions/v1/release-sweep',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'release_sweep_secret')
--       )
--     )$$
--   );
