# Device-Truth Definition of Done

“Done” means the change ran successfully through the product on an iOS Simulator at both reference viewports. A build, sprint, merge, or phase gate MUST NOT be marked green unless every blocking check below is green on the same commit:

1. `npm run typecheck`, `npm run lint`, and `npm test -- --ci` pass.
2. GitHub Actions workflow `.github/workflows/device-e2e.yml` passes on both the iPhone SE (3rd generation) and iPhone 15 simulator jobs with `EXPO_PUBLIC_SANDBOX=1`.
3. The Maestro critical path passes by tapping trust → catalog → goal → stake → charity → disclosure → mock authorization → proof → verification → settlement receipt → Commitment Record.
4. `e2e/route-reachability.yaml` passes its tap crawl. Every named route transition must be reached by an actual tap and followed by an assertion on the destination screen.

The device jobs are blocking. A dead tap, unreachable screen, clipped or off-screen primary action, failed assertion, native build failure, app launch failure, or timeout makes the gate red. Screenshots, video, and Maestro/JUnit output are uploaded for diagnosis; artifacts are evidence, not a substitute for a green job.

Self-attestation is INVALID. Web-only, DOM-only, static-render, unit-test-only, screenshot-only, and “works in Expo web” evidence is INVALID for declaring a build or sprint done. A skipped, cancelled, pending, disabled, or `continue-on-error` device job is not green.

## Required repository protection

The `Device truth (iOS + Maestro)` workflow runs on pushes to `main`/`master`, pull requests, and manual dispatch. Repository rules should require both matrix checks before merge:

- `iPhone SE (3rd generation) · critical path + tap crawl`
- `iPhone 15 · critical path + tap crawl`

GitHub Actions must be enabled by the founder. GitHub-hosted macOS minutes are metered and private repositories have plan-dependent quotas; when the quota becomes constraining, move this unchanged blocking job to a trusted self-hosted Mac runner. Until Actions is enabled and the first pushed run is green, the device gate is **wired, first run pending** and no gate may use it as green evidence.
