# 🧾 Gate Artifact — stakecommit feel-pass: alive
_The standard evidence format for every /gates/ file. This artifact proves code coverage of the felt-interaction layer; sensation remains a founder-device check._

- **Phase:** 9.5 — Founder Feel Pass remediation · **Date passed:** 2026-08-01 · **Framework version:** current workspace

## Criteria → evidence
| Gate criterion (verbatim from the remediation brief) | Result | Evidence (link/output/score — never a bare claim) |
|---|---|---|
| One shared pressable fires preference-gated haptics and runs a 0.97 scale + opacity settle spring on every press | 🟢 | `components/ui.tsx:17-50`; default light cue at `:19,30`; 0.97/0.88 at `:23-26`; stiffness 220/damping 26 token passed to `withSpring` at `:31-37`. `__tests__/interactive-pressable.test.tsx` asserts haptic plus both spring directions. |
| Route every interactive element through it; no bare touchable without feedback | 🟢 | Source inventory: **33/33 concrete JSX touch targets feedback-wrapped** = 13 `InteractivePressable` + 8 `PrimaryButton` + 12 `TextAction`; all latter components delegate to `InteractivePressable`. **0** raw `<Pressable>` and **0** `Touchable*` concrete sites in `app/`, `screens/`, `components/`. The sole native Pressable is wrapped by Reanimated as the shared primitive (`components/ui.tsx:17`). Dynamic maps (stake tiers, six charities, catalog cards, record rows) expand those source sites to the diagnosed ~59 runtime instances, all through the same primitive. Intentionally excluded: `TextInput` (keyboard input, not a press target) and `RefreshControl` (native pull gesture). |
| Implement every §5 haptic event explicitly | 🟢 | Complete event table below. All SDK calls are centralized in `lib/feedback.ts:7-12`, where the shared sound/haptic preference is checked first. |
| Screen content arrives with §4 duration/easing and stated direction | 🟢 | `ScreenEntrance` uses 250 ms standard ease-out and 18 px stated-direction travel (`components/ui.tsx:53-79`); wired across trust, catalog, template, commit, proof, verify, settle, record, settings (callsite grep shown below). Router push transitions remain `slide_from_right` in `app/_layout.tsx`. |
| Glass Receipt reveals each line sequentially at 400 ms with settle spring, ending in outcome haptic | 🟢 | **Not instant/static:** timers mount one additional line at `app/settle/[commitmentId].tsx:65-69` using `motion.duration.emphasized` (400 ms); each mounted row springs from left at `components/glass-receipt.tsx:33-48`; final outcome cue is after line 5 settles at `app/settle/[commitmentId].tsx:70-72`. |
| Catalog and record list/section content staggers; reduced motion reduces rather than removes feedback | 🟢 | Catalog cards: `screens/CatalogScreen.tsx:77-80`; record rows: `app/record.tsx:49`; 45 ms item offsets. `ScreenEntrance` reduces travel 18→4 px and duration 250→150 ms (`components/ui.tsx:61-77`). Receipt keeps sequencing at 150 ms per line under reduced motion (`app/settle/[commitmentId].tsx:65`). Press haptics and spring feedback remain active. |
| Typecheck, lint, and Jest remain green | 🟢 | `docs/FEELPASS-TYPECHECK.txt`: tsc exit 0. `docs/FEELPASS-LINT.txt`: Expo lint exit 0, zero findings. `docs/FEELPASS-JEST.txt`: **26/26 suites, 114/114 tests**, exit 0. |

## Touchable → feedback coverage evidence

Command scope: `app components screens`, `*.tsx`, excluding generated `dist-web` and dependencies.

| Inventory | Count | Coverage |
|---|---:|---:|
| Concrete `InteractivePressable` sites | 13 | 13/13 |
| `PrimaryButton` sites (delegates to shared primitive) | 8 | 8/8 |
| `TextAction` sites (delegates to shared primitive) | 12 | 12/12 |
| Total concrete press-feedback sites | **33** | **33/33 (100%)** |
| Bare `<Pressable>` concrete sites | 0 | — |
| Bare `TouchableOpacity/Highlight/WithoutFeedback` sites | 0 | — |

