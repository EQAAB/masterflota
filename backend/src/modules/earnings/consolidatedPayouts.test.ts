import { describe, expect, it } from "vitest";
import { buildConsolidatedPayoutSearchClause, deriveConsolidatedStatus } from "./consolidatedPayouts";

describe("deriveConsolidatedStatus", () => {
  it("marks negative total as debt", () => {
    expect(deriveConsolidatedStatus(-10, ["pending", "pending"])).toEqual({
      consolidated_status: "debt",
      can_pay: false,
    });
  });

  it("marks negative total with zero remaining and hold leg as hold", () => {
    expect(deriveConsolidatedStatus(-10, ["hold"], 0)).toEqual({
      consolidated_status: "hold",
      can_pay: false,
    });
  });

  it("marks negative total with remaining debt as debt even when hold leg exists", () => {
    expect(deriveConsolidatedStatus(-10, ["hold", "debt"], 50)).toEqual({
      consolidated_status: "debt",
      can_pay: false,
    });
  });

  it("marks negative total with zero remaining and pending legs as debt", () => {
    expect(deriveConsolidatedStatus(-10, ["pending", "pending"], 0)).toEqual({
      consolidated_status: "debt",
      can_pay: false,
    });
  });

  it("marks negative total with zero remaining but debt leg as debt", () => {
    expect(deriveConsolidatedStatus(-10, ["debt"], 0)).toEqual({
      consolidated_status: "debt",
      can_pay: false,
    });
  });

  it("marks all paid as paid", () => {
    expect(deriveConsolidatedStatus(500, ["paid", "paid"])).toEqual({
      consolidated_status: "paid",
      can_pay: false,
    });
  });

  it("allows pay when all pending and total positive", () => {
    expect(deriveConsolidatedStatus(300, ["pending", "pending"])).toEqual({
      consolidated_status: "payable",
      can_pay: true,
    });
  });

  it("blocks pay when any hold", () => {
    expect(deriveConsolidatedStatus(200, ["pending", "hold"])).toEqual({
      consolidated_status: "hold",
      can_pay: false,
    });
  });
});

describe("buildConsolidatedPayoutSearchClause", () => {
  it("prefixes search with AND for valid WHERE composition", () => {
    const clause = buildConsolidatedPayoutSearchClause("rahmat", 4);
    expect(clause).not.toBeNull();
    expect(clause!.sql.startsWith("AND (")).toBe(true);
    expect(clause!.param).toBe("%rahmat%");
  });

  it("returns null for blank search", () => {
    expect(buildConsolidatedPayoutSearchClause("  ", 4)).toBeNull();
  });

  it("matches payout and driver platform identifiers", () => {
    const clause = buildConsolidatedPayoutSearchClause("BOLT-12345", 5);
    expect(clause).not.toBeNull();
    expect(clause!.sql).toContain("dp.platform_id ILIKE $5");
    expect(clause!.sql).toContain("dp.id::text ILIKE $5");
    expect(clause!.sql).toContain("d.bolt_driver_id ILIKE $5");
    expect(clause!.sql).toContain("d.glovo_courier_id ILIKE $5");
    expect(clause!.param).toBe("%BOLT-12345%");
  });
});
