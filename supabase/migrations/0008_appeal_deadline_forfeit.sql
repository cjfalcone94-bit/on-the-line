-- Sprint 8: bounded appeal window then auto-forfeit for unappealed human fails.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.
--
-- Fixes the settlement gap where a moderator FAILS an initial_review item but the
-- user never appeals: the row was left with appeal_status='none', so
-- assertSettleable (verified_failure_required) never permitted the forfeit and no
-- sweep ever revisited it, so charity received $0. We now stamp an appeal_deadline
-- on such fails and add a forfeit-sweep that finalizes the forfeit once the window
-- elapses without an appeal.

alter table public.proof_submissions
  add column appeal_deadline timestamptz;

-- No client UPDATE/DELETE policy exists on proof_submissions (Sprint 4/5): all
-- verification state, including appeal_deadline, is written only by service_role
-- Edge Functions and remains read-only through the owner SELECT policy.

-- Partial index mirrors proof_submissions_sla_idx: it supports the forfeit-sweep
-- scan for due, unappealed human fails without bloating the general index set.
create index proof_submissions_appeal_deadline_idx
  on public.proof_submissions (appeal_deadline)
  where resolution_type = 'human_fail' and appeal_status = 'none';

-- The automated forfeit sweep needs an audit actor. Extend the verification
-- transition actor set additively with 'system' (append-only trigger unchanged).
alter table public.verification_transitions
  drop constraint verification_transitions_actor_type_check,
  add constraint verification_transitions_actor_type_check
    check (actor_type in ('ai', 'moderator', 'sla', 'user', 'system'));

-- Scheduling contract (apply after storing project_url and forfeit_sweep_secret in
-- Supabase Vault), mirroring the sla-sweep contract in 0004:
--   select cron.schedule(
--     'forfeit-sweep-hourly', '0 * * * *',
--     $$select net.http_post(
--       url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
--         || '/functions/v1/forfeit-sweep',
--       headers := jsonb_build_object(
--         'Content-Type', 'application/json',
--         'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'forfeit_sweep_secret')
--       ),
--       body := '{}'::jsonb
--     );$$
--   );
-- PENDING APPLY / SCHEDULE: secrets and cron activation require the deployed project.
