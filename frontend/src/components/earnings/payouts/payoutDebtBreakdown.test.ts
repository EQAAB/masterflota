import { describe, expect, it } from "vitest";
import type { PayoutDebtAdjustment } from "../../../api/earnings";
import {
  buildDebtAdjustmentLadderSteps,
  debtAdjustmentReductionAmount,
  formatDebtAdjustmentLabel,
  formatListDebtAdjustmentSummary,
  formatListPreviousDebtDeductionLine,
  formatListRemainingDebtLine,
  formatNegativeEarningsDebtDetected,
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
