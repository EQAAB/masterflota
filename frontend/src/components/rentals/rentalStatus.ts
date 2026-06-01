export function bookingStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200/60";
    case "confirmed":
      return "bg-sky-100 text-sky-800 ring-sky-200/60";
    case "draft":
      return "bg-slate-100 text-slate-700 ring-slate-200/60";
    case "completed":
      return "bg-violet-100 text-violet-800 ring-violet-200/60";
    case "cancelled":
      return "bg-rose-100 text-rose-800 ring-rose-200/60";
    default:
      return "bg-amber-100 text-amber-900 ring-amber-200/60";
  }
}

export function formatBookingStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/** UI label — maps draft to Pending for list display */
export function bookingStatusDisplayLabel(status: string): string {
  if (status === "draft") return "Pending";
  return formatBookingStatus(status);
}

export function rentPaymentStateLabel(state?: string): string {
  switch (state) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially paid";
    case "unpaid":
      return "Unpaid";
    default:
      return "—";
  }
}

/** Event card styling for calendar views */
export function bookingEventStatusClass(status: string): string {
  switch (status) {
    case "active":
      return "fm-rental-calendar__event fm-rental-calendar__event--active";
    case "completed":
      return "fm-rental-calendar__event fm-rental-calendar__event--completed";
    case "confirmed":
      return "fm-rental-calendar__event fm-rental-calendar__event--confirmed";
    case "draft":
      return "fm-rental-calendar__event fm-rental-calendar__event--draft";
    case "cancelled":
      return "fm-rental-calendar__event fm-rental-calendar__event--cancelled";
    default:
      return "fm-rental-calendar__event";
  }
}

export function customerTypeBadgeClass(type: string): string {
  return type === "company"
    ? "fm-rental-customers__type-pill fm-rental-customers__type-pill--company"
    : "fm-rental-customers__type-pill fm-rental-customers__type-pill--individual";
}

export function customerStatusBadgeClass(
  isActive: boolean,
  activeBookings: number,
): string {
  if (!isActive) return "fm-rental-customers__status-pill fm-rental-customers__status-pill--inactive";
  if (activeBookings > 0) return "fm-rental-customers__status-pill fm-rental-customers__status-pill--rental";
  return "fm-rental-customers__status-pill fm-rental-customers__status-pill--active";
}

export type VehicleAvailabilityDisplayStatus =
  | "available"
  | "rented"
  | "maintenance"
  | "blocked"
  | "unavailable";

export function vehicleAvailabilityStatusClass(status: VehicleAvailabilityDisplayStatus): string {
  return `fm-rental-availability__status-pill fm-rental-availability__status-pill--${status}`;
}

export function vehicleAvailabilityStatusLabel(status: VehicleAvailabilityDisplayStatus): string {
  switch (status) {
    case "available":
      return "Available";
    case "rented":
      return "Rented";
    case "maintenance":
      return "Maintenance";
    case "blocked":
      return "Blocked";
    case "unavailable":
      return "Unavailable";
  }
}

export type PricingDisplayStatus = "active" | "draft" | "seasonal" | "discounted";

export function pricingStatusClass(status: PricingDisplayStatus): string {
  return `fm-rental-pricing__status-pill fm-rental-pricing__status-pill--${status}`;
}

export function pricingStatusLabel(status: PricingDisplayStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "draft":
      return "Draft";
    case "seasonal":
      return "Seasonal";
    case "discounted":
      return "Discounted";
  }
}

export function vehicleFleetStatusClass(status: string): string {
  switch (status) {
    case "available":
      return "fm-rental-pricing__fleet-pill fm-rental-pricing__fleet-pill--available";
    case "rented":
      return "fm-rental-pricing__fleet-pill fm-rental-pricing__fleet-pill--rented";
    case "maintenance":
      return "fm-rental-pricing__fleet-pill fm-rental-pricing__fleet-pill--maintenance";
    default:
      return "fm-rental-pricing__fleet-pill fm-rental-pricing__fleet-pill--unavailable";
  }
}

export function vehicleFleetStatusLabel(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export type PaymentDisplayStatus = "paid" | "pending" | "failed" | "refunded";

export function paymentStatusClass(status: string): string {
  const s = status as PaymentDisplayStatus;
  if (s === "paid" || s === "pending" || s === "failed" || s === "refunded") {
    return `fm-rental-payments__status-pill fm-rental-payments__status-pill--${s}`;
  }
  return "fm-rental-payments__status-pill fm-rental-payments__status-pill--pending";
}

export function paymentStatusLabel(status: string): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "failed":
      return "Failed";
    case "refunded":
      return "Refunded";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function paymentTypeClass(type: string): string {
  switch (type) {
    case "rent":
      return "fm-rental-payments__type-pill fm-rental-payments__type-pill--rent";
    case "deposit":
      return "fm-rental-payments__type-pill fm-rental-payments__type-pill--deposit";
    case "deposit_refund":
      return "fm-rental-payments__type-pill fm-rental-payments__type-pill--refund";
    case "extra":
      return "fm-rental-payments__type-pill fm-rental-payments__type-pill--extra";
    case "damage":
      return "fm-rental-payments__type-pill fm-rental-payments__type-pill--damage";
    default:
      return "fm-rental-payments__type-pill";
  }
}

export function paymentTypeLabel(type: string): string {
  switch (type) {
    case "rent":
      return "Rent";
    case "deposit":
      return "Deposit";
    case "deposit_refund":
      return "Refund";
    case "extra":
      return "Extra / fee";
    case "damage":
      return "Damage";
    default:
      return type;
  }
}

export function amountToneClass(status: string, paymentType: string): string {
  if (status === "refunded" || paymentType === "deposit_refund") return "fm-rental-payments__amount--refunded";
  if (status === "paid") return "fm-rental-payments__amount--paid";
  if (status === "pending") return "fm-rental-payments__amount--pending";
  if (status === "failed") return "text-rose-700";
  return "text-ink";
}

export function customerStatusLabel(isActive: boolean, activeBookings: number): string {
  if (!isActive) return "Inactive";
  if (activeBookings > 0) return "Active rental";
  return "Active account";
}

export function rentPaymentStateClass(state?: string): string {
  switch (state) {
    case "paid":
      return "text-emerald-700";
    case "partial":
      return "text-amber-700";
    case "unpaid":
      return "text-slate-500";
    default:
      return "text-slate-400";
  }
}
