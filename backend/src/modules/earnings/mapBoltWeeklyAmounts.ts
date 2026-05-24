import { roundMoney } from "./debtAllocation";

export type BoltWeeklyAmountsInput = {
  adjustedEarningsWithVat: number;
  adjustedEarningsWithoutVat: number;
  courierTipsWithVat: number;
  courierTipsWithoutVat: number;
};

export type BoltWeeklyAmountsResult = {
  /** Adjusted earnings (With VAT) → earnings_records.gross_earnings. */
  income: number;
  /** Courier tips (With VAT) → earnings_records.tips. */
  tips: number;
  /** Adjusted (Without VAT) + tips (Without VAT) → earnings_records.net_earnings. */
  net_income: number;
  /** Total gross with VAT (income + tips) for driver_payout snapshots. */
  gross_income: number;
  /** Always 0 — VAT gap is not Taxa aplicatie / platform service fee. */
  platform_fee: number;
};

/** Map Bolt CSV components: manual sum of adjusted earnings + courier tips per VAT tier. */
export function mapBoltWeeklyAmounts(input: BoltWeeklyAmountsInput): BoltWeeklyAmountsResult {
  const income = Number(input.adjustedEarningsWithVat) || 0;
  const tips = Number(input.courierTipsWithVat) || 0;
  const netBase = Number(input.adjustedEarningsWithoutVat) || 0;
  const tipsNet = Number(input.courierTipsWithoutVat) || 0;
  return {
    income: roundMoney(income),
    tips: roundMoney(tips),
    net_income: roundMoney(netBase + tipsNet),
    gross_income: roundMoney(income + tips),
    platform_fee: 0,
  };
}
