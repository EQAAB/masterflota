import { describe, expect, it } from "vitest";
import { filterOpenWeekLegs, isFrozenPayoutStatus } from "./payoutFreeze";

describe("isFrozenPayoutStatus", () => {
  it("treats paid and approved as frozen", () => {
    expect(isFrozenPayoutStatus("paid")).toBe(true);
    expect(isFrozenPayoutStatus("approved")).toBe(true);
  });

  it("does not freeze open statuses", () => {
    expect(isFrozenPayoutStatus("pending")).toBe(false);
    expect(isFrozenPayoutStatus("processing")).toBe(false);
    expect(isFrozenPayoutStatus("debt")).toBe(false);
    expect(isFrozenPayoutStatus("hold")).toBe(false);
  });
});

describe("filterOpenWeekLegs", () => {
  it("excludes frozen legs", () => {
    const legs = [
      { payoutId: "a", currentPaymentStatus: "paid" },
      { payoutId: "b", currentPaymentStatus: "pending" },
      { payoutId: "c", currentPaymentStatus: "approved" },
    ];
    expect(filterOpenWeekLegs(legs)).toEqual([{ payoutId: "b", currentPaymentStatus: "pending" }]);
  });
});
