import { describe, expect, it } from "vitest";
import {
  canAdvancePaymentWeek,
  getPreviousWeek,
  shiftPaymentWeek,
} from "./earningsImportWeek";

describe("shiftPaymentWeek", () => {
  it("shifts Mon–Sun back by 7 days", () => {
    expect(shiftPaymentWeek("2026-05-12", "2026-05-18", -1)).toEqual({
      start: "2026-05-05",
      end: "2026-05-11",
    });
  });

  it("shifts Mon–Sun forward by 7 days", () => {
    expect(shiftPaymentWeek("2026-05-05", "2026-05-11", 1)).toEqual({
      start: "2026-05-12",
      end: "2026-05-18",
    });
  });

  it("returns null for invalid dates", () => {
    expect(shiftPaymentWeek("bad", "2026-05-11", 1)).toBeNull();
  });
});

describe("canAdvancePaymentWeek", () => {
  const today = new Date(2026, 4, 28); // Thu May 28, 2026

  it("is false at the latest completed week", () => {
    const latest = getPreviousWeek(today);
    expect(canAdvancePaymentWeek(latest.start, latest.end, today)).toBe(false);
  });

  it("is true one week earlier", () => {
    const latest = getPreviousWeek(today);
    const earlier = shiftPaymentWeek(latest.start, latest.end, -1);
    expect(earlier).not.toBeNull();
    expect(canAdvancePaymentWeek(earlier!.start, earlier!.end, today)).toBe(true);
  });
});
