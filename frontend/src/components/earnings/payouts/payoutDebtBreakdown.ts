import type {
  ConsolidatedDriverPayout,
  DebtAdjustType,
  PayoutDebtAdjustment,
  PriorDebtOrigin,
} from "../../../api/earnings";
import i18n from "../../../i18n";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import type { FeeLadderStepDef } from "./payoutFeeBreakdown";

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function toNum(value: string | null | undefined): number {
  const n = Number(value ?? 0);
  return Number.isFinite(n) ? n : 0;
}

const DEBT_ADJUSTMENT_LABEL_KEYS: Record<DebtAdjustType, string> = {
  forgive: "debtForgiven",
  cash_received: "cashReceived",
  adjust: "manualDebtAdjustment",
  carry_forward: "debtCarryForward",
};

export function formatDebtAdjustmentLabel(type: DebtAdjustType): string {
  const key = DEBT_ADJUSTMENT_LABEL_KEYS[type];
  return key ? i18n.t(`pages.earningsPayouts.detail.${key}`) : type;
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
    parts.push(
      i18n.t("pages.earningsPayouts.detail.remainingRonArrow", {
        prev: round2(toNum(prev)).toFixed(2),
        next: round2(toNum(next)).toFixed(2),
      }),
    );
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
    return [{ kind: "loading", label: i18n.t("pages.earningsPayouts.detail.loadingDebtAdjustments"), amount: 0 }];
  }

  const steps: FeeLadderStepDef[] = [];

  for (const adj of adjustments) {
    if (adj.adjustment_type === "carry_forward") {
      steps.push({
        kind: "neutral",
        label: buildDebtAdjustmentStepLabel(adj, multiPlatform),
        amount: 0,
        hint: formatDebtRemainingHint(adj) ?? i18n.t("pages.earningsPayouts.detail.debtAllocationRecalculated"),
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
      amountLabel = i18n.t("pages.earningsPayouts.detail.recalculatedLabel");
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
  return i18n.t("pages.earningsPayouts.detail.remainingRonLine", { amount: round2(remaining).toFixed(2) });
}

export function formatListDebtAdjustmentSummary(adjustedTotal: number): string | null {
  if (adjustedTotal <= 0.02) return null;
  return i18n.t("pages.earningsPayouts.detail.adjustedThisWeekLine", { amount: round2(adjustedTotal).toFixed(2) });
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
  return i18n.t("pages.earningsPayouts.detail.negativeEarningsDetectedShort", { amount: round2(amount).toFixed(2) });
}

/**
 * Week 2+: this week's earnings paid prior debt.
 * Prefer naming the most recent origin period when known.
 */
export function formatPreviousWeekDebtDeductionLabel(
  amount: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string {
  if (amount <= 0.02) return i18n.t("pages.earningsPayouts.detail.previousWeekDebtDeductedFallback");
  const primary = origins?.[0];
  if (primary) {
    const period = formatShortPeriod(primary.period_start, primary.period_end);
    const extra =
      (origins?.length ?? 0) > 1
        ? i18n.t("pages.earningsPayouts.detail.moreOriginsSuffix", { count: origins!.length - 1 })
        : "";
    return i18n.t("pages.earningsPayouts.detail.previousWeekDebtDeductedWithPeriod", { period, extra });
  }
  return i18n.t("pages.earningsPayouts.detail.previousWeekDebtDeductedFallback");
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
    return i18n.t("pages.earningsPayouts.detail.previousWeekDebtHintWithPeriod", { amount: amt, period, originAmt });
  }
  return i18n.t("pages.earningsPayouts.detail.previousWeekDebtHintNoPeriod", { amount: amt });
}

export function formatListPreviousDebtDeductionLine(
  debtApplied: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string | null {
  if (debtApplied <= 0.02) return null;
  return i18n.t("pages.earningsPayouts.detail.previousDebtDeductionLine", {
    label: formatPreviousWeekDebtDeductionLabel(debtApplied, origins),
    amount: round2(debtApplied).toFixed(2),
  });
}

/** Clearer Week-1 wording for the ladder. */
export function formatNegativeEarningsBecameDebtLabel(amount: number): string {
  return i18n.t("pages.earningsPayouts.detail.negativeEarningsBecameDebtLabel", { amount: round2(amount).toFixed(2) });
}

export function formatNegativeEarningsBecameDebtHint(amount: number): string {
  return i18n.t("pages.earningsPayouts.detail.negativeEarningsBecameDebtHint", { amount: round2(-amount).toFixed(2) });
}

export function formatRemainingDebtAfterDeductionLabel(remaining: number): string {
  if (remaining <= 0.02) return i18n.t("pages.earningsPayouts.detail.previousDebtFullyCleared");
  return i18n.t("pages.earningsPayouts.detail.remainingPreviousDebtAfterWeek");
}

export function formatRemainingDebtAfterDeductionHint(
  remaining: number,
  origins: PriorDebtOrigin[] | null | undefined,
): string {
  if (remaining <= 0.02) {
    return i18n.t("pages.earningsPayouts.detail.noOlderDebtLeft");
  }
  const primary = origins?.[0];
  if (primary) {
    const period = formatShortPeriod(primary.period_start, primary.period_end);
    return i18n.t("pages.earningsPayouts.detail.remainingOwedFromPriorWeeksWithPeriod", {
      amount: round2(remaining).toFixed(2),
      period,
    });
  }
  return i18n.t("pages.earningsPayouts.detail.remainingOwedFromPriorWeeks", { amount: round2(remaining).toFixed(2) });
}

export function formatFinalPayoutDebtLabel(params: {
  isDebtPayout: boolean;
  newPeriodDebt: number;
  finalNet: number;
}): string {
  if (params.newPeriodDebt > 0.02 || (params.isDebtPayout && params.finalNet < -0.02)) {
    return i18n.t("pages.earningsPayouts.detail.noPayoutDebtCarriedShort");
  }
  if (params.isDebtPayout && params.finalNet <= 0.02) {
    return i18n.t("pages.earningsPayouts.detail.noPayoutDebtOutstanding");
  }
  return i18n.t("pages.earningsPayouts.detail.finalNetPayoutPayable");
}

/** Short formula under the final line so the math is obvious. */
export function formatPayoutDebtFormulaHint(params: {
  earningsBeforeDebt: number;
  totalDebtApplied: number;
  newPeriodDebt: number;
  remainingDebt: number;
  finalNet: number;
  origins?: PriorDebtOrigin[] | null;
}): string | undefined {
  const earnings = round2(params.earningsBeforeDebt);
  const applied = round2(params.totalDebtApplied);
  const created = round2(params.newPeriodDebt);
  const finalNet = round2(params.finalNet);

  if (created > 0.02) {
    return i18n.t("pages.earningsPayouts.detail.negativeEarningsDebtCreatedFormula", {
      amount: (-created).toFixed(2),
    });
  }
  if (applied > 0.02) {
    const before = round2(finalNet + applied);
    const primary = params.origins?.[0];
    const period = primary
      ? i18n.t("pages.earningsPayouts.detail.formulaFromPeriod", {
          period: formatShortPeriod(primary.period_start, primary.period_end),
        })
      : "";
    const rem =
      params.remainingDebt > 0.02
        ? i18n.t("pages.earningsPayouts.detail.formulaRemainingDebt", { amount: round2(params.remainingDebt).toFixed(2) })
        : i18n.t("pages.earningsPayouts.detail.formulaPreviousDebtCleared");
    return i18n.t("pages.earningsPayouts.detail.payoutFormulaWithDebt", {
      before: before.toFixed(2),
      applied: applied.toFixed(2),
      period,
      final: finalNet.toFixed(2),
      remaining: rem,
    });
  }
  if (Math.abs(earnings) > 0.02 && Math.abs(earnings - finalNet) <= 0.05) {
    return undefined;
  }
  return undefined;
}

export type DebtStoryLadderStep = {
  kind: "neutral" | "deduction" | "positive" | "total" | "final" | "final-debt";
  prefix?: "-" | "=" | "";
  label: string;
  amount: number;
  hint?: string;
};

/**
 * Debt story rows for the final-payout ladder (after fees/rent).
 * Week 1: negative earnings → debt created.
 * Week 2+: previous week debt deducted + remaining.
 */
export function buildDebtStoryLadderSteps(params: {
  newPeriodDebt: number;
  totalDebtApplied: number;
  remainingDebt: number;
  priorOrigins?: PriorDebtOrigin[] | null;
}): DebtStoryLadderStep[] {
  const steps: DebtStoryLadderStep[] = [];
  const { newPeriodDebt, totalDebtApplied, remainingDebt, priorOrigins } = params;

  if (newPeriodDebt > 0.02) {
    steps.push({
      kind: "deduction",
      prefix: "-",
      label: formatNegativeEarningsBecameDebtLabel(newPeriodDebt),
      amount: -newPeriodDebt,
      hint: formatNegativeEarningsBecameDebtHint(newPeriodDebt),
    });
    steps.push({
      kind: "neutral",
      label: i18n.t("pages.earningsPayouts.detail.payableThisWeekBeforeCarry"),
      amount: 0,
      hint: i18n.t("pages.earningsPayouts.detail.noCashPayoutNegativeHint"),
    });
    return steps;
  }

  if (totalDebtApplied > 0.02) {
    steps.push({
      kind: "deduction",
      prefix: "-",
      label: formatPreviousWeekDebtDeductionLabel(totalDebtApplied, priorOrigins),
      amount: -totalDebtApplied,
      hint: formatPreviousWeekDebtDeductionHint(totalDebtApplied, priorOrigins),
    });
    steps.push({
      kind: "neutral",
      label: formatRemainingDebtAfterDeductionLabel(remainingDebt),
      amount: remainingDebt > 0.02 ? remainingDebt : 0,
      hint: formatRemainingDebtAfterDeductionHint(remainingDebt, priorOrigins),
    });
  }

  return steps;
}
