import {
  calculatePayout,
  type CommissionBaseType,
} from "./calculatePayout";
import type { DriverCommissionRow } from "./commission";
import { roundMoney } from "./debtAllocation";

export type UberTaxiAmountsInput = {
  /** CSV Câștigurile tale column (before resolution). */
  castigurileTale: number | null;
  receivedTotal: number | null;
  platformFee: number | null;
  dailyCash: number | null;
  tips: number | null;
  gross: number | null;
  driver: DriverCommissionRow;
  commission_base_type?: CommissionBaseType;
};

export type UberTaxiAmountsResult = {
  gross: number | null;
  net: number;
  platform_fee: number | null;
  gross_income: number;
  net_income: number;
  commission_base: number;
  commission_rate: number;
  company_commission: number;
  driver_payout: number;
  commission_type: string;
};

function num(v: number | null | undefined): number {
  return v ?? 0;
}

/**
 * Uber platform net (same payout formula as Glovo/Bolt; only extraction differs).
 * - Câștigurile tale > 0 → normal week
 * - else Câștiguri primite < 0 → debt week (negative net)
 */
export function resolveUberPlatformNet(
  castigurileTale: number | null,
  castiguriPrimite: number | null,
): number {
  const tale = num(castigurileTale);
  if (tale > 0) return roundMoney(tale);
  if (castiguriPrimite != null && castiguriPrimite < 0) return roundMoney(castiguriPrimite);
  if (tale < 0) return roundMoney(tale);
  return 0;
}

/** Preview/debt signal: resolved platform net is negative. */
export function isUberDebtPreviewRow(
  castigurileTale: number | null,
  receivedTotal: number | null,
): boolean {
  return resolveUberPlatformNet(castigurileTale, receivedTotal) < 0;
}

export function mapUberTaxiAmounts(input: UberTaxiAmountsInput): UberTaxiAmountsResult {
  let received = input.receivedTotal != null ? roundMoney(input.receivedTotal) : null;
  const castigurileTale = input.castigurileTale != null ? roundMoney(input.castigurileTale) : null;
  if (received == null && (castigurileTale ?? 0) <= 0 && input.platformFee != null && input.platformFee < 0) {
    received = roundMoney(input.platformFee);
  }

  const platformNet = resolveUberPlatformNet(castigurileTale, received);
  const signedFee = input.platformFee != null ? roundMoney(input.platformFee) : null;
  const tips = num(input.tips);

  let g = input.gross;
  if (g == null && signedFee != null) {
    g = roundMoney(platformNet - signedFee);
  } else if (g == null && platformNet !== 0) {
    g = platformNet;
  }

  const taxaForCalc = signedFee != null ? Math.abs(signedFee) : null;
  const calc = calculatePayout({
    income: g,
    tips,
    taxa_aplicatie: taxaForCalc,
    plata_zilnica_cash: input.dailyCash,
    transferTotal: null,
    resolvedPlatformNet: platformNet,
    driver: input.driver,
    commission_base_type: input.commission_base_type,
  });

  return {
    gross: g,
    net: platformNet,
    platform_fee: signedFee,
    gross_income: calc.gross_income,
    net_income: platformNet,
    commission_base: calc.commission_base,
    commission_rate: calc.commission_rate,
    company_commission: calc.company_commission,
    driver_payout: calc.driver_payout,
    commission_type: calc.commission_type,
  };
}
