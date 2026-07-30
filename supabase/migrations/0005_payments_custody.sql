-- Sprint 6: hybrid-fee settlement ledger and default-deny receipt/history data.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.

alter table public.commitments
  drop constraint commitments_state_check,
  add constraint commitments_state_check check (
    state in ('authorized', 'voided', 'settling', 'settled-success', 'settled-forfeit')
  ),
  add column payment_method_reference text,
  add column base_fee_cents integer not null default 100 check (base_fee_cents > 0),
  add column base_fee_reference text,
  add column settlement_started_at timestamptz,
  add column settled_at timestamptz;

create table public.charity_destinations (
  id                    text not null,
  version               integer not null check (version > 0),
  display_name          text not null,
  stripe_destination_id text not null,
  active                boolean not null default true,
  is_fallback           boolean not null default false,
  created_at            timestamptz not null default now(),
  primary key (id, version)
);
alter table public.charity_destinations enable row level security;
alter table public.charity_destinations force row level security;
revoke all on public.charity_destinations from public, anon, authenticated;
grant all on public.charity_destinations to service_role;

alter table public.commitments
  add column charity_destination_version integer not null default 1;

create table public.glass_receipts (
  id                         uuid primary key default gen_random_uuid(),
  owner_id                   uuid not null references auth.users(id) on delete cascade,
  commitment_id              uuid not null unique references public.commitments(id),
  outcome                    text not null check (outcome in ('success', 'forfeit')),
  stake_cents                integer not null check (stake_cents > 0),
  base_fee_cents             integer not null check (base_fee_cents > 0),
  success_fee_cents          integer not null default 0 check (success_fee_cents >= 0),
  charity_destination_id     text not null,
  charity_destination_version integer not null,
  processor_stake_reference  text not null,
  processor_fee_reference    text,
  processor_transfer_reference text,
  fallback_used              boolean not null default false,
  settled_at                 timestamptz not null default now(),
  check (
    (outcome = 'success' and success_fee_cents > 0 and processor_fee_reference is not null and processor_transfer_reference is null)
    or
    (outcome = 'forfeit' and success_fee_cents = 0 and processor_fee_reference is null and processor_transfer_reference is not null)
  )
);
alter table public.glass_receipts enable row level security;
alter table public.glass_receipts force row level security;
create policy "glass_receipts_select_own" on public.glass_receipts
  for select to authenticated using ((select auth.uid()) = owner_id);
-- No client INSERT/UPDATE/DELETE policy. Settlement functions use service_role.

create table public.commitment_record (
  commitment_id          uuid primary key references public.commitments(id),
  owner_id               uuid not null references auth.users(id) on delete cascade,
  outcome                text not null check (outcome in ('success', 'forfeit')),
  stake_cents            integer not null,
  base_fee_cents         integer not null,
  success_fee_cents      integer not null,
  charity_destination_id text not null,
  settled_at             timestamptz not null
);
alter table public.commitment_record enable row level security;
alter table public.commitment_record force row level security;
create policy "commitment_record_select_own" on public.commitment_record
  for select to authenticated using ((select auth.uid()) = owner_id);
-- Derived only by settlement writes; no client mutation policy.

create table public.private_settlement_jobs (
  submission_id uuid primary key references public.proof_submissions(id) on delete cascade,
  outcome text not null check (outcome in ('success', 'forfeit')),
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
alter table public.private_settlement_jobs enable row level security;
alter table public.private_settlement_jobs force row level security;
revoke all on public.private_settlement_jobs from public, anon, authenticated;
grant all on public.private_settlement_jobs to service_role;

create or replace function public.enqueue_resolved_settlement()
returns trigger language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if new.resolved_at is null then return new; end if;
  if new.verification_status = 'passed' then
    insert into public.private_settlement_jobs (submission_id, outcome)
    values (new.id, 'success') on conflict (submission_id) do nothing;
  elsif new.verification_status = 'needs_review'
    and new.resolution_type = 'human_fail'
    and new.appeal_status = 'resolved' then
    insert into public.private_settlement_jobs (submission_id, outcome)
    values (new.id, 'forfeit') on conflict (submission_id) do nothing;
  end if;
  return new;
end;
$$;
create trigger proof_resolution_enqueues_settlement
  after update of resolved_at, verification_status, resolution_type, appeal_status
  on public.proof_submissions
  for each row execute function public.enqueue_resolved_settlement();

create table public.private_commitment_rate_limits (
  owner_id uuid not null,
  operation text not null check (operation in ('commitment_create', 'card_authorization')),
  window_start timestamptz not null,
  hit_count integer not null,
  primary key (owner_id, operation, window_start)
);
alter table public.private_commitment_rate_limits enable row level security;
alter table public.private_commitment_rate_limits force row level security;
revoke all on public.private_commitment_rate_limits from public, anon, authenticated;

create or replace function public.consume_commitment_rate_limit(
  p_owner_id uuid, p_operation text, p_limit integer default 5, p_window_seconds integer default 60
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  if p_operation not in ('commitment_create', 'card_authorization') then
    raise exception 'invalid operation';
  end if;
  insert into public.private_commitment_rate_limits (owner_id, operation, window_start, hit_count)
  values (p_owner_id, p_operation, v_window, 1)
  on conflict (owner_id, operation, window_start) do update
    set hit_count = public.private_commitment_rate_limits.hit_count + 1
  returning hit_count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_commitment_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_commitment_rate_limit(uuid, text, integer, integer) to service_role;

create index glass_receipts_owner_settled_idx on public.glass_receipts (owner_id, settled_at desc);
create index commitment_record_owner_settled_idx on public.commitment_record (owner_id, settled_at desc);
create index private_settlement_jobs_due_idx on public.private_settlement_jobs (next_attempt_at);
