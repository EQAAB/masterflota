import { describe, expect, it } from "vitest";
import { deriveConsolidatedStatus } from "./consolidatedPayouts";

describe("deriveConsolidatedStatus", () => {
  it("marks negative total as debt", () => {
    expect(deriveConsolidatedStatus(-10, ["pending", "pending"])).toEqual({
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
