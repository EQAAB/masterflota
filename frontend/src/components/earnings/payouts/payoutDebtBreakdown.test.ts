import { describe, expect, it } from "vitest";
import type { PayoutDebtAdjustment } from "../../../api/earnings";
import {
  buildDebtAdjustmentLadderSteps,
  buildDebtStoryLadderSteps,
  debtAdjustmentReductionAmount,
  formatDebtAdjustmentLabel,
  formatFinalPayoutDebtLabel,
  formatListDebtAdjustmentSummary,
  formatListPreviousDebtDeductionLine,
  formatListRemainingDebtLine,
  formatNegativeEarningsDebtDetected,
  formatPayoutDebtFormulaHint,
  formatPreviousWeekDebtDeductionLabel,
  shouldShowListDebtContext,
} from "./payoutDebtBreakdown";

function adj(partial: Partial<PayoutDebtAdjustment> & Pick<PayoutDebtAdjustment, "id" | "adjustment_type">): PayoutDebtAdjustment {
  return {
    payout_id: "p1",
    amount: "0",
    reason: null,
    created_at: "",
    previous_remaining_debt: null,
    new_remaining_debt: null,
    applied_amount: null,
    ...partial,
  };
}

describe("formatDebtAdjustmentLabel", () => {
  it("maps known types", () => {
    expect(formatDebtAdjustmentLabel("forgive")).toBe("Debt forgiven");
    expect(formatDebtAdjustmentLabel("cash_received")).toBe("Cash received");
  });
});

describe("debtAdjustmentReductionAmount", () => {
  it("uses applied_amount when present", () => {
    expect(
      debtAdjustmentReductionAmount(
        adj({ id: "1", adjustment_type: "forgive", applied_amount: "150" }),
      ),
    ).toBe(150);
  });

  it("derives from previous and new remaining", () => {
    expect(
      debtAdjustmentReductionAmount(
        adj({
          id: "2",
          adjustment_type: "adjust",
          previous_remaining_debt: "500",
          new_remaining_debt: "300",
        }),
      ),
    ).toBe(200);
  });
});

describe("buildDebtAdjustmentLadderSteps", () => {
  it("builds positive step for forgive", () => {
    const steps = buildDebtAdjustmentLadderSteps(
      [
        adj({
          id: "1",
          adjustment_type: "forgive",
          applied_amount: "100",
          previous_remaining_debt: "100",
          new_remaining_debt: "0",
        }),
      ],
      false,
    );
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ kind: "positive", label: "Debt forgiven", amount: 100 });
  });

  it("adds platform suffix when multi-platform", () => {
    const steps = buildDebtAdjustmentLadderSteps(
      [
        adj({
          id: "1",
          adjustment_type: "cash_received",
          applied_amount: "50",
          platform: "uber",
        }),
      ],
      true,
    );
    expect(steps[0]?.label).toContain("Uber");
  });
});

