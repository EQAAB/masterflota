import { describe, expect, it } from "vitest";
import {
  requireEarningsOverview,
  requireImportsView,
  requirePayoutsView,
  requireReportsView,
  requireSubcontractorSettle,
} from "./earningsPermissions";

describe("earnings permission middleware factories", () => {
  it("exports distinct middleware for each earnings domain", () => {
    const all = [
      requireImportsView,
      requirePayoutsView,
      requireEarningsOverview,
      requireReportsView,
      requireSubcontractorSettle,
    ];
    expect(new Set(all).size).toBe(all.length);
    for (const mw of all) {
      expect(typeof mw).toBe("function");
      expect(mw.length).toBe(3);
    }
  });
});
