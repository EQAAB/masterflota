import i18n from "../../../i18n";

export const RENTAL_PAYMENT_METHODS = [
  { value: "cash", get label() { return i18n.t("rentalStatus.paymentMethod.cash"); } },
  { value: "online", get label() { return i18n.t("rentalStatus.paymentMethod.online"); } },
  { value: "other", get label() { return i18n.t("rentalStatus.paymentMethod.any"); } },
] as const;

export type RentalPaymentMethod = (typeof RENTAL_PAYMENT_METHODS)[number]["value"];

export const DEFAULT_RENTAL_PAYMENT_METHOD: RentalPaymentMethod = "cash";

export function rentalPaymentMethodLabel(method: string | null | undefined): string {
  if (!method?.trim()) return i18n.t("common.emDash");
  const m = method.toLowerCase().trim();
  if (m === "cash") return i18n.t("rentalStatus.paymentMethod.cash");
  if (m === "online") return i18n.t("rentalStatus.paymentMethod.online");
  if (m === "other" || m === "any") return i18n.t("rentalStatus.paymentMethod.any");
  if (
    m.includes("card") ||
    m.includes("stripe") ||
    m.includes("paypal") ||
    m.includes("bank") ||
    m.includes("transfer")
  ) {
    return i18n.t("rentalStatus.paymentMethod.online");
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
