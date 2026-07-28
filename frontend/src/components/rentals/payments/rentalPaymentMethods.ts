export const RENTAL_PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "online", label: "Online" },
  { value: "other", label: "Any" },
] as const;

export type RentalPaymentMethod = (typeof RENTAL_PAYMENT_METHODS)[number]["value"];

export const DEFAULT_RENTAL_PAYMENT_METHOD: RentalPaymentMethod = "cash";

export function rentalPaymentMethodLabel(method: string | null | undefined): string {
  if (!method?.trim()) return "—";
  const m = method.toLowerCase().trim();
  if (m === "cash") return "Cash";
  if (m === "online") return "Online";
  if (m === "other" || m === "any") return "Any";
  if (
    m.includes("card") ||
    m.includes("stripe") ||
    m.includes("paypal") ||
    m.includes("bank") ||
    m.includes("transfer")
  ) {
    return "Online";
  }
  return method;
}

/** Map stored value (including legacy) to a select option. */
export function coerceRentalPaymentMethodForSelect(
  method: string | null | undefined,
): RentalPaymentMethod {
  if (!method?.trim()) return DEFAULT_RENTAL_PAYMENT_METHOD;
  const m = method.toLowerCase().trim();
  if (m === "cash") return "cash";
  if (m === "online") return "online";
  if (m === "other" || m === "any") return "other";
  if (
    m.includes("card") ||
    m.includes("stripe") ||
    m.includes("paypal") ||
    m.includes("bank") ||
    m.includes("transfer")
  ) {
    return "online";
  }
  return "other";
}
