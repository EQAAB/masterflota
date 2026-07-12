import { describe, expect, it, vi } from "vitest";
import { getOrgLoanById, getOrgLoansSummary } from "./driverLoans";

describe("getOrgLoansSummary", () => {
  it("maps aggregate query rows to rounded summary numbers", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            total_disbursed: "12500.456",
            total_outstanding: "3200.1",
            drivers_with_active_loans: "4",
          },
        ],
      }),
    };

    const summary = await getOrgLoansSummary(client as never, "org-1");

    expect(summary).toEqual({
      totalDisbursed: 12500.46,
      totalOutstanding: 3200.1,
      driversWithActiveLoans: 4,
    });
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining("FROM driver_loans"), [
      "org-1",
    ]);
  });

  it("returns zeros when no loans exist", async () => {
    const client = {
      query: vi.fn().mockResolvedValue({
        rows: [
          {
            total_disbursed: "0",
            total_outstanding: "0",
            drivers_with_active_loans: "0",
          },
        ],
      }),
    };

    const summary = await getOrgLoansSummary(client as never, "org-1");

    expect(summary).toEqual({
      totalDisbursed: 0,
      totalOutstanding: 0,
      driversWithActiveLoans: 0,
    });
  });
});

describe("getOrgLoanById", () => {
  it("returns null when loan is missing", async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [] }),
    };
    const loan = await getOrgLoanById(client as never, "org-1", "loan-1");
    expect(loan).toBeNull();
  });

  it("maps loan and repayments with driver fields", async () => {
    const client = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              id: "loan-1",
              organization_id: "org-1",
              driver_id: "driver-1",
              principal: "1000.5",
              remaining_balance: "500.25",
              status: "active",
              disbursed_at: "2026-01-15T00:00:00.000Z",
              reference: "REF-1",
              notes: null,
              planned_repayment_week: null,
              planned_repayment_note: null,
              created_by: null,
              created_at: "2026-01-15T00:00:00.000Z",
              updated_at: "2026-01-15T00:00:00.000Z",
              driver_first_name: "Ion",
              driver_last_name: "Pop",
              driver_phone: "+40123",
            },
          ],
        })
        .mockResolvedValueOnce({
          rows: [
            {
              id: "rep-1",
              loan_id: "loan-1",
              repayment_type: "cash",
              amount: "100",
              balance_before: "500.25",
              balance_after: "400.25",
              driver_payout_id: null,
              payment_period_start: null,
              payment_period_end: null,
              notes: null,
              created_by: null,
              created_at: "2026-01-20T00:00:00.000Z",
            },
          ],
        }),
    };

    const loan = await getOrgLoanById(client as never, "org-1", "loan-1");

    expect(loan).toMatchObject({
      id: "loan-1",
      driver_id: "driver-1",
      principal: "1000.50",
      remaining_balance: "500.25",
      driver_first_name: "Ion",
      driver_last_name: "Pop",
      driver_phone: "+40123",
    });
    expect(loan?.repayments).toHaveLength(1);
    expect(loan?.repayments[0]?.amount).toBe("100.00");
  });
});
