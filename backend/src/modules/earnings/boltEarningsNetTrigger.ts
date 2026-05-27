import { roundMoney } from "./debtAllocation";

/** Platforms where net_earnings is set by import (not the Glovo row trigger). */
export const BOLT_EARNINGS_PLATFORMS = new Set(["bolt", "bolt_courier", "bolt_taxi"]);

export function shouldSkipEarningsPayoutAfterCashTrigger(platform: string): boolean {
  return BOLT_EARNINGS_PLATFORMS.has(platform);
}

/**
 * Legacy trigger math (Glovo path): overwrites net_earnings with row payout.
 * Must NOT run for Bolt — conflates net income with cash deduction.
 */
export function simulateLegacyTriggerNetEarnings(row: {
  gross_earnings: number;
  tips: number;
  platform_fee: number;
  company_commission: number;
  daily_cash: number;
}): number {
  const ni =
    row.platform_fee < 0
      ? row.gross_earnings + row.tips + row.platform_fee
      : row.gross_earnings + row.tips - row.platform_fee;
  return roundMoney(ni - row.company_commission - Math.abs(row.daily_cash));
}