The earlier “59 touchable sites” diagnosis counts rendered/map-expanded controls. Source-level verification is the reproducible measure: every factory for those runtime controls is one of the 33 covered sites above.

## §5 haptic event → callsite

| §5 event | Cue | Explicit callsite |
|---|---|---|
| Commitment created / card authorized | soft success acknowledgment | `app/commit/[templateId].tsx:86` → `fireHaptic('success')`; authorize button suppresses the preliminary generic cue at `:195` |
| Glass Receipt — success final line settles | soft double / Success | `app/settle/[commitmentId].tsx:70-72` selects `success` after final settle |
| Glass Receipt — forfeit final line settles | single low / Rigid | `app/settle/[commitmentId].tsx:70-72` selects `rigid` after final settle |
| Toggle/selection — stake tier | selection / Light | `components/commit.tsx:24` (`Choice haptic="selection"`), instantiated by stake choices |
| Toggle/selection — charity pick | selection / Light | `components/commit.tsx:24`, instantiated by charity choices at `app/commit/[templateId].tsx:142` |
| Sound/haptic setting and receipt sound toggle | selection | `app/settings.tsx:32`; `app/settle/[commitmentId].tsx:111` |
| SLA-miss auto-pass | soft single | `components/verification.tsx:11-15` |
| Error / blocked | Warning | Commit blocked/failure `app/commit/[templateId].tsx:60-63,95-100`; receipt load/share `app/settle/[commitmentId].tsx:43-46,82-95`; proof permission/queue/upload failures `app/proof/[commitmentId].tsx`; verification load/appeal failures `app/verify/[submissionId].tsx`; record/catalog load failures `app/record.tsx:25-29`, `screens/CatalogScreen.tsx` |
| Generic press feedback added by founder remediation | Light | `components/ui.tsx:19,30` → centralized `lib/feedback.ts:12` |

## §4 motion rule → implementation

| Rule | Implementation |
|---|---|
| fast 150 / standard 250 / emphasized 400 | Locked tokens consumed in `components/ui.tsx:65-68`, `app/settle/[commitmentId].tsx:65-72` |
| settle spring 220/26 | Presses `components/ui.tsx:31-37`; receipt rows `components/glass-receipt.tsx:33-41` |
| standard ease-out navigation/content | Router `app/_layout.tsx`; content `components/ui.tsx:65-68` |
| nothing pops; content has a direction | Shared entrances `components/ui.tsx:53-79`; all nine routes/screens use it |
| ledger lines arrive from left and settle | `components/glass-receipt.tsx:44-48`; record rows `app/record.tsx:49` |
| catalog/record stagger | `screens/CatalogScreen.tsx:77-80`; `app/record.tsx:49` |
| receipt dedicated full-screen choreography | `app/settle/[commitmentId].tsx:98-130`; no modal |

## Captured verification output

```text
npm run typecheck: exit 0
npm run lint: exit 0 (zero warnings/errors)
npm test -- --ci --runInBand: exit 0
Test Suites: 26 passed, 26 total
Tests:       114 passed, 114 total
```

## Notes / near-misses
This gate proves **code coverage**, timing, routing, and cue selection. Actual haptic strength and whether the complete interaction feels “alive” can only be validated on the founder’s physical device; that sensation is not claimed by automated evidence. The locked Design Direction source is currently held at `/workspace/ledger/concepts/stakecommit/docs/DESIGN-DIRECTION.md` rather than the app repo’s stated `docs/DESIGN-DIRECTION.md`; implementation was checked against §§1, 4, 5, and 10 of that locked source.

Generated `dist-web/` and `notify-1785545421-39ea.json` were pre-existing untracked files and were not changed or committed.

## Overrides applied (per CLAUDE.md — if any)
| Gate overridden | Founder confirmation | Date |
|---|---|---|
| None | — | — |
