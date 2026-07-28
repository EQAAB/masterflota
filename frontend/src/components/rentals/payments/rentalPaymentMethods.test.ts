import { describe, expect, it } from "vitest";
import {
  coerceRentalPaymentMethodForSelect,
  rentalPaymentMethodLabel,
} from "./rentalPaymentMethods";

describe("rentalPaymentMethodLabel", () => {
  it("labels canonical methods", () => {
    expect(rentalPaymentMethodLabel("cash")).toBe("Cash");
    expect(rentalPaymentMethodLabel("online")).toBe("Online");
    expect(rentalPaymentMethodLabel("other")).toBe("Any");
  });

  it("maps legacy methods to Online", () => {
    expect(rentalPaymentMethodLabel("stripe")).toBe("Online");
    expect(rentalPaymentMethodLabel("card")).toBe("Online");
  });
});

describe("coerceRentalPaymentMethodForSelect", () => {
  it("coerces legacy stripe to online", () => {
    expect(coerceRentalPaymentMethodForSelect("stripe")).toBe("online");
  });

  it("defaults empty to cash", () => {
    expect(coerceRentalPaymentMethodForSelect(null)).toBe("cash");
  });
});
