# Commit flow dead-tap fix — builder self-report

- Date: 2026-08-02
- Built by: Codex `/root` session
- Status: Ready for independent adversarial verification
- Scope: Founder-reported build-10 commit-flow blocker

## Root cause reproduced

`StakeChoice` and `CharityChoice` are `InteractivePressable` controls rendered inside `ScreenEntrance`. `ScreenEntrance` used a Reanimated wrapper that animated both opacity and translated transforms over its entire interactive subtree. This is the same iOS dead-tap class previously found in the catalog: the animated ancestor can break native touch targeting/delivery. A missed stake tap leaves `stakeCents` undefined, so the pinned `Choose charity` action remains disabled and the journey dead-ends before authorization.

The build-9 catalog fix removed the list-specific instance but did not make the shared `ScreenEntrance` primitive safe, leaving commit and other screens exposed.

## Root fix

`components/ui.tsx` now makes `ScreenEntrance`:

- opacity-only (no translated transform on an interactive subtree); and
- explicitly touch-transparent with `pointerEvents="box-none"`, so the wrapper itself cannot become the touch target while its children remain interactive.

The public `direction` prop remains accepted for call-site compatibility, but no longer moves screen content. `__tests__/screen-entrance.test.tsx` permanently asserts the touch-transparent wrapper contract and that a nested `InteractivePressable` still receives a press.

Stake and charity radio controls also publish an explicit `aria-checked` state. The E2E test therefore proves selection state directly, in addition to proving that each dependent primary action changes from disabled to enabled.

## Whole-app animated-interaction audit

| Surface | Finding | Result |
|---|---|---|
| Launch / trust | `ScreenEntrance`; primary footer is outside it | Safe under shared opacity-only, `box-none` contract |
| Catalog | Back control remains inside header `ScreenEntrance`; goal cards are outside it after build-9 list fix | Shared fix covers header; cards have no animated ancestor |
| Goal card / template | Back text action is inside `ScreenEntrance`; Set stake footer is outside | Shared fix covers back action |
| Commit — stake | Stake radios and custom input are inside `ScreenEntrance` | Fixed and clicked |
| Commit — charity | Charity radios and pagination actions are inside `ScreenEntrance` | Fixed and clicked |
| Commit — disclosure | Content is inside `ScreenEntrance`; primary footer is outside | Safe and clicked through |
| Commit — card | Sandbox outcome switch is inside `ScreenEntrance`; authorization footer is outside | Shared fix covers switch; authorization clicked |
| Proof | Sandbox proof and photo-library actions are inside `ScreenEntrance`; submit footer is outside | Fixed and clicked |
| Verify | Retry/state-panel and appeal controls may render inside `ScreenEntrance`; settlement footer is outside | Shared fix covers nested controls; settlement clicked |
| Settle / Glass Receipt | Sound switch is inside `ScreenEntrance`; record/share footer is outside | Shared fix covers sound; record action clicked |
| Commitment Record | Interactive receipt/re-commit controls are in plain views, not animated wrappers | No unsafe animated ancestor |
| Settings | Sound switch is in a plain view, not an animated wrapper | No unsafe animated ancestor |

The remaining `Animated.View` in `components/glass-receipt.tsx` reveals receipt text lines only and contains no pressable/selectable child. `InteractivePressable` itself uses an animated pressable as the actual native touch target; it is not an animated ancestor layered over another control.

## Full rendered journey evidence

The sandbox web export was built with `EXPO_PUBLIC_SANDBOX=1`. Playwright then clicked every transition at 375×667, from a cleared local sandbox through the new record entry. Evidence:

1. `step-01-launch.png` — trust launch
2. `step-02-browse.png` — Browse goal catalog
3. `step-03-goal-card.png` — opened Daily outdoor walk
4. `step-04-set-stake.png` — stake screen, Choose charity disabled
5. `step-05-stake-selected.png` — clicked $40, radio checked, Choose charity enabled
6. `step-06-choose-charity.png` — charity step reached
7. `step-07-charity-selected.png` — clicked Direct Relief, radio checked, Review enabled
8. `step-08-mechanic-review.png` — disclosure / mechanic review
9. `step-09-card-authorization.png` — mock card authorization step
10. `step-10-authorized.png` — mock stake authorized
11. `step-11-proof-ready.png` — mock proof selected
12. `step-12-proof-submitted.png` — proof submitted
13. `step-13-verified.png` — verification passed
14. `step-14-glass-receipt.png` — `SETTLED · SUCCESS` Glass Receipt
15. `step-15-record-entry.png` — Commitment Record contains Daily outdoor walk and Glass Receipt action

Machine-readable run summary is in `evidence/commit-flow/verification.txt`. The permanent journey test is `e2e/commit-flow-fix.spec.ts`.

## Green checks

- `npm run typecheck`: PASS (exit 0)
- `npm run lint`: PASS (exit 0, zero warnings)
- `npm test -- --ci --runInBand`: PASS (28 suites, 115 tests)
- Expo sandbox web export: PASS (15 static routes)
- Playwright full click-through: PASS (1/1)
- `git diff --check`: PASS

## Honest limitations / verifier instructions

This is a builder self-report, not a gate artifact. Per doer≠checker, an independent verifier must re-run and attempt to refute it.

The requested Playwright run is rendered web evidence. It proves the complete click path and state transitions in the built sandbox web app, but it is not the separate macOS+iOS Simulator+Maestro device-truth run required by `docs/DONE-GATE.md`. No iOS workflow run ID is claimed here. The verifier must keep the formal device gate red/pending until both reference-simulator jobs pass on this commit.

The repository's app-local `gates/SPRINT-DOD.md` still says Sprint 1 foundations only while Mission Control and the existing product are in later phases. The founder explicitly authorized this build-10 blocker fix; the stale scope document was not silently rewritten as part of this defect patch.
