import { describe, expect, it } from "vitest";
import { createRentalPayment, parseRentalPaymentMethod } from "./rentalPaymentService";

describe("parseRentalPaymentMethod", () => {
  it("defaults to cash when empty", () => {
    expect(parseRentalPaymentMethod(null)).toBe("cash");
    expect(parseRentalPaymentMethod(undefined)).toBe("cash");
    expect(parseRentalPaymentMethod("")).toBe("cash");
  });

  it("normalizes canonical values", () => {
    expect(parseRentalPaymentMethod("cash")).toBe("cash");
    expect(parseRentalPaymentMethod("online")).toBe("online");
    expect(parseRentalPaymentMethod("other")).toBe("other");
    expect(parseRentalPaymentMethod("any")).toBe("other");
  });

  it("maps legacy online methods to online", () => {
    expect(parseRentalPaymentMethod("card")).toBe("online");
    expect(parseRentalPaymentMethod("stripe")).toBe("online");
    expect(parseRentalPaymentMethod("paypal")).toBe("online");
    expect(parseRentalPaymentMethod("bank transfer")).toBe("online");
  });

  it("maps unknown strings to other", () => {
    expect(parseRentalPaymentMethod("voucher")).toBe("other");
  });
});

describe("createRentalPayment method", () => {
  it("stores normalized method on insert", async () => {
    let insertedMethod: unknown;
    const db = {
      query: async (sql: string, params?: unknown[]) => {
        if (sql.includes("FROM rental_bookings")) return { rows: [{ id: "b1" }] };
        if (sql.includes("INSERT INTO rental_payments")) {
          insertedMethod = params?.[7];
          return { rows: [{ id: "p1", method: params?.[7] }] };
        }
        return { rows: [] };
      },
    };
    await createRentalPayment(db, "org", "booking", { amount: 100, method: "stripe" });
    expect(insertedMethod).toBe("online");
  });
});
