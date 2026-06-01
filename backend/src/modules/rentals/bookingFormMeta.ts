import type { PricingSnapshot } from "./rentalTypes";

export type BookingFormMeta = {
  pickupLocation?: string;
  returnLocation?: string;
  driverNotes?: string;
  internalNotes?: string;
  extras?: string[];
  discountAmount?: number;
};

export function parseFormMeta(body: Record<string, unknown>): BookingFormMeta | null {
  const raw = body.formMeta;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const fm = raw as Record<string, unknown>;
  const out: BookingFormMeta = {};
  if (typeof fm.pickupLocation === "string" && fm.pickupLocation.trim()) {
    out.pickupLocation = fm.pickupLocation.trim();
  }
  if (typeof fm.returnLocation === "string" && fm.returnLocation.trim()) {
    out.returnLocation = fm.returnLocation.trim();
  }
  if (typeof fm.driverNotes === "string" && fm.driverNotes.trim()) {
    out.driverNotes = fm.driverNotes.trim();
  }
  if (typeof fm.internalNotes === "string" && fm.internalNotes.trim()) {
    out.internalNotes = fm.internalNotes.trim();
  }
  if (Array.isArray(fm.extras)) {
    out.extras = fm.extras.filter((x): x is string => typeof x === "string");
  }
  if (typeof fm.discountAmount === "number" && !Number.isNaN(fm.discountAmount)) {
    out.discountAmount = Math.max(0, fm.discountAmount);
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function mergeSnapshotWithFormMeta(
  snapshot: PricingSnapshot,
  formMeta: BookingFormMeta | null,
): PricingSnapshot & BookingFormMeta {
  if (!formMeta) return snapshot;
  return { ...snapshot, ...formMeta };
}

export function quotePayload(priced: {
  snapshot: PricingSnapshot;
  subtotal: number;
  deposit: number;
  total: number;
}) {
  const { snapshot } = priced;
  return {
    subtotal: priced.subtotal,
    deposit: priced.deposit,
    total: priced.total,
    days: snapshot.days,
    rates: {
      daily: snapshot.daily_rate,
      weekly: snapshot.weekly_rate,
      monthly: snapshot.monthly_rate,
    },
    currency: "RON" as const,
  };
}
