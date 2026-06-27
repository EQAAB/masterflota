import { describe, expect, it } from "vitest";
import {
  formatListOutstandingLoanLine,
  formatPlannedLoanRepaymentHint,
  shouldShowListLoanContext,
} from "./payoutLoanBreakdown";
import type { ConsolidatedDriverPayout } from "../../../api/earnings";

function row(partial: Partial<ConsolidatedDriverPayout>): ConsolidatedDriverPayout {
  return {
    driver_id: "d1",
    first_name: "A",
    last_name: "B",
    phone: null,
    payment_period_start: "2026-05-19",
    payment_period_end: "2026-05-25",
    total_amount: "100.00",
    total_gross: "0",
    total_fees: "0",
    platforms: [],
    platform_payout_ids: [],
    platform_lines: [],
    consolidated_status: "payable",
    can_pay: true,
    driver_payment_id: null,
    paid_at: null,
    ...partial,
  };
}

describe("payoutLoanBreakdown", () => {
  it("formats outstanding loan line", () => {
    expect(formatListOutstandingLoanLine(500)).toContain("500");
    expect(formatListOutstandingLoanLine(0)).toBe("");
  });

  it("detects loan context", () => {
    expect(shouldShowListLoanContext(row({ outstanding_loan_balance: "100.00" }))).toBe(true);
    expect(shouldShowListLoanContext(row({ outstanding_loan_balance: "0" }))).toBe(false);
  });

  it("shows planned week hint when week matches", () => {
    const hint = formatPlannedLoanRepaymentHint(
      row({
        outstanding_loan_balance: "200",
        planned_repayment_week: "2026-05-19",
        planned_repayment_note: "Driver agreed",
      }),
      "2026-05-19",
    );
    expect(hint).toContain("Driver agreed");
  });
});
