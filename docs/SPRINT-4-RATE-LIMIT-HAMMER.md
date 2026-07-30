# Proof submission rate-limit hammer requirement

The `submit-proof` Edge Function permits six authenticated attempts per owner in
each 60-second server window. The counter is held behind a service-role-only
`security definer` RPC; clients cannot read or alter it.

After migration `0003` and the function are applied in a non-production Supabase
environment, run seven valid requests with one user/token and distinct client
submission IDs inside 60 seconds. Requests 1–6 must return `200` or `201`;
request 7 must return `429 {"error":"rate_limited"}`. Repeat with a second user:
their first request must still be accepted. A live hammer result remains pending
until the migration/function are deployed.
