import { describe, expect, it } from "vitest";
import { addDays, defaultWeeklyStartAt } from "./weeklyRentalWorkflow";
import { createRentalPayment } from "./rentalPaymentService";

describe("weeklyRentalWorkflow helpers", () => {
  it("defaultWeeklyStartAt returns a future-ish date at 10:00", () => {
    const start = defaultWeeklyStartAt();
    expect(start.getHours()).toBe(10);
    expect(start.getMinutes()).toBe(0);
  });

  it("addDays adds seven days", () => {
    const start = new Date("2026-05-01T10:00:00.000Z");
    const end = addDays(start, 7);
    expect(end.toISOString()).toBe("2026-05-08T10:00:00.000Z");
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
