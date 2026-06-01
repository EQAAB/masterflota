import { describe, expect, it } from "vitest";
import {
  rowCustomDeductions,
  selectAnchorPayoutId,
  sumSettlementCustomFees,
} from "./settlementFeeAggregation";

describe("settlementFeeAggregation", () => {
  it("selects glovo as anchor over uber", () => {
    const anchor = selectAnchorPayoutId([
      { id: "u1", platform: "uber", manualDeductions: 0, manualAdditions: 0 },
      { id: "g1", platform: "glovo", manualDeductions: 0, manualAdditions: 0 },
    ]);
    expect(anchor).toBe("g1");
  });

  it("counts weekly fees only on anchor payout row", () => {
    const payouts = [
      { id: "g1", platform: "glovo", manualDeductions: 10, manualAdditions: 0 },
      { id: "u1", platform: "uber", manualDeductions: 5, manualAdditions: 0 },
    ];
    const weekly = { deductions: 50, additions: 20 };
    const g1 = rowCustomDeductions(payouts[0], "g1", weekly);
    const u1 = rowCustomDeductions(payouts[1], "g1", weekly);
    expect(g1.deductions).toBe(60);
    expect(g1.additions).toBe(20);
    expect(u1.deductions).toBe(5);
    expect(u1.additions).toBe(0);
  });

  it("sums manual on all rows and weekly once", () => {
    const payouts = [
      { id: "g1", platform: "glovo", manualDeductions: 10, manualAdditions: 0 },
      { id: "u1", platform: "uber", manualDeductions: 5, manualAdditions: 0 },
    ];
    const totals = sumSettlementCustomFees(payouts, { deductions: 50, additions: 0 });
    expect(totals.totalDeductions).toBe(65);
  });

  it("does not double-count weekly across platforms", () => {
    const payouts = [
      { id: "g1", platform: "glovo", manualDeductions: 0, manualAdditions: 0 },
      { id: "u1", platform: "uber", manualDeductions: 0, manualAdditions: 0 },
      { id: "b1", platform: "bolt", manualDeductions: 0, manualAdditions: 0 },
    ];
    const totals = sumSettlementCustomFees(payouts, { deductions: 100, additions: 0 });
    expect(totals.totalDeductions).toBe(100);
  });
});
