import { describe, expect, it } from "vitest";
import { driverLoanDisplayName, loanStatusBadgeClass } from "./loansReportDisplay";

describe("loansReportDisplay", () => {
  it("formats driver display name", () => {
    expect(driverLoanDisplayName("Ion", "Popescu")).toBe("Ion Popescu");
    expect(driverLoanDisplayName("", "")).toBe("—");
  });

  it("returns status badge classes", () => {
    expect(loanStatusBadgeClass("active")).toContain("sky");
    expect(loanStatusBadgeClass("paid")).toContain("emerald");
    expect(loanStatusBadgeClass("written_off")).toContain("slate");
  });
});
