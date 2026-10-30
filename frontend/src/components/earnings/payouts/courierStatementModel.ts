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

function deductionAmount(value: number): number {
  const abs = Math.abs(value);
  return abs <= EPS ? 0 : -round2(abs);
}

function lineKind(amount: number): StatementLineKind {
  return amount < -EPS ? "deduction" : "income";
}

function pushLine(lines: StatementLine[], line: StatementLine, always = false) {
  if (!always && Math.abs(line.amount) <= EPS) return;
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

  const netIncome = Math.abs(breakdown.totalNetIncome) <= EPS ? 0 : round2(breakdown.totalNetIncome);
  pushLine(lines, {
    key: "net-income",
    label: i18n.t("pages.earningsPayouts.statement.netIncome"),
    amount: netIncome,
    kind: lineKind(netIncome),
  }, true);
  const fleetCommission = deductionAmount(breakdown.totalFleetSub);
  pushLine(lines, {
    key: "fleet-commission",
    label: i18n.t("pages.earningsPayouts.statement.fleetCommission"),
    amount: fleetCommission,
    kind: lineKind(fleetCommission),
  }, true);
  const cash = deductionAmount(breakdown.totalCashBalance);
  pushLine(lines, {
    key: "cash",
    label: i18n.t("pages.earningsPayouts.statement.cashBalance"),
    amount: cash,
    kind: lineKind(cash),
  }, true);

  const openingFee = deductionAmount(breakdown.platforms.reduce((s, p) => s + p.accountOpeningFee, 0));
  const taxLabel = i18n.t("pages.earningsPayouts.statement.tax").trim().toLowerCase();
  const feeNamedTax = (weekFeeBreakdown?.items ?? []).some((fee) => {
    const name = fee.feeName.trim().toLowerCase();
    return Math.abs(fee.signedAmount) > EPS && (name === taxLabel || name === "tax" || name === "taxa" || name === "taxă");
  });
  if (!(feeNamedTax && Math.abs(openingFee) <= EPS)) {
    pushLine(lines, {
      key: "tax",
      label: i18n.t("pages.earningsPayouts.statement.tax"),
      amount: openingFee,
      kind: lineKind(openingFee),
    }, true);
  }

  for (const fee of weekFeeBreakdown?.items ?? []) {
    pushLine(lines, {
      key: fee.id,
      label: fee.feeName,
      amount: fee.signedAmount,
      kind: lineKind(fee.signedAmount),
    });
  }

  const vehicleRent = deductionAmount(breakdown.customFeeVehicleRent);
  pushLine(lines, {
    key: "vehicle-rent",
    label: i18n.t("pages.earningsPayouts.statement.vehicleRent"),
    amount: vehicleRent,
    kind: lineKind(vehicleRent),
  }, true);
  const debtApplied = deductionAmount(breakdown.totalDebtApplied);
  pushLine(lines, {
    key: "debt-applied",
    label: i18n.t("pages.earningsPayouts.statement.debtApplied"),
    amount: debtApplied,
    kind: lineKind(debtApplied),
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
      kind: lineKind(-amount),
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
