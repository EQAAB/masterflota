import { describe, expect, it, vi } from "vitest";
import { getOrgLoansSummary } from "./driverLoans";

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
