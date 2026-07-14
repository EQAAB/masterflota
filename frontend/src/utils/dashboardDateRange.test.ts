import { describe, expect, it } from "vitest";
import { formatDashboardRangeLabel, resolveDashboardDateRange } from "./dashboardDateRange";

describe("resolveDashboardDateRange", () => {
  it("resolves today to a single day", () => {
    const today = new Date(2026, 6, 14); // Tue Jul 14
    expect(resolveDashboardDateRange("today", "2026-01-01", today)).toEqual({
      from: "2026-07-14",
      to: "2026-07-14",
    });
  });

  it("resolves this week as Monday–Sunday", () => {
    const today = new Date(2026, 6, 14); // Tue
    expect(resolveDashboardDateRange("week", "2026-01-01", today)).toEqual({
      from: "2026-07-13",
      to: "2026-07-19",
    });
  });

  it("resolves this month to calendar month bounds", () => {
    const today = new Date(2026, 6, 14);
    expect(resolveDashboardDateRange("month", "2026-01-01", today)).toEqual({
      from: "2026-07-01",
      to: "2026-07-31",
    });
  });

  it("resolves custom to the selected day", () => {
    expect(resolveDashboardDateRange("custom", "2026-03-05")).toEqual({
      from: "2026-03-05",
      to: "2026-03-05",
    });
  });
});

describe("formatDashboardRangeLabel", () => {
  it("formats single-day and multi-day ranges", () => {
    expect(formatDashboardRangeLabel({ from: "2026-07-14", to: "2026-07-14" })).toBe("2026-07-14");
    expect(formatDashboardRangeLabel({ from: "2026-07-01", to: "2026-07-31" })).toBe(
      "2026-07-01 → 2026-07-31",
    );
  });
});
