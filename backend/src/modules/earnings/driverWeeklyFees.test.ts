import { describe, expect, it } from "vitest";
import {
  computeAdjustedRawNetWithFees,
  computeBaseRawNet,
} from "./driverPayoutCustomFees";
import {
  pickWeeklyFeeAnchorPlatform,
  sumWeeklyFeeRows,
  WEEKLY_FEE_ANCHOR_PLATFORMS,
} from "./driverWeeklyFees";
import { resolveDebtPayoutFromRawNet } from "./debtAllocation";

describe("pickWeeklyFeeAnchorPlatform", () => {
  it("prefers glovo over bolt and uber", () => {
    expect(pickWeeklyFeeAnchorPlatform(["bolt", "glovo", "uber"])).toBe("glovo");
  });

  it("prefers uber when glovo absent", () => {
    expect(pickWeeklyFeeAnchorPlatform(["bolt", "uber"])).toBe("uber");
  });

  it("prefers bolt_taxi over bolt", () => {
    expect(pickWeeklyFeeAnchorPlatform(["bolt", "bolt_taxi"])).toBe("bolt_taxi");
  });

  it("falls back to first platform when none match anchor list", () => {
    expect(pickWeeklyFeeAnchorPlatform(["wolt"])).toBe("wolt");
  });

  it("returns null for empty list", () => {
    expect(pickWeeklyFeeAnchorPlatform([])).toBeNull();
  });

  it("anchor order matches documented priority", () => {
    expect(WEEKLY_FEE_ANCHOR_PLATFORMS).toEqual(["glovo", "uber", "bolt_taxi", "bolt"]);
  });
});

describe("sumWeeklyFeeRows", () => {
  it("sums deductions and additions once per row", () => {
    const totals = sumWeeklyFeeRows([
      { fee_type: "deduction", amount: "50" },
      { fee_type: "deduction", amount: "25" },
      { fee_type: "addition", amount: "10" },
    ]);
    expect(totals).toEqual({ deductions: 75, additions: 10 });
  });
});

describe("import order: former anchor must clear weekly fees", () => {
  it("when Glovo is imported after Bolt was anchor, Bolt raw net drops recurring deduction", () => {
    const weekly = { deductions: 50, additions: 0 };
    const manual = { deductions: 0, additions: 0 };
    const boltBase = 450;

    const boltAsFormerAnchor = computeAdjustedRawNetWithFees(boltBase, manual, weekly, true);
    expect(boltAsFormerAnchor).toBe(400);

    const boltAfterGlovoAnchor = computeAdjustedRawNetWithFees(boltBase, manual, weekly, false);
    expect(boltAfterGlovoAnchor).toBe(450);

    const glovoBase = 900;
    const glovoAsAnchor = computeAdjustedRawNetWithFees(glovoBase, manual, weekly, true);
    expect(glovoAsAnchor).toBe(850);
  });
});

describe("multi-platform weekly fee applied once (anchor only)", () => {
  const baseInputs = {
    total_net_earnings: 1000,
    company_commission: 100,
    total_daily_cash: 0,
    account_opening_fee: 0,
    vehicle_rental_fee: 0,
  };

  it("deducts €50 weekly fee once on Glovo anchor; Bolt raw net unchanged by recurring", () => {
    const glovoBase = computeBaseRawNet(baseInputs);
    const boltBase = computeBaseRawNet({ ...baseInputs, total_net_earnings: 500, company_commission: 50 });
    expect(glovoBase).toBe(900);
    expect(boltBase).toBe(450);

    const weekly = { deductions: 50, additions: 0 };
    const manual = { deductions: 0, additions: 0 };

    const glovoAdjusted = computeAdjustedRawNetWithFees(glovoBase, manual, weekly, true);
    const boltAdjusted = computeAdjustedRawNetWithFees(boltBase, manual, weekly, false);

    expect(glovoAdjusted).toBe(850);
    expect(boltAdjusted).toBe(450);

    const combinedNet =
      resolveDebtPayoutFromRawNet({
        rawNet: glovoAdjusted,
        existingRemainingDebt: 0,
        currentPaymentStatus: "pending",
        availableAfterCarryForward: glovoAdjusted,
      }).net_driver_payout +
      resolveDebtPayoutFromRawNet({
        rawNet: boltAdjusted,
        existingRemainingDebt: 0,
        currentPaymentStatus: "pending",
        availableAfterCarryForward: boltAdjusted,
      }).net_driver_payout;

    expect(combinedNet).toBe(1300);
  });

  it("deducts €50 weekly fee once on Uber anchor when Glovo absent", () => {
    expect(pickWeeklyFeeAnchorPlatform(["bolt", "uber"])).toBe("uber");

    const uberBase = computeBaseRawNet(baseInputs);
    const boltBase = computeBaseRawNet({ ...baseInputs, total_net_earnings: 800, company_commission: 80 });
    const weekly = { deductions: 50, additions: 0 };
    const manual = { deductions: 0, additions: 0 };

    const uberAdjusted = computeAdjustedRawNetWithFees(uberBase, manual, weekly, true);
    const boltAdjusted = computeAdjustedRawNetWithFees(boltBase, manual, weekly, false);

    expect(uberAdjusted).toBe(850);
    expect(boltAdjusted).toBe(720);
  });

  it("manual fee on Bolt row deducts from Bolt only", () => {
    const boltBase = computeBaseRawNet({ ...baseInputs, total_net_earnings: 800, company_commission: 80 });
    const weekly = { deductions: 50, additions: 0 };
    const manualOnBolt = { deductions: 30, additions: 0 };

    const boltAdjusted = computeAdjustedRawNetWithFees(boltBase, manualOnBolt, weekly, false);
    expect(boltAdjusted).toBe(690);
  });
});

describe("settlement-style recurring fee count", () => {
  it("counts weekly recurring once per driver/week not per platform row", () => {
    const weeklyRows = [{ fee_type: "deduction" as const, amount: "50" }];
    const weeklyTotals = sumWeeklyFeeRows(weeklyRows);

    const platformCount = 3;
    let settlementDeductions = 0;
    for (let i = 0; i < platformCount; i += 1) {
      const isAnchor = i === 0;
      if (isAnchor) settlementDeductions += weeklyTotals.deductions;
    }

    expect(settlementDeductions).toBe(50);
    expect(settlementDeductions).not.toBe(50 * platformCount);
  });
});
