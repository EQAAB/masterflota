import { describe, expect, it } from "vitest";
import {
  feeAppliesToPayoutPeriod,
  periodContainsFirstOfMonth,
  recurringFeeAppliesToPayoutPeriod,
} from "./driverRecurringFees";
import { computeBaseRawNet } from "./driverPayoutCustomFees";
import { resolveDebtPayoutFromRawNet } from "./debtAllocation";

const weeklyFee = { frequency: "weekly" as const };
const monthlyFirstWeek = { frequency: "monthly_first_week" as const };

describe("periodContainsFirstOfMonth", () => {
  it("true when period includes Jun 1", () => {
    expect(periodContainsFirstOfMonth("2026-06-01", "2026-06-07")).toBe(true);
  });

  it("false for mid-month week without a 1st", () => {
    expect(periodContainsFirstOfMonth("2026-06-08", "2026-06-14")).toBe(false);
  });

  it("true when period spans into July and includes Jul 1", () => {
    expect(periodContainsFirstOfMonth("2026-06-29", "2026-07-05")).toBe(true);
  });
});

describe("feeAppliesToPayoutPeriod (weekly default)", () => {
  const week = { periodStart: "2026-05-11", periodEnd: "2026-05-17" };

  it("applies when active and no date bounds", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: null, end_date: null, ...weeklyFee },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(true);
  });

  it("does not apply when inactive", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: false, start_date: null, end_date: null, ...weeklyFee },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("does not apply when week ends before fee start", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: "2026-05-18", end_date: null, ...weeklyFee },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("does not apply when week starts after fee end", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: null, end_date: "2026-05-10", ...weeklyFee },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(false);
  });

  it("applies when week overlaps fee window", () => {
    expect(
      feeAppliesToPayoutPeriod(
        { is_active: true, start_date: "2026-05-01", end_date: "2026-05-31", ...weeklyFee },
        week.periodStart,
        week.periodEnd,
      ),
    ).toBe(true);
  });
});

describe("monthly_first_week (June 2026, start 2026-06-01)", () => {
  const feeBase = {
    is_active: true,
    start_date: "2026-06-01",
    end_date: null,
    ...monthlyFirstWeek,
  };

  const juneWeeks = [
    { label: "Jun 1–7", start: "2026-06-01", end: "2026-06-07", expectApply: true },
    { label: "Jun 8–14", start: "2026-06-08", end: "2026-06-14", expectApply: false },
    { label: "Jun 15–21", start: "2026-06-15", end: "2026-06-21", expectApply: false },
    { label: "Jun 22–28", start: "2026-06-22", end: "2026-06-28", expectApply: false },
    { label: "Jun 29–Jul 5", start: "2026-06-29", end: "2026-07-05", expectApply: true },
  ] as const;

  it.each(juneWeeks)("$label → $expectApply", ({ start, end, expectApply }) => {
    expect(recurringFeeAppliesToPayoutPeriod(feeBase, start, end)).toBe(expectApply);
  });

  it("weekly still applies to all overlapping June weeks", () => {
    const weekly = { ...feeBase, ...weeklyFee };
    for (const { start, end } of juneWeeks) {
      expect(recurringFeeAppliesToPayoutPeriod(weekly, start, end)).toBe(true);
    }
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
