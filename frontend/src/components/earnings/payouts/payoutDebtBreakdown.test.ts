import { describe, expect, it } from "vitest";
import type { PayoutDebtAdjustment } from "../../../api/earnings";
import {
  buildDebtAdjustmentLadderSteps,
  debtAdjustmentReductionAmount,
  formatDebtAdjustmentLabel,
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
