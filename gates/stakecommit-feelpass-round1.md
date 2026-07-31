# 🧾 Gate Artifact — stakecommit feel-pass round 1
- **Phase:** Founder feel-pass remediation · **Date passed:** 2026-07-31 · **Framework version:** Expo 57.0.9

## Criteria → evidence
| Gate criterion | Result | Evidence (rendered PNG — never a bare claim) |
|---|---|---|
| Fix #1 — native brand mark and Bricolage wordmark blend into `#0A0A0A`; no boxed raster wordmark remains | 🟢 | [Splash · default](../evidence/feelpass1/splash-default.png), [splash · 130%](../evidence/feelpass1/splash-font130.png), [trust · default](../evidence/feelpass1/trust-default.png), [trust · 130%](../evidence/feelpass1/trust-font130.png), [receipt · default](../evidence/feelpass1/settle-success-default.png), [receipt · 130%](../evidence/feelpass1/settle-success-font130.png) |
| Fix #2 — every commit action remains visible and tappable at 375×667; Plain Terms scrolls only inside the bounded content region above the fixed footer | 🟢 | [Stake · default](../evidence/feelpass1/commit-01-stake-default.png), [stake · 130%](../evidence/feelpass1/commit-01-stake-font130.png), [charity · default](../evidence/feelpass1/commit-02-charity-default.png), [charity · 130%](../evidence/feelpass1/commit-02-charity-font130.png), [Plain Terms · default](../evidence/feelpass1/commit-03-plain-terms-default.png), [Plain Terms · 130%](../evidence/feelpass1/commit-03-plain-terms-font130.png), [card · default](../evidence/feelpass1/commit-04-card-default.png), [card · 130%](../evidence/feelpass1/commit-04-card-font130.png) |
| Fix #3 — premium pass uses ledger hairlines/rhythm, restrained raised surfaces, tighter hierarchy, and gold only for brand/success/ledger accents | 🟢 | [Catalog · default](../evidence/feelpass1/catalog-default.png), [catalog · 130%](../evidence/feelpass1/catalog-font130.png), [record · default](../evidence/feelpass1/record-default.png), [record · 130%](../evidence/feelpass1/record-font130.png), [forfeit · default](../evidence/feelpass1/settle-forfeit-default.png), [forfeit · 130%](../evidence/feelpass1/settle-forfeit-font130.png) |

## Screen-by-screen rendered gate
| Screen | 375×667 | 375×667 + 130% text | Honest result |
|---|---|---|---|
| Splash | [PNG](../evidence/feelpass1/splash-default.png) | [PNG](../evidence/feelpass1/splash-font130.png) | 🟢 Mark is transparent and unboxed. |
| Trust / onboarding | [PNG](../evidence/feelpass1/trust-default.png) | [PNG](../evidence/feelpass1/trust-font130.png) | 🟢 Logo blends; Browse CTA is fully visible. |
| Catalog | [PNG](../evidence/feelpass1/catalog-default.png) | [PNG](../evidence/feelpass1/catalog-font130.png) | 🟢 Allowlisted list scroll; visible content has no clipping. |
| Template detail | [PNG](../evidence/feelpass1/template-detail-default.png) | [PNG](../evidence/feelpass1/template-detail-font130.png) | 🟢 Set stake CTA is fully visible. |
| Commit 01 — stake | [PNG](../evidence/feelpass1/commit-01-stake-default.png) | [PNG](../evidence/feelpass1/commit-01-stake-font130.png) | 🟢 Choose charity remains in the fixed footer. |
| Commit 02 — charity | [PNG](../evidence/feelpass1/commit-02-charity-default.png) | [PNG](../evidence/feelpass1/commit-02-charity-font130.png) | 🟢 Review CTA remains in the fixed footer. |
| Commit 03 — Plain Terms | [PNG](../evidence/feelpass1/commit-03-plain-terms-default.png) | [PNG](../evidence/feelpass1/commit-03-plain-terms-font130.png) | 🟢 Card-authorization CTA is fully visible; terms overflow is bounded above it. |
| Commit 04 — card | [PNG](../evidence/feelpass1/commit-04-card-default.png) | [PNG](../evidence/feelpass1/commit-04-card-font130.png) | 🟢 Authorization CTA remains visible and tappable. |
| Proof | [PNG](../evidence/feelpass1/proof-default.png) | [PNG](../evidence/feelpass1/proof-font130.png) | 🟢 Take photo CTA is fully visible. |
| Verify | [PNG](../evidence/feelpass1/verify-default.png) | [PNG](../evidence/feelpass1/verify-font130.png) | 🟢 Glass Receipt CTA is fully visible. |
| Settle — success | [PNG](../evidence/feelpass1/settle-success-default.png) | [PNG](../evidence/feelpass1/settle-success-font130.png) | 🟢 Receipt fits and Share receipt is visible. |
| Settle — forfeit | [PNG](../evidence/feelpass1/settle-forfeit-default.png) | [PNG](../evidence/feelpass1/settle-forfeit-font130.png) | 🟢 Receipt fits and Share receipt is visible. |
| Commitment Record | [PNG](../evidence/feelpass1/record-default.png) | [PNG](../evidence/feelpass1/record-font130.png) | 🟢 Allowlisted history scroll; visible actions fit. |
| Settings | [PNG](../evidence/feelpass1/settings-default.png) | [PNG](../evidence/feelpass1/settings-font130.png) | 🟢 Allowlisted settings content fits this state. |

Contact sheets: [default](../evidence/feelpass1/_contact-default.png) · [130% text](../evidence/feelpass1/_contact-font130.png).

## Notes / near-misses
The first render caught the template CTA text one pixel below the 667px boundary and found the large-text settlement fallback crowding the Share action. Both were iterated and recaptured before this gate was marked green. The 130% pass scales the rendered text nodes and rechecks each named primary action’s actual bounding box; the capture script throws instead of writing a green claim when an action crosses the viewport.

Automated verification after the final UI changes: `npm run typecheck`, `npm run lint`, `npm test -- --ci`, and `npx expo export -p web` all exited successfully. The Expo export emitted only the existing non-blocking Sentry configuration and web notifications warnings.

## Overrides applied (per CLAUDE.md — if any)
| Gate overridden | Founder confirmation | Date |
|---|---|---|
| None | — | — |
