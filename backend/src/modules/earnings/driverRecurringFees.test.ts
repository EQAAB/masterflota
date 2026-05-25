import { describe, expect, it } from "vitest";
import { feeAppliesToPayoutPeriod } from "./driverRecurringFees";
import { computeBaseRawNet } from "./driverPayoutCustomFees";
import { resolveDebtPayoutFromRawNet } from "./debtAllocation";

describe("feeAppliesToPayoutPeriod", () => {
  const week = { periodStart: "2026-05-11", periodEnd: "2026-05-17" };

  it("applies when active and no date bounds", () => {
    expect(
      feeAppliesToPayoutPeriod({ is_active: true, start_date: null, end_date: null }, week.periodStart, week.periodEnd),
    ).toBe(true);
  });

  it("does not apply when inactive", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: false, start_date: null, end_date: null },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("does not apply when week ends before fee start", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: "2026-05-18", end_date: null },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("does not apply when week starts after fee end", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: null, end_date: "2026-05-10" },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("applies when week overlaps fee window", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: "2026-05-01", end_date: "2026-05-31" },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(true);
  });
});

describe("recurring + manual combined raw net", () => {
  it("base minus recurring and manual deductions flows to debt", () => {
    const base = computeBaseRawNet({
      total_net_earnings: 1000,
      company_commission: 100,
      total_daily_cash: 0,
      account_opening_fee: 0,
      vehicle_rental_fee: 200,
    });
    expect(base).toBe(700);
    const recurringDeduction = 400;
    const manualDeduction = 50;
    const adjustedRaw = base - recurringDeduction - manualDeduction;
    expect(adjustedRaw).toBe(250);

    const resolution = resolveDebtPayoutFromRawNet({
      rawNet: adjustedRaw,
      existingRemainingDebt: 0,
      currentPaymentStatus: "pending",
      availableAfterCarryForward: adjustedRaw,
    });
    expect(resolution.net_driver_payout).toBe(250);
  });
});
