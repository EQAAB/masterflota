import { describe, expect, it } from "vitest";
import { computeCompanyCommissionFromBase, type DriverCommissionRow } from "./commission";
import { computeWeekDebtPool } from "./crossPlatformDebt";
import { roundMoney } from "./debtAllocation";
import { shouldChargeVehicleRentOnPlatform } from "./payoutRentEntries";
import {
  aggregateEarningsPeriodTotals,
  computePayoutBeforeRent,
  computeRawNetAmountForDebt,
} from "./recomputeDriverPayoutRollup";
import { payoutPlatformFromEarnings } from "./payoutPlatform";

const driverPct10: DriverCommissionRow = {
  commission_type: "percentage",
  commission_rate: "10",
  fixed_commission_amount: null,
  minimum_commission: null,
};

describe("aggregateEarningsPeriodTotals", () => {
  it("sums platform net for rows passed in (single-platform scope)", () => {
    const totals = aggregateEarningsPeriodTotals([
      { gross_earnings: "400", tips: "0", platform_fee: "40", daily_cash: "0", account_opening_fee: null, net_earnings: "360" },
    ]);
    expect(totals.platformNet).toBe(360);
  });
});

describe("per-platform weekly commission", () => {
  it("applies driver rate on each platform net separately", () => {
    const glovo = aggregateEarningsPeriodTotals([
      { gross_earnings: "400", tips: "0", platform_fee: "40", daily_cash: "0", account_opening_fee: null, net_earnings: "360" },
    ]);
    const bolt = aggregateEarningsPeriodTotals([
      { gross_earnings: "880", tips: "20", platform_fee: "80", daily_cash: "5", account_opening_fee: null, net_earnings: "800" },
    ]);

    const glovoNet = roundMoney(glovo.platformNet);
    const boltNet = roundMoney(bolt.platformNet);
    const glovoComm = computeCompanyCommissionFromBase(driverPct10, glovoNet).company_commission;
    const boltComm = computeCompanyCommissionFromBase(driverPct10, boltNet).company_commission;
    const combinedNet = roundMoney(glovoNet + boltNet);
    const combinedComm = computeCompanyCommissionFromBase(driverPct10, combinedNet).company_commission;

    expect(glovoComm).toBe(36);
    expect(boltComm).toBe(80);
    expect(roundMoney(glovoComm + boltComm)).toBe(combinedComm);
    expect(combinedComm).toBe(116);

    const glovoPayout = roundMoney(glovoNet - glovoComm - Math.abs(glovo.dailyCash));
    const boltPayout = roundMoney(boltNet - boltComm - Math.abs(bolt.dailyCash));
    expect(glovoPayout).toBe(324);
    expect(boltPayout).toBe(715);
  });

  it("maps bolt_courier earnings to payout platform bolt", () => {
    expect(payoutPlatformFromEarnings("bolt_courier")).toBe("bolt");
    expect(payoutPlatformFromEarnings("glovo")).toBe("glovo");
    expect(payoutPlatformFromEarnings("uber")).toBe("uber");
  });

  it("sums account opening only from glovo-shaped row aggregates", () => {
    const totals = aggregateEarningsPeriodTotals([
      {
        gross_earnings: "100",
        tips: "0",
        platform_fee: "10",
        daily_cash: "0",
        account_opening_fee: "25",
        net_earnings: "90",
      },
    ]);
    expect(totals.accountOpening).toBe(25);
  });
});

describe("payout before rent and debt raw_net", () => {
  it("negative when net minus commission minus cash exceeds net (Bolt high cash)", () => {
    const platformNet = 800;
    const commission = computeCompanyCommissionFromBase(driverPct10, platformNet).company_commission;
    expect(commission).toBe(80);
    const payout = computePayoutBeforeRent({
      platformNet,
      companyCommission: commission,
      cashDeduction: 900,
      accountOpeningFee: 0,
    });
    expect(payout).toBe(-180);
    const rawNet = computeRawNetAmountForDebt({ payoutBeforeRent: payout, vehicleRent: 0 });
    expect(rawNet).toBe(-180);
    expect(Math.abs(rawNet)).toBe(180);
  });

  it("positive payout when cash and commission are within net", () => {
    const payout = computePayoutBeforeRent({
      platformNet: 800,
      companyCommission: 80,
      cashDeduction: 5,
      accountOpeningFee: 0,
    });
    expect(payout).toBe(715);
  });
});

