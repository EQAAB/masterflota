import { describe, expect, it } from "vitest";
import { computeBaseRawNet } from "./driverPayoutCustomFees";
import { resolveDebtPayoutFromRawNet } from "./debtAllocation";

describe("computeBaseRawNet", () => {
  it("matches rollup formula: net - commission - cash - opening - rent", () => {
    const base = computeBaseRawNet({
      total_net_earnings: 1000,
      company_commission: 100,
      total_daily_cash: 50,
      account_opening_fee: 20,
      vehicle_rental_fee: 200,
    });
    expect(base).toBe(630);
  });

  it("uses absolute values for cash and opening fee", () => {
    const base = computeBaseRawNet({
      total_net_earnings: 500,
      company_commission: 50,
      total_daily_cash: -30,
      account_opening_fee: -10,
      vehicle_rental_fee: 100,
    });
    expect(base).toBe(310);
  });
});

describe("custom fees before debt", () => {
  it("deduction lowers raw net used for debt resolution", () => {
    const base = computeBaseRawNet({
      total_net_earnings: 500,
      company_commission: 50,
      total_daily_cash: 0,
      account_opening_fee: 0,
      vehicle_rental_fee: 100,
    });
    expect(base).toBe(350);

    const deductions = 400;
    const adjustedRaw = base - deductions;
    expect(adjustedRaw).toBe(-50);

    const resolution = resolveDebtPayoutFromRawNet({
      rawNet: adjustedRaw,
      existingRemainingDebt: 0,
      currentPaymentStatus: "pending",
      availableAfterCarryForward: 0,
    });
    expect(resolution.net_driver_payout).toBe(-50);
    expect(resolution.payment_status).toBe("debt");
    expect(resolution.debt_amount).toBe(50);
  });

  it("addition raises raw net before debt", () => {
    const base = computeBaseRawNet({
      total_net_earnings: 500,
      company_commission: 50,
      total_daily_cash: 0,
      account_opening_fee: 0,
      vehicle_rental_fee: 100,
    });
    const adjustedRaw = base + 100;
    expect(adjustedRaw).toBe(450);

    const resolution = resolveDebtPayoutFromRawNet({
      rawNet: adjustedRaw,
      existingRemainingDebt: 0,
      currentPaymentStatus: "pending",
      availableAfterCarryForward: adjustedRaw,
    });
    expect(resolution.net_driver_payout).toBe(450);
    expect(resolution.payment_status).toBe("pending");
  });
});
