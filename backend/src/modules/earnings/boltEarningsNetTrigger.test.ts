import { describe, expect, it } from "vitest";
import { mapBoltWeeklyAmounts } from "./mapBoltWeeklyAmounts";
import { computeCompanyCommissionFromBase } from "./commission";
import { computePayoutBeforeRent } from "./recomputeDriverPayoutRollup";
import {
  shouldSkipEarningsPayoutAfterCashTrigger,
  simulateLegacyTriggerNetEarnings,
} from "./boltEarningsNetTrigger";

describe("shouldSkipEarningsPayoutAfterCashTrigger", () => {
  it("skips bolt and bolt_courier", () => {
    expect(shouldSkipEarningsPayoutAfterCashTrigger("bolt")).toBe(true);
    expect(shouldSkipEarningsPayoutAfterCashTrigger("bolt_courier")).toBe(true);
    expect(shouldSkipEarningsPayoutAfterCashTrigger("glovo")).toBe(false);
  });
});

describe("Bolt net vs legacy trigger (Muhammad Ikram row 34)", () => {
  const adjustedWithout = 2709.08;
  const tipsWithout = 235;
  const adjustedWith = 3277.99;
  const tipsWith = 235;
  const cashReceivedIgnored = 3264.31;
  const overdueDebt = 100;

  it("correct net_income = adjusted without VAT + tips without VAT", () => {
    const bolt = mapBoltWeeklyAmounts({
      adjustedEarningsWithVat: adjustedWith,
      adjustedEarningsWithoutVat: adjustedWithout,
      courierTipsWithVat: tipsWith,
      courierTipsWithoutVat: tipsWithout,
    });
    expect(bolt.net_income).toBe(2944.08);
    expect(bolt.gross_income).toBeCloseTo(3512.99, 2);
  });

  it("legacy trigger wrongly sets net to gross+tips-cash when commission is 0 at row", () => {
    const wrongNet = simulateLegacyTriggerNetEarnings({
      gross_earnings: adjustedWith,
      tips: tipsWith,
      platform_fee: 0,
      company_commission: 0,
      daily_cash: cashReceivedIgnored,
    });
    expect(wrongNet).toBeCloseTo(248.68, 2);
    expect(wrongNet).not.toBe(2944.08);
  });

  it("payout uses overdue debt not cash received from clients", () => {
    const bolt = mapBoltWeeklyAmounts({
      adjustedEarningsWithVat: adjustedWith,
      adjustedEarningsWithoutVat: adjustedWithout,
      courierTipsWithVat: tipsWith,
      courierTipsWithoutVat: tipsWithout,
    });
    const comm = computeCompanyCommissionFromBase(
      { commission_type: "percentage", commission_rate: "10", fixed_commission_amount: null, minimum_commission: null },
      bolt.net_income,
    );
    expect(comm.company_commission).toBeCloseTo(294.41, 2);

    const payoutWithOverdue = computePayoutBeforeRent({
      platformNet: bolt.net_income,
      companyCommission: comm.company_commission,
      cashDeduction: overdueDebt,
      accountOpeningFee: 0,
    });
    expect(payoutWithOverdue).toBeCloseTo(2549.67, 2);

    const payoutIfCashReceived = computePayoutBeforeRent({
      platformNet: bolt.net_income,
      companyCommission: comm.company_commission,
      cashDeduction: cashReceivedIgnored,
      accountOpeningFee: 0,
    });
    expect(payoutIfCashReceived).toBeCloseTo(-614.64, 2);
    expect(payoutWithOverdue).not.toBe(payoutIfCashReceived);
  });
});
