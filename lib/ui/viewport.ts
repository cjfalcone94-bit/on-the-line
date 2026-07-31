/**
 * Auditable vertical budgets for the fixed (non-scroll) Phase-7 flows.
 *
 * Measurements are conservative rendered-height allocations at the locked
 * 1.35 Dynamic Type ceiling, using the compact styles selected at <=700pt.
 * The 40pt reserve covers the iPhone SE's top and bottom safe-area insets.
 * Each part includes its own line wrapping and adjacent gap allocation.
 */
export const referenceViewport = {
  height: 667,
  safeAreaReserve: 40,
  width: 375,
} as const;

export const viewportBudgets = {
  trust: { chrome: 90, header: 74, onboarding: 22, facts: 216, disclosure: 72, actions: 132 },
  templateDetail: { chrome: 44, header: 102, cadence: 64, checklist: 306, action: 60 },
  commitStake: { chrome: 44, header: 102, choices: 126, input: 60, note: 46, action: 60 },
  commitCharity: { chrome: 44, header: 116, choices: 174, pagination: 44, action: 60 },
  commitDisclosure: { chrome: 44, header: 92, ledger: 358, disclosure: 54, action: 60 },
  commitCard: { chrome: 44, header: 116, ledger: 178, state: 82, action: 60 },
  commitConfirmed: { chrome: 44, header: 116, ledger: 164, disclosure: 112, action: 60 },
  proofCapture: { chrome: 44, header: 108, checklist: 166, capture: 170, actions: 120 },
  proofPreview: { chrome: 44, header: 108, checklist: 166, preview: 190, action: 60 },
  verify: { chrome: 44, header: 108, card: 282, appeal: 60, action: 60 },
  settle: { chrome: 44, receipt: 505, action: 60 },
} as const;

export function totalBudget(parts: Record<string, number>) {
  return Object.values(parts).reduce((total, part) => total + part, 0);
}

export const availableContentHeight =
  referenceViewport.height - referenceViewport.safeAreaReserve;
