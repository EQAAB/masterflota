import { describe, expect, it } from "vitest";
import { computeWeekDebtPool, distributeWeekNetToLegs } from "./crossPlatformDebt";

describe("computeWeekDebtPool", () => {
  it("offsets negative platform against positive platforms in same week", () => {
    const pool = computeWeekDebtPool([
      { platform: "uber", rawNet: -500 },
      { platform: "bolt", rawNet: 800 },
      { platform: "glovo", rawNet: 300 },
    ]);
    expect(pool.totalPositiveRaw).toBe(1100);
    expect(pool.totalNegativeRaw).toBe(-500);
    expect(pool.weekRawNet).toBe(600);
    expect(pool.crossPlatformDebtOffset).toBe(500);
    expect(pool.debtPlatforms).toEqual(["uber"]);
  });

  it("handles all-positive week with no offset", () => {
    const pool = computeWeekDebtPool([
      { platform: "bolt", rawNet: 200 },
      { platform: "glovo", rawNet: 100 },
    ]);
    expect(pool.weekRawNet).toBe(300);
    expect(pool.crossPlatformDebtOffset).toBe(0);
    expect(pool.debtPlatforms).toEqual([]);
  });
});

describe("distributeWeekNetToLegs", () => {
  it("assigns zero net to debt platform and splits payable across earners", () => {
    const legs = [
      { payoutId: "u1", platform: "uber", rawNet: -500, existingRemainingDebt: 0, currentPaymentStatus: "pending" },
      { payoutId: "b1", platform: "bolt", rawNet: 800, existingRemainingDebt: 0, currentPaymentStatus: "pending" },
      { payoutId: "g1", platform: "glovo", rawNet: 300, existingRemainingDebt: 0, currentPaymentStatus: "pending" },
    ];
    const pool = computeWeekDebtPool(legs);
    const allocation = distributeWeekNetToLegs(legs, pool, {
      weekFinalNet: 600,
      debtAppliedToOlder: 0,
      newWeekDebtAmount: 0,
      remainingDebtAmount: 0,
      weekPaymentStatus: "pending",
    });

    expect(allocation.get("u1")?.net_driver_payout).toBe(0);
    expect(allocation.get("b1")?.net_driver_payout).toBe(436.36);
    expect(allocation.get("g1")?.net_driver_payout).toBe(163.64);

    const sum = [...allocation.values()].reduce((s, r) => s + r.net_driver_payout, 0);
    expect(sum).toBe(600);
  });

  it("carries negative week net on anchor platform", () => {
    const legs = [
      { payoutId: "u1", platform: "uber", rawNet: -500, existingRemainingDebt: 0, currentPaymentStatus: "pending" },
      { payoutId: "b1", platform: "bolt", rawNet: 300, existingRemainingDebt: 0, currentPaymentStatus: "pending" },
    ];
    const pool = computeWeekDebtPool(legs);
    const allocation = distributeWeekNetToLegs(legs, pool, {
      weekFinalNet: -200,
      debtAppliedToOlder: 0,
      newWeekDebtAmount: 200,
      remainingDebtAmount: 200,
      weekPaymentStatus: "debt",
    });

    expect(allocation.get("u1")?.net_driver_payout).toBe(-200);
    expect(allocation.get("b1")?.net_driver_payout).toBe(0);
  });
});
