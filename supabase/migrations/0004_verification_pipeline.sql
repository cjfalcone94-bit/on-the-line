-- Sprint 5: server-only verification queue, immutable decisions and SLA protection.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.

alter table public.proof_submissions
  add column verification_status text not null default 'pending'
    check (verification_status in ('pending', 'in_review', 'passed', 'needs_review')),
  add column resolution_type text
    check (resolution_type in ('ai_pass', 'human_pass', 'human_fail', 'sla_auto_pass')),
  add column resolved_at timestamptz,
  add column sla_deadline timestamptz not null default (now() + interval '24 hours'),
  add column appeal_status text not null default 'none'
    check (appeal_status in ('none', 'pending', 'resolved'));

-- Owner SELECT policy from Sprint 4 exposes only the owner's proof row. Clients
-- retain no UPDATE policy, so all verification state is read-only in the app.

create table public.moderation_queue (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.proof_submissions(id) on delete cascade,
  queue_kind     text not null check (queue_kind in ('initial_review', 'appeal')),
  reason         text not null,
  status         text not null default 'open' check (status in ('open', 'claimed', 'resolved')),
  created_at     timestamptz not null default now(),
  claimed_at     timestamptz,
  resolved_at    timestamptz
);

create table public.moderation_decisions (
  id             uuid primary key default gen_random_uuid(),
  queue_id       uuid not null references public.moderation_queue(id),
  submission_id  uuid not null references public.proof_submissions(id),
  moderator_id   uuid not null,
  decision       text not null check (decision in ('pass', 'fail')),
  reason         text not null,
  created_at     timestamptz not null default now()
);

create table public.verification_transitions (
  id             uuid primary key default gen_random_uuid(),
  submission_id  uuid not null references public.proof_submissions(id),
  from_state     text,
  to_state       text not null,
  resolution_type text,
  actor_type     text not null check (actor_type in ('ai', 'moderator', 'sla', 'user')),
  actor_id       uuid,
  created_at     timestamptz not null default now()
);

alter table public.moderation_queue enable row level security;
alter table public.moderation_queue force row level security;
alter table public.moderation_decisions enable row level security;
alter table public.moderation_decisions force row level security;
alter table public.verification_transitions enable row level security;
alter table public.verification_transitions force row level security;

-- Deliberately no client policies: service_role bypasses RLS for Edge Functions.
revoke all on public.moderation_queue from public, anon, authenticated;
revoke all on public.moderation_decisions from public, anon, authenticated;
revoke all on public.verification_transitions from public, anon, authenticated;
grant all on public.moderation_queue to service_role;
grant all on public.moderation_decisions to service_role;
grant all on public.verification_transitions to service_role;

-- Decision and transition logs are append-only, including for service-role code.
create or replace function public.reject_verification_log_mutation()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  raise exception 'verification logs are append-only';
end;
$$;
create trigger moderation_decisions_append_only
  before update or delete on public.moderation_decisions
  for each row execute function public.reject_verification_log_mutation();
create trigger verification_transitions_append_only
  before update or delete on public.verification_transitions
  for each row execute function public.reject_verification_log_mutation();

create table public.private_appeal_rate_limits (
  owner_id uuid not null,
  window_start timestamptz not null,
  hit_count integer not null,
  primary key (owner_id, window_start)
);
alter table public.private_appeal_rate_limits enable row level security;
alter table public.private_appeal_rate_limits force row level security;
revoke all on public.private_appeal_rate_limits from public, anon, authenticated;

create or replace function public.consume_appeal_rate_limit(
  p_owner_id uuid, p_limit integer default 3, p_window_seconds integer default 3600
) returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into public.private_appeal_rate_limits (owner_id, window_start, hit_count)
  values (p_owner_id, v_window, 1)
  on conflict (owner_id, window_start) do update
    set hit_count = public.private_appeal_rate_limits.hit_count + 1
  returning hit_count into v_count;
  return v_count <= p_limit;
end;
$$;
revoke all on function public.consume_appeal_rate_limit(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_appeal_rate_limit(uuid, integer, integer) to service_role;

create index moderation_queue_open_idx on public.moderation_queue (status, created_at);
create index proof_submissions_sla_idx on public.proof_submissions (sla_deadline)
  where resolved_at is null;

-- Scheduling contract (apply after storing project_url and sla_sweep_secret in
-- Supabase Vault). This is intentionally kept beside the function migration:
--   select cron.schedule(
--     'sla-sweep-hourly', '0 * * * *',
--     $$select net.http_post(
--       url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
--         || '/functions/v1/sla-sweep',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'sla_sweep_secret')
--       ),
--       body := '{}'::jsonb
--     );$$
--   );
-- PENDING APPLY / SCHEDULE: secrets and cron activation require the deployed project.
