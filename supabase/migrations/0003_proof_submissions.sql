-- Sprint 4: append-only proof submissions and private proof-photo storage.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.

create table public.proof_submissions (
  id                   uuid primary key default gen_random_uuid(),
  owner_id             uuid not null references auth.users(id) on delete cascade,
  commitment_id        uuid not null references public.commitments(id) on delete cascade,
  template_id          text not null,
  client_submission_id text not null,
  storage_path         text not null,
  criteria_snapshot    jsonb not null check (
    jsonb_typeof(criteria_snapshot) = 'array'
    and jsonb_array_length(criteria_snapshot) > 0
  ),
  captured_at          timestamptz not null,
  submitted_at         timestamptz not null default now(),
  unique (owner_id, client_submission_id),
  unique (storage_path)
);

alter table public.proof_submissions enable row level security;
alter table public.proof_submissions force row level security;

create policy "proof_submissions_select_own"
  on public.proof_submissions
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create policy "proof_submissions_insert_own"
  on public.proof_submissions
  for insert
  to authenticated
  with check (
    (select auth.uid()) = owner_id
    and exists (
      select 1
      from public.commitments c
      where c.id = commitment_id
        and c.owner_id = (select auth.uid())
        and c.template_id = template_id
        and c.state = 'authorized'
    )
  );

-- Intentionally no UPDATE or DELETE policy: submitted evidence and its checklist
-- snapshot are immutable to clients.
create index proof_submissions_owner_submitted_idx
  on public.proof_submissions (owner_id, submitted_at desc);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'proof-photos',
  'proof-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/heic']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "proof_photos_insert_own_path"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'proof-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "proof_photos_select_own_path"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'proof-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- No client UPDATE or DELETE policy for proof photos.

create table private_proof_rate_limits (
  owner_id     uuid not null,
  window_start timestamptz not null,
  hit_count    integer not null,
  primary key (owner_id, window_start)
);

alter table private_proof_rate_limits enable row level security;
alter table private_proof_rate_limits force row level security;
revoke all on private_proof_rate_limits from anon, authenticated;

create or replace function consume_proof_submission_rate_limit(
  p_owner_id uuid,
  p_limit integer default 6,
  p_window_seconds integer default 60
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz :=
    to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  v_count integer;
begin
  insert into private_proof_rate_limits (owner_id, window_start, hit_count)
  values (p_owner_id, v_window, 1)
  on conflict (owner_id, window_start)
  do update set hit_count = private_proof_rate_limits.hit_count + 1
  returning hit_count into v_count;
  return v_count <= p_limit;
end;
$$;

revoke all on function consume_proof_submission_rate_limit(uuid, integer, integer)
  from public, anon, authenticated;
grant execute on function consume_proof_submission_rate_limit(uuid, integer, integer)
  to service_role;
