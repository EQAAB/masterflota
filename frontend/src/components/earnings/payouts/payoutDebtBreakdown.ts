import type {
  ConsolidatedDriverPayout,
  DebtAdjustType,
  PayoutDebtAdjustment,
  PriorDebtOrigin,
} from "../../../api/earnings";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import type { FeeLadderStepDef } from "./payoutFeeBreakdown";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const DEBT_ADJUSTMENT_LABELS: Record<DebtAdjustType, string> = {
  forgive: "Debt forgiven",
  cash_received: "Cash received",
  adjust: "Manual debt adjustment",
  carry_forward: "Debt carry forward",
};

export function formatDebtAdjustmentLabel(type: DebtAdjustType): string {
  return DEBT_ADJUSTMENT_LABELS[type] ?? type;
}

/** Positive = debt reduced (good for driver). */
export function debtAdjustmentReductionAmount(adj: PayoutDebtAdjustment): number {
  const applied = toNum(adj.applied_amount);
  if (applied > 0.02) return round2(applied);

  const prev = toNum(adj.previous_remaining_debt);
  const next = toNum(adj.new_remaining_debt);
  if (adj.previous_remaining_debt != null && adj.new_remaining_debt != null) {
    return round2(Math.max(0, prev - next));
  }

  const delta = toNum(adj.amount);
  if (delta < -0.02) return round2(Math.abs(delta));
  if (delta > 0.02) return 0;
  return 0;
}

export function formatDebtRemainingHint(adj: PayoutDebtAdjustment): string | undefined {
  const parts: string[] = [];
  const prev = adj.previous_remaining_debt;
  const next = adj.new_remaining_debt;
  if (prev != null && next != null) {
    parts.push(`Remaining ${round2(toNum(prev)).toFixed(2)} → ${round2(toNum(next)).toFixed(2)} RON`);
  }
  if (adj.reason?.trim()) parts.push(adj.reason.trim());
  return parts.length > 0 ? parts.join(" · ") : undefined;
}

export function buildDebtAdjustmentStepLabel(
  adj: PayoutDebtAdjustment,
  multiPlatform: boolean,
): string {
  const base = formatDebtAdjustmentLabel(adj.adjustment_type);
  if (multiPlatform && adj.platform) {
    return `${base} (${earningsPlatformLabel(adj.platform)})`;
  }
  return base;
}

export function buildDebtAdjustmentLadderSteps(
  adjustments: PayoutDebtAdjustment[],
  multiPlatform: boolean,
  options: { isLoading?: boolean } = {},
): FeeLadderStepDef[] {
  if (options.isLoading) {
    return [{ kind: "loading", label: "Loading debt adjustments…", amount: 0 }];
  }

  const steps: FeeLadderStepDef[] = [];

  for (const adj of adjustments) {
    if (adj.adjustment_type === "carry_forward") {
      steps.push({
        kind: "neutral",
        label: buildDebtAdjustmentStepLabel(adj, multiPlatform),
        amount: 0,
        hint: formatDebtRemainingHint(adj) ?? "Debt allocation recalculated for this driver",
      });
      continue;
    }

    const reduction = debtAdjustmentReductionAmount(adj);
    const increase = round2(toNum(adj.new_remaining_debt) - toNum(adj.previous_remaining_debt));
    const isIncrease =
      adj.adjustment_type === "adjust" && increase > 0.02 && reduction <= 0.02;

    if (isIncrease) {
      steps.push({
        kind: "deduction",
        prefix: "-",
        label: buildDebtAdjustmentStepLabel(adj, multiPlatform),
        amount: increase,
        hint: formatDebtRemainingHint(adj),
      });
      continue;
    }

    if (reduction <= 0.02 && adj.adjustment_type === "adjust") {
      const delta = toNum(adj.amount);
      if (Math.abs(delta) <= 0.02) continue;
    }

    if (reduction <= 0.02) continue;

    steps.push({
      kind: "positive",
      prefix: "",
      label: buildDebtAdjustmentStepLabel(adj, multiPlatform),
      amount: reduction,
      hint: formatDebtRemainingHint(adj),
    });
  }

  return steps;
}

export type DebtAdjustmentCardLine = {
  id: string;
  label: string;
  amountLabel: string;
  hint?: string;
};