describe("fees on bolt and uber payout platforms", () => {
  it("bolt rollup forces account opening and platform fees to zero", () => {
    const boltOnlySum = aggregateEarningsPeriodTotals([
      {
        gross_earnings: "880",
        tips: "20",
        platform_fee: "80",
        daily_cash: "5",
        account_opening_fee: "99",
        net_earnings: "800",
      },
    ]);
    expect(boltOnlySum.accountOpening).toBe(99);
    expect(boltOnlySum.feeAbs).toBe(80);
    const payoutPlatform = payoutPlatformFromEarnings("bolt_courier");
    let accountOpening = Math.abs(boltOnlySum.accountOpening);
    let feeAbs = boltOnlySum.feeAbs;
    if (payoutPlatform === "bolt") {
      accountOpening = 0;
      feeAbs = 0;
    }
    expect(accountOpening).toBe(0);
    expect(feeAbs).toBe(0);
  });

  it("uber rollup zeroes account opening but keeps platform fee sum for reporting", () => {
    const uberSum = aggregateEarningsPeriodTotals([
      {
        gross_earnings: "120",
        tips: "0",
        platform_fee: "20",
        daily_cash: "15",
        account_opening_fee: "10",
        net_earnings: "100",
      },
    ]);
    const payoutPlatform = payoutPlatformFromEarnings("uber");
    let accountOpening = Math.abs(uberSum.accountOpening);
    let feeAbs = uberSum.feeAbs;
    if (payoutPlatform === "bolt") {
      accountOpening = 0;
      feeAbs = 0;
    } else if (payoutPlatform === "uber") {
      accountOpening = 0;
      feeAbs = roundMoney(uberSum.feeAbs);
    }
    expect(accountOpening).toBe(0);
    expect(feeAbs).toBe(20);
    expect(uberSum.dailyCash).toBe(15);
  });
});

describe("uber debt payout week", () => {
  const driverPct12: DriverCommissionRow = {
    commission_type: "percentage",
    commission_rate: "12",
    fixed_commission_amount: null,
    minimum_commission: null,
  };

  it("uses universal formula on negative platform net sum", () => {
    const totals = aggregateEarningsPeriodTotals([
      {
        gross_earnings: "-1448.48",
        tips: "0",
        platform_fee: "0",
        daily_cash: "0",
        account_opening_fee: null,
        net_earnings: "-1448.48",
      },
    ]);
    const platformNet = roundMoney(totals.platformNet);
    expect(platformNet).toBe(-1448.48);
    const comm = computeCompanyCommissionFromBase(driverPct12, platformNet, {
      allowNegativeBase: true,
    });
    expect(comm.company_commission).toBeCloseTo(-173.82, 2);
    const payout = computePayoutBeforeRent({
      platformNet,
      companyCommission: comm.company_commission,
      cashDeduction: 0,
      accountOpeningFee: 0,
    });
    expect(payout).toBeCloseTo(-1274.66, 2);
    expect(computeRawNetAmountForDebt({ payoutBeforeRent: payout, vehicleRent: 0 })).toBeCloseTo(
      -1274.66,
      2,
    );
  });
});

describe("multi-platform vehicle rent once (uber + bolt)", () => {
  it("does not double-count rent when pooling raw nets", () => {
    const platforms = ["uber", "bolt_taxi"];
    const rent = 550;
    const tax = 250;

    const uberOps = 237.94;
    const boltOps = 1191.61;

    const uberGetsRent = shouldChargeVehicleRentOnPlatform("uber", platforms);
    const boltGetsRent = shouldChargeVehicleRentOnPlatform("bolt_taxi", platforms);
    expect(uberGetsRent).toBe(true);
    expect(boltGetsRent).toBe(false);

    /** Rent + recurring tax both land on Uber (fee anchor). */
    const uberRaw = roundMoney(uberOps - tax - (uberGetsRent ? rent : 0));
    const boltRaw = roundMoney(boltOps - (boltGetsRent ? rent : 0));
    expect(uberRaw).toBeCloseTo(-562.06, 2);
    expect(boltRaw).toBeCloseTo(1191.61, 2);

    const pool = computeWeekDebtPool([
      { platform: "uber", rawNet: uberRaw },
      { platform: "bolt_taxi", rawNet: boltRaw },
    ]);
    expect(pool.weekRawNet).toBeCloseTo(629.55, 2);

    /** Bug regression: rent on both legs understates week net by rent amount. */
    const buggyUberRaw = roundMoney(uberOps - tax - rent);
    const buggyBoltRaw = roundMoney(boltOps - rent);
    const buggyPool = computeWeekDebtPool([
      { platform: "uber", rawNet: buggyUberRaw },
      { platform: "bolt_taxi", rawNet: buggyBoltRaw },
    ]);
    expect(buggyPool.weekRawNet).toBeCloseTo(79.55, 2);
    expect(buggyPool.weekRawNet).toBeCloseTo(pool.weekRawNet - rent, 2);
  });
});