describe("list debt summary helpers", () => {
  it("shows context for debt status or negative net", () => {
    expect(
      shouldShowListDebtContext({
        consolidated_status: "payable",
        total_amount: "-50",
        remaining_debt: "0",
        week_debt_adjusted_total: "0",
      }),
    ).toBe(true);
    expect(
      shouldShowListDebtContext({
        consolidated_status: "payable",
        total_amount: "100",
        remaining_debt: "0",
        week_debt_adjusted_total: "0",
      }),
    ).toBe(false);
    expect(
      shouldShowListDebtContext({
        consolidated_status: "payable",
        total_amount: "100",
        remaining_debt: "0",
        week_debt_adjusted_total: "0",
        debt_applied_total: "40",
      }),
    ).toBe(true);
    expect(
      shouldShowListDebtContext({
        consolidated_status: "payable",
        total_amount: "100",
        remaining_debt: "0",
        week_debt_adjusted_total: "0",
        negative_earnings_debt: "80",
      }),
    ).toBe(true);
  });

  it("formats remaining and adjustment lines", () => {
    expect(formatListRemainingDebtLine(150)).toBe("Remaining: 150.00 RON");
    expect(formatListDebtAdjustmentSummary(200)).toBe("Adjusted −200.00 RON this week");
    expect(formatListDebtAdjustmentSummary(0)).toBeNull();
  });

  it("formats negative earnings and previous-week debt deduction", () => {
    expect(formatNegativeEarningsDebtDetected(443.91)).toBe(
      "Negative earnings detected — debt 443.91 RON",
    );
    expect(formatNegativeEarningsDebtDetected(0)).toBeNull();

    expect(
      formatPreviousWeekDebtDeductionLabel(100, [
        {
          period_start: "2026-07-27",
          period_end: "2026-08-02",
          original_debt: "443.91",
          remaining_debt: "0",
        },
      ]),
    ).toContain("Previous week debt deducted");
    expect(
      formatPreviousWeekDebtDeductionLabel(100, [
        {
          period_start: "2026-07-27",
          period_end: "2026-08-02",
          original_debt: "443.91",
          remaining_debt: "0",
        },
      ]),
    ).toMatch(/27 Jul|Jul 27/);

    expect(
      formatListPreviousDebtDeductionLine(100, [
        {
          period_start: "2026-07-27",
          period_end: "2026-08-02",
          original_debt: "443.91",
          remaining_debt: "0",
        },
      ]),
    ).toContain("−100.00 RON");
  });
});

describe("debt story ladder helpers", () => {
  const week1Origin = {
    period_start: "2026-07-27",
    period_end: "2026-08-02",
    original_debt: "400",
    remaining_debt: "0",
  };

  it("labels negative week as no payout with debt carry", () => {
    expect(
      formatFinalPayoutDebtLabel({
        isDebtPayout: true,
        newPeriodDebt: 400,
        finalNet: -400,
      }),
    ).toBe("No payout — debt carried to next week");
  });

  it("labels positive week after debt as payable", () => {
    expect(
      formatFinalPayoutDebtLabel({
        isDebtPayout: false,
        newPeriodDebt: 0,
        finalNet: 800,
      }),
    ).toBe("Final net payout (payable)");
  });

  it("builds Week-1 story: negative earnings became debt", () => {
    const steps = buildDebtStoryLadderSteps({
      newPeriodDebt: 400,
      totalDebtApplied: 0,
      remainingDebt: 400,
    });
    expect(steps).toHaveLength(2);
    expect(steps[0]?.label).toContain("negative earnings became debt");
    expect(steps[0]?.amount).toBe(-400);
    expect(steps[1]?.label).toContain("Payable this week");
    expect(steps[1]?.amount).toBe(0);
  });

  it("builds Week-2 story: previous debt deducted + remaining info", () => {
    const steps = buildDebtStoryLadderSteps({
      newPeriodDebt: 0,
      totalDebtApplied: 400,
      remainingDebt: 0,
      priorOrigins: [week1Origin],
    });
    expect(steps).toHaveLength(2);
    expect(steps[0]?.kind).toBe("deduction");
    expect(steps[0]?.label).toContain("Previous week debt deducted");
    expect(steps[0]?.amount).toBe(-400);
    expect(steps[1]?.kind).toBe("neutral");
    expect(steps[1]?.label).toMatch(/fully cleared|Remaining previous debt/i);
  });

  it("formats formula hint for previous-debt deduction", () => {
    const hint = formatPayoutDebtFormulaHint({
      earningsBeforeDebt: 1200,
      totalDebtApplied: 400,
      newPeriodDebt: 0,
      remainingDebt: 0,
      finalNet: 800,
      origins: [week1Origin],
    });
    expect(hint).toContain("1200.00");
    expect(hint).toContain("400.00");
    expect(hint).toContain("800.00");
    expect(hint).toMatch(/previous debt/i);
  });

  it("formats formula hint for newly created debt", () => {
    const hint = formatPayoutDebtFormulaHint({
      earningsBeforeDebt: -400,
      totalDebtApplied: 0,
      newPeriodDebt: 400,
      remainingDebt: 400,
      finalNet: -400,
    });
    expect(hint).toMatch(/debt created/i);
    expect(hint).toContain("0.00");
  });
});
