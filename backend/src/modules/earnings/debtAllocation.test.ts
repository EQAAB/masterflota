import { describe, expect, it } from "vitest";
import {
  nextRemainingForNegativePayoutRow,
  resolveDebtPayoutFromRawNet,
  resolvePaymentStatusAfterDebtAllocation,
} from "./debtAllocation";

describe("nextRemainingForNegativePayoutRow", () => {
  it("returns 0 for hold with zero remaining (forgiven)", () => {
    expect(
      nextRemainingForNegativePayoutRow({ debtAmount: 100, existingRem: 0, paymentStatus: "hold" }),
    ).toBe(0);
  });

  it("uses full period debt when existing remaining is zero and not hold-forgiven", () => {
    expect(
      nextRemainingForNegativePayoutRow({ debtAmount: 100, existingRem: 0, paymentStatus: "debt" }),
    ).toBe(100);
  });

  it("preserves partial forgiveness (remaining below period debt)", () => {
    expect(
      nextRemainingForNegativePayoutRow({ debtAmount: 100, existingRem: 50, paymentStatus: "debt" }),
    ).toBe(50);
  });

  it("preserves manually increased remaining above period shortfall", () => {
    expect(
      nextRemainingForNegativePayoutRow({ debtAmount: 100, existingRem: 120, paymentStatus: "debt" }),
    ).toBe(120);
  });

  it("clamps partial remaining to period debt when below cap", () => {
    expect(nextRemainingForNegativePayoutRow({ debtAmount: 100, existingRem: 33.33, paymentStatus: "debt" })).toBe(
      33.33,
    );
  });
});

describe("resolveDebtPayoutFromRawNet", () => {
  it("zero net with overdue only: signed payout and debt status (Bolt clamp fix)", () => {
    const r = resolveDebtPayoutFromRawNet({
      rawNet: -443.91,
      existingRemainingDebt: 0,
      currentPaymentStatus: "pending",
      availableAfterCarryForward: 0,
    });
    expect(r.net_driver_payout).toBe(-443.91);
    expect(r.debt_amount).toBe(443.91);
    expect(r.remaining_debt_amount).toBe(443.91);
    expect(r.payment_status).toBe("debt");
  });

  it("positive raw net after carry-forward to older debt", () => {
    const r = resolveDebtPayoutFromRawNet({
      rawNet: 100,
      existingRemainingDebt: 0,
      currentPaymentStatus: "pending",
      availableAfterCarryForward: 70,
    });
    expect(r.net_driver_payout).toBe(70);
    expect(r.debt_amount).toBe(0);
    expect(r.remaining_debt_amount).toBe(0);
    expect(r.payment_status).toBe("pending");
  });

  it("forgiven hold keeps hold status when remaining is zero", () => {
    const r = resolveDebtPayoutFromRawNet({
      rawNet: -100,
      existingRemainingDebt: 0,
      currentPaymentStatus: "hold",
      availableAfterCarryForward: 0,
    });
    expect(r.net_driver_payout).toBe(-100);
    expect(r.remaining_debt_amount).toBe(0);
    expect(r.payment_status).toBe("hold");
  });
});

describe("resolvePaymentStatusAfterDebtAllocation", () => {
  it("marks debt when raw net is negative", () => {
    expect(
      resolvePaymentStatusAfterDebtAllocation({
        rawNet: -443.91,
        remainingDebtAmount: 443.91,
        currentPaymentStatus: "pending",
      }),
    ).toBe("debt");
  });
});
