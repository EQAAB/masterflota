/**
 * Pure helpers mirroring settlementFeeSql / subcontractor_settlement_totals fee rules.
 * Used in unit tests without a database.
 */

export type Platform = "glovo" | "uber" | "bolt_taxi" | "bolt" | string;

export type PayoutFeeInput = {
  id: string;
  platform: Platform;
  manualDeductions: number;
  manualAdditions: number;
};

export type WeeklyFeeInput = {
  driverId: string;
  deductions: number;
  additions: number;
};

const PLATFORM_ORDER: Record<string, number> = {
  glovo: 1,
  uber: 2,
  bolt_taxi: 3,
  bolt: 4,
};

function platformRank(platform: string): number {
  return PLATFORM_ORDER[platform] ?? 5;
}

export function selectAnchorPayoutId(payouts: PayoutFeeInput[]): string | null {
  if (payouts.length === 0) return null;
  const sorted = [...payouts].sort((a, b) => {
    const r = platformRank(a.platform) - platformRank(b.platform);
    if (r !== 0) return r;
    return a.id.localeCompare(b.id);
  });
  return sorted[0]?.id ?? null;
}

export function rowCustomDeductions(
  payout: PayoutFeeInput,
  anchorPayoutId: string | null,
  weekly: { deductions: number; additions: number },
): { deductions: number; additions: number } {
  const weeklyDed =
    anchorPayoutId === payout.id ? weekly.deductions : 0;
  const weeklyAdd =
    anchorPayoutId === payout.id ? weekly.additions : 0;
  return {
    deductions: payout.manualDeductions + weeklyDed,
    additions: payout.manualAdditions + weeklyAdd,
  };
}

export function sumSettlementCustomFees(
  payouts: PayoutFeeInput[],
  weekly: { deductions: number; additions: number },
): { totalDeductions: number; totalAdditions: number } {
  const anchorId = selectAnchorPayoutId(payouts);
  let totalDeductions = 0;
  let totalAdditions = 0;
  for (const p of payouts) {
    const row = rowCustomDeductions(p, anchorId, weekly);
    totalDeductions += row.deductions;
    totalAdditions += row.additions;
  }
  return { totalDeductions, totalAdditions };
}
