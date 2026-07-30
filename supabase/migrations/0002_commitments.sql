-- Sprint 3: commitments are append-only financial records.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.

create table public.commitments (
  id                       uuid primary key default gen_random_uuid(),
  owner_id                 uuid not null references auth.users(id) on delete cascade,
  template_id              text not null,
  stake_cents              integer not null check (stake_cents between 500 and 100000),
  currency                 text not null default 'usd' check (currency = 'usd'),
  cadence                   text not null,
  charity_destination_id   text not null,
  processor_auth_reference text not null unique,
  state                     text not null default 'authorized' check (state in ('authorized', 'voided')),
  authorized_at             timestamptz not null default now(),
  authorization_expires_at timestamptz not null,
  created_at                timestamptz not null default now()
);

alter table public.commitments enable row level security;
alter table public.commitments force row level security;

create policy "commitments_select_own"
  on public.commitments
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "commitments_insert_own"
  on public.commitments
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and state = 'authorized'
  );

-- Intentionally no UPDATE or DELETE policy. This makes state and the
-- pre-declared charity immutable to clients after commit. Any later lifecycle
-- transition must use a narrowly scoped server-side security-definer path.

create index commitments_owner_created_idx
  on public.commitments (owner_id, created_at desc);
