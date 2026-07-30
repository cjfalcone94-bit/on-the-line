# Sprint 8 test output

Date: 2026-07-30

## TypeScript

```text
> on-the-line@1.0.0 typecheck
> tsc --noEmit
```

Result: green (exit 0).

## ESLint

```text
> on-the-line@1.0.0 lint
> expo lint
```

Result: green (exit 0).

## Jest

```text
Test Suites: 21 passed, 21 total
Tests:       79 passed, 79 total
Snapshots:   0 total
Time:        9.552 s
Ran all test suites.
```

Result: green (exit 0).

## iOS production export

```text
iOS Bundled 28901ms node_modules/expo-router/entry.js (1966 modules)
_expo/static/js/ios/entry-f0a3988d4fa362d9b6aa73532ddaa6c9.hbc (5.6MB)
Exported: /tmp/on-the-line-s8-export
```

Result: green (exit 0). Sentry printed the expected missing organization/project warning; external Sentry configuration remains environment-supplied.

## Device-only checks

- `e2e/commitment-record-flow.yaml` and `e2e/commitment-record-recovery.yaml` are authored.
- Maestro is not installed in this build container, so neither flow is claimed green.
- EAS CLI/distribution credentials are not installed in this build container, so no TestFlight/internal upload is claimed.
- Migration `0006_commitment_record_recommit.sql` is written but not applied to live Supabase; it retains the repository's explicit `PENDING APPLY` convention.