export function buildDebtAdjustmentCardLines(
  adjustments: PayoutDebtAdjustment[],
  multiPlatform: boolean,
): DebtAdjustmentCardLine[] {
  return adjustments.map((adj) => {
    const reduction = debtAdjustmentReductionAmount(adj);
    const increase = round2(toNum(adj.new_remaining_debt) - toNum(adj.previous_remaining_debt));
    let amountLabel = "—";
    if (adj.adjustment_type === "carry_forward") {
      amountLabel = "Recalculated";
    } else if (reduction > 0.02) {
      amountLabel = `−${reduction.toFixed(2)} RON`;
    } else if (increase > 0.02) {
      amountLabel = `+${increase.toFixed(2)} RON owed`;
    } else if (Math.abs(toNum(adj.amount)) > 0.02) {
      amountLabel = `${toNum(adj.amount).toFixed(2)} RON`;
    }

    return {
      id: adj.id,
      label: buildDebtAdjustmentStepLabel(adj, multiPlatform),
      amountLabel,
      hint: formatDebtRemainingHint(adj),
    };
  });
}

export function shouldShowListDebtContext(
  row: Pick<
    ConsolidatedDriverPayout,
    | "consolidated_status"
    | "total_amount"
    | "remaining_debt"
    | "week_debt_adjusted_total"
    | "debt_applied_total"
    | "negative_earnings_debt"
  >,
): boolean {
  const total = toNum(row.total_amount);
  const remaining = toNum(row.remaining_debt);
  const adjusted = toNum(row.week_debt_adjusted_total);
  const debtApplied = toNum(row.debt_applied_total);
  const negativeDebt = toNum(row.negative_earnings_debt);
  const status = row.consolidated_status;
  return (
    status === "debt" ||
    status === "hold" ||
    total < -0.02 ||
    remaining > 0.02 ||
    adjusted > 0.02 ||
    debtApplied > 0.02 ||
    negativeDebt > 0.02
  );
}

export function formatListRemainingDebtLine(remaining: number): string {
  return `Remaining: ${round2(remaining).toFixed(2)} RON`;
}

export function formatListDebtAdjustmentSummary(adjustedTotal: number): string | null {
  if (adjustedTotal <= 0.02) return null;
  return `Adjusted −${round2(adjustedTotal).toFixed(2)} RON this week`;
}

function formatShortPeriod(startIso: string, endIso: string): string {
  const fmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const start = new Date(`${startIso.slice(0, 10)}T12:00:00`);
  const end = new Date(`${endIso.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return `${startIso.slice(0, 10)} – ${endIso.slice(0, 10)}`;
  }
  return `${fmt.format(start)} – ${fmt.format(end)}`;
}

/** Week 1: negative earnings became debt. */
export function formatNegativeEarningsDebtDetected(amount: number): string | null {
  if (amount <= 0.02) return null;
  return `Negative earnings detected — debt ${round2(amount).toFixed(2)} RON`;
}

/**
 * Week 2+: this week's earnings paid prior debt.
 * Prefer naming the most recent origin period when known.
 */
export function formatPreviousWeekDebtDeductionLabel(
  amount: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string {
  if (amount <= 0.02) return "Previous week debt deducted";
  const primary = origins?.[0];
  if (primary) {
    const period = formatShortPeriod(primary.period_start, primary.period_end);
    const extra = (origins?.length ?? 0) > 1 ? ` (+${(origins!.length - 1)} more)` : "";
    return `Previous week debt deducted (${period}${extra})`;
  }
  return "Previous week debt deducted";
}

export function formatPreviousWeekDebtDeductionHint(
  amount: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string {
  const amt = round2(amount).toFixed(2);
  const primary = origins?.[0];
  if (primary) {
    const period = formatShortPeriod(primary.period_start, primary.period_end);
    const originAmt = round2(toNum(primary.original_debt)).toFixed(2);
    return `−${amt} RON from this week's earnings paid debt from ${period} (origin ${originAmt} RON negative earnings)`;
  }
  return `−${amt} RON from this week's earnings paid toward older negative-earnings debt`;
}

export function formatListPreviousDebtDeductionLine(
  debtApplied: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string | null {
  if (debtApplied <= 0.02) return null;
  return `${formatPreviousWeekDebtDeductionLabel(debtApplied, origins)} −${round2(debtApplied).toFixed(2)} RON`;
}
