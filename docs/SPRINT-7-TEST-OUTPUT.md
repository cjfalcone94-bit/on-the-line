# Sprint 7 verification — 2026-07-30

## Local quality gates

```text
$ npm run typecheck
> tsc --noEmit
exit 0

$ npm run lint
> expo lint
exit 0

$ npm test -- --ci
Test Suites: 19 passed, 19 total
Tests:       73 passed, 73 total
Snapshots:   0 total
exit 0
```

## Production bundle

```text
$ npx expo export --platform ios --output-dir dist-sprint-7
iOS Bundled 27754ms ... (1962 modules)
assets/sounds/ledger-riffle.wav (16KB)
ios Hermes bundle: 5.6MB
Exported: dist-sprint-7
exit 0
```

## Device/infrastructure checks

- `maestro` is not installed in this execution environment. Both required flows were upgraded from Sprint 6 API-only assertions to visual receipt assertions, but they were not honestly marked green.
- TestFlight/internal shipping remains pending Apple/EAS credentials. This is an external release dependency, not replaced with invented evidence.
- The live Supabase migration/apply remains pending its vaulted project credentials; Sprint 7 consumes the Sprint 6 receipt contract without adding payment or settlement logic.

## Graphics holds

- `assets/share/watermark.png`: HELD. The founder repo contains only `watermark-reference.png`, which was copied into the app for traceability and is not passed off as a clean overlay.
- Light-surface logo variant in `assets/logo/`: HELD. The export compositor uses native, on-voice typography and the locked inverted palette; it does not fake the missing image asset.
