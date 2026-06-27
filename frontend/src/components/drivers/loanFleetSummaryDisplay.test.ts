import { describe, expect, it } from "vitest";
import {
  formatLoanFleetSummaryText,
  shouldShowLoanFleetSummary,
} from "./loanFleetSummaryDisplay";

describe("loanFleetSummaryDisplay", () => {
  it("shows summary when disbursed or outstanding is positive", () => {
    expect(
      shouldShowLoanFleetSummary({
        totalDisbursed: 100,
        totalOutstanding: 0,
        driversWithActiveLoans: 0,
      }),
    ).toBe(true);
    expect(
      shouldShowLoanFleetSummary({
        totalDisbursed: 0,
        totalOutstanding: 0,
        driversWithActiveLoans: 0,
      }),
    ).toBe(false);
  });

  it("formats disbursed and outstanding totals", () => {
    expect(
      formatLoanFleetSummaryText({
        totalDisbursed: 12500,
        totalOutstanding: 3200,
        driversWithActiveLoans: 4,
      }),
    ).toBe("12,500.00 RON disbursed · 3,200.00 RON outstanding across 4 drivers");
  });

  it("formats disbursed only when outstanding is zero", () => {
    expect(
      formatLoanFleetSummaryText({
        totalDisbursed: 5000,
        totalOutstanding: 0,
        driversWithActiveLoans: 0,
      }),
    ).toBe("5,000.00 RON disbursed");
  });
});
