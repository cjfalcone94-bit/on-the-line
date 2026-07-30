-- 0001_init_default_deny.sql
-- The throwaway/example migration Sprint 1's DoD calls for: proves the
-- default-deny RLS convention every real table copies from Sprint 2 onward
-- (05-STACK rule; TECH-ARCHITECTURE.md §5; 03-RELEASE-READINESS §1B).
-- RLS is enabled + FORCED in the same file as the table. Forward-only.
-- To revert: drop policies, drop table.

create table if not exists public.ping (
  id         uuid primary key default gen_random_uuid(),
  owner_id   uuid not null references auth.users(id) on delete cascade,
  note       text,
  created_at timestamptz not null default now()
);

-- RLS ON and FORCED (even the table owner role can't bypass it) — the
-- default-deny posture TECH-ARCHITECTURE.md requires for every commitment/
-- proof/payment table from Sprint 3 onward.
alter table public.ping enable row level security;
alter table public.ping force row level security;

-- Default deny: no policy exists yet, so every role is denied by construction.
-- Add explicit, narrow policies only when a real table needs them (Sprint 2+).
create policy "ping_select_own"
  on public.ping for select
  using (auth.uid() = owner_id);

create policy "ping_insert_own"
  on public.ping for insert
  with check (auth.uid() = owner_id);

-- No update/delete policy: rows are append-only once written, same posture
-- Sprint 6 (Payments/Custody Hardening) needs for glass_receipts/commitment_record.

-- Adversarial test this migration must pass before merge (Sprint 1 DoD):
-- an UNAUTHENTICATED client (no auth.uid()) selecting/inserting against
-- public.ping is denied. See <app-repo>/e2e or a jest+supabase-js integration
-- test asserting the anon key gets a permission-denied/empty result, never data.
