import { describe, expect, it } from "vitest";
import { computeStatusAfterReleaseHold } from "./payoutHold";

describe("computeStatusAfterReleaseHold", () => {
  it("rejects non-hold status", () => {
    const r = computeStatusAfterReleaseHold({
      payment_status: "pending",
      raw_net_amount: 100,
      remaining_debt_amount: 0,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.message).toContain("not on hold");
  });

  it("returns debt when remaining debt > 0", () => {
    const r = computeStatusAfterReleaseHold({
      payment_status: "hold",
      raw_net_amount: -50,
      remaining_debt_amount: 25,
    });
    expect(r).toEqual({ ok: true, nextStatus: "debt" });
  });

  it("returns pending when forgiven negative (rem 0)", () => {
    const r = computeStatusAfterReleaseHold({
      payment_status: "hold",
      raw_net_amount: -80,
      remaining_debt_amount: 0,
    });
    expect(r).toEqual({ ok: true, nextStatus: "pending" });
  });

  it("returns pending for manual hold on positive net", () => {
    const r = computeStatusAfterReleaseHold({
      payment_status: "hold",
      raw_net_amount: 200,
      remaining_debt_amount: 0,
    });
    expect(r).toEqual({ ok: true, nextStatus: "pending" });
  });
});
