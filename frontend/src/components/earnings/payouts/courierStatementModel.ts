import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";
import type { WeekLoanRepayment } from "../../../api/driverLoans";
import i18n from "../../../i18n";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import type { UnifiedPayoutBreakdown } from "./payoutBreakdownUtils";
import type { WeekFeeBreakdown } from "./payoutFeeBreakdown";

const EPS = 0.02;

export type StatementLineKind = "income" | "deduction";

export type StatementLine = {
  key: string;
  label: string;
  /** Signed amount (deductions are negative). */
  amount: number;
  kind: StatementLineKind;
};

export type StatementPlatformBlock = {
  platform: string;
  label: string;
  netIncome: number;
};

export type CourierStatementModel = {
  lines: StatementLine[];
  platforms: StatementPlatformBlock[];
  multiPlatform: boolean;
  courierIds: string[];
  finalNet: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function pushLine(lines: StatementLine[], line: StatementLine) {
  if (Math.abs(line.amount) <= EPS) return;
  lines.push(line);
}

export function buildCourierStatementModel(params: {
  breakdown: UnifiedPayoutBreakdown;
  payoutItems: PayoutListItem[];
  weekFeeBreakdown?: WeekFeeBreakdown;
  loanRepayments?: WeekLoanRepayment[];
}): CourierStatementModel {
  const { breakdown, payoutItems, weekFeeBreakdown, loanRepayments = [] } = params;
  const lines: StatementLine[] = [];

  pushLine(lines, {
    key: "net-income",
    label: i18n.t("pages.earningsPayouts.statement.netIncome"),
    amount: breakdown.totalNetIncome,
    kind: breakdown.totalNetIncome < 0 ? "deduction" : "income",
  });
  pushLine(lines, {
    key: "fleet-commission",
    label: i18n.t("pages.earningsPayouts.statement.fleetCommission"),
    amount: -Math.abs(breakdown.totalFleetSub),
    kind: "deduction",
  });
  pushLine(lines, {
    key: "cash",
    label: i18n.t("pages.earningsPayouts.statement.cashBalance"),
    amount: -Math.abs(breakdown.totalCashBalance),
    kind: "deduction",
  });

  const openingFee = round2(breakdown.platforms.reduce((s, p) => s + p.accountOpeningFee, 0));
  pushLine(lines, {
    key: "opening-fee",
    label: i18n.t("pages.earningsPayouts.statement.accountOpeningFee"),
    amount: -Math.abs(openingFee),
    kind: "deduction",
  });

  for (const fee of weekFeeBreakdown?.items ?? []) {
    pushLine(lines, {
      key: fee.id,
      label: fee.feeName,
      amount: fee.signedAmount,
      kind: fee.signedAmount < 0 ? "deduction" : "income",
    });
  }

  pushLine(lines, {
    key: "vehicle-rent",
    label: i18n.t("pages.earningsPayouts.statement.vehicleRent"),
    amount: -Math.abs(breakdown.customFeeVehicleRent),
    kind: "deduction",
  });
  pushLine(lines, {
    key: "debt-applied",
    label: i18n.t("pages.earningsPayouts.statement.debtApplied"),
    amount: -Math.abs(breakdown.totalDebtApplied),
    kind: "deduction",
  });

  for (const repayment of loanRepayments) {
    const amount = round2(Math.abs(Number(repayment.amount) || 0));
    const label = repayment.loan_reference?.trim()
      ? i18n.t("pages.earningsPayouts.statement.loanRepaymentNamed", { name: repayment.loan_reference.trim() })
      : i18n.t("pages.earningsPayouts.statement.loanRepayment");
    pushLine(lines, {
      key: `loan-${repayment.id}`,
      label,
      amount: -amount,
      kind: "deduction",
    });
  }

  const shown = round2(lines.reduce((sum, line) => sum + line.amount, 0));
  const gap = round2(breakdown.finalNet - shown);
  if (Math.abs(gap) > EPS) {
    lines.push({
      key: "other",
      label: i18n.t("pages.earningsPayouts.statement.otherAdjustments"),
      amount: gap,
      kind: gap < 0 ? "deduction" : "income",
    });
  }

  const platforms: StatementPlatformBlock[] = breakdown.platforms.map((p) => ({
    platform: p.platform,
    label: earningsPlatformLabel(p.platform),
    netIncome: p.netIncome,
  }));

  const courierIds = [
    ...new Set(payoutItems.map((p) => p.platform_id?.trim()).filter((id): id is string => Boolean(id))),
  ];

  return {
    lines,
    platforms,
    multiPlatform: platforms.length > 1,
    courierIds,
    finalNet: breakdown.finalNet,
  };
}

export function statementPlatformSummary(
  row: ConsolidatedDriverPayout,
  platforms: StatementPlatformBlock[],
): string {
  if (platforms.length === 0) {
    return row.platforms.map((p) => earningsPlatformLabel(p)).join(", ") || "—";
  }
  if (platforms.length === 1) return platforms[0]!.label;
  return i18n.t("pages.earningsPayouts.statement.allPlatforms");
}
