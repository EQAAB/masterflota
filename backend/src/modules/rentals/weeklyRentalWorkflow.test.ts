import { describe, expect, it } from "vitest";
import {
  addDays,
  defaultWeeklyStartAt,
  WEEKLY_RENTAL_RENEWAL_DAYS,
  WEEKLY_RENTAL_SPAN_DAYS,
} from "./weeklyRentalWorkflow";
import { createRentalPayment } from "./rentalPaymentService";

describe("weeklyRentalWorkflow helpers", () => {
  it("defaultWeeklyStartAt returns a future-ish date at 10:00", () => {
    const start = defaultWeeklyStartAt();
    expect(start.getHours()).toBe(10);
    expect(start.getMinutes()).toBe(0);
  });

  it("addDays shifts by the requested number of days", () => {
    const start = new Date("2026-05-01T10:00:00.000Z");
    const end = addDays(start, 7);
    expect(end.toISOString()).toBe("2026-05-08T10:00:00.000Z");
  });

  it("weekly rental span is Mon pickup through Sun return (+6 days)", () => {
    const mondayPickup = new Date("2026-07-20T10:00:00.000Z");
    const sundayReturn = addDays(mondayPickup, WEEKLY_RENTAL_SPAN_DAYS);
    expect(sundayReturn.toISOString().slice(0, 10)).toBe("2026-07-26");
    expect(WEEKLY_RENTAL_RENEWAL_DAYS).toBe(7);
  });
});

describe("createRentalPayment", () => {
  it("rejects non-positive amounts", async () => {
    const db = { query: async () => ({ rows: [] }) };
    await expect(createRentalPayment(db, "org", "booking", { amount: 0 })).rejects.toThrow(
      "amount required",
    );
  });
});
