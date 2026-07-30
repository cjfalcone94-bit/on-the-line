-- Sprint 8: preserve the original template choice on the account-backed record.
-- PENDING APPLY: deploy through the vaulted Supabase access token / SQL editor.

alter table public.commitment_record add column template_id text;

update public.commitment_record record
set template_id = commitment.template_id
from public.commitments commitment
where commitment.id = record.commitment_id;

alter table public.commitment_record alter column template_id set not null;
