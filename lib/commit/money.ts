export const stakePresets = [2000, 4000, 7500, 15000] as const;
export const MIN_STAKE_CENTS = 500;
export const MAX_STAKE_CENTS = 100000;

export function dollarsToCents(value: string): number | undefined {
  const normalized = value.trim().replace(/[$,\s]/g, '');
  if (!/^\d+(\.\d{0,2})?$/.test(normalized)) return undefined;
  const cents = Math.round(Number(normalized) * 100);
  if (!Number.isSafeInteger(cents) || cents < MIN_STAKE_CENTS || cents > MAX_STAKE_CENTS) return undefined;
  return cents;
}

export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}
