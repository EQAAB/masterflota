import type { RentalQuote } from "../../../api/rentals";

type RentalType = "daily" | "weekly" | "monthly";
import { EXTRA_SERVICES } from "./bookingFormConstants";

export function combineDateAndTime(date: string, time: string): string | null {
  if (!date || !time) return null;
  const d = new Date(`${date}T${time}`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function splitIsoToDateTime(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

export function formatBookingDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function daysBetweenLocal(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function addDaysToDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseStartAtParam(param: string): { date: string; time: string } {
  if (param.includes("T")) {
    const normalized = param.length === 16 ? `${param}:00` : param;
    return splitIsoToDateTime(new Date(normalized).toISOString());
  }
  return { date: param.slice(0, 10), time: "09:00" };
}

export type DisplayTotals = {
  unitLabel: string;
  unitRate: number;
  days: number;
  subtotal: number;
  extrasTotal: number;
  discount: number;
  deposit: number;
  grandTotal: number;
};

export function computeDisplayTotals(
  quote: RentalQuote | null,
  rentalType: RentalType,
  selectedExtras: string[],
  discountAmount: number,
): DisplayTotals | null {
  if (!quote) return null;
  const extrasTotal = EXTRA_SERVICES.filter((e) => selectedExtras.includes(e.id)).reduce(
    (s, e) => s + e.amount,
    0,
  );
  const discount = Math.max(0, discountAmount);
  const grandTotal = Math.max(0, quote.subtotal + extrasTotal - discount);

  let unitLabel = "Daily price";
  let unitRate = quote.rates.daily;
  if (rentalType === "weekly") {
    unitLabel = "Weekly price";
    unitRate = quote.rates.weekly;
  } else if (rentalType === "monthly") {
    unitLabel = "Monthly price";
    unitRate = quote.rates.monthly;
  }

  return {
    unitLabel,
    unitRate,
    days: quote.days,
    subtotal: quote.subtotal,
    extrasTotal,
    discount,
    deposit: quote.deposit,
    grandTotal,
  };
}

export function hydrateFormMeta(snapshot: Record<string, unknown> | undefined) {
  if (!snapshot) {
    return {
      pickupLocation: "",
      returnLocation: "",
      driverNotes: "",
      internalNotes: "",
      selectedExtras: [] as string[],
      discountAmount: 0,
    };
  }
  return {
    pickupLocation: typeof snapshot.pickupLocation === "string" ? snapshot.pickupLocation : "",
    returnLocation: typeof snapshot.returnLocation === "string" ? snapshot.returnLocation : "",
    driverNotes: typeof snapshot.driverNotes === "string" ? snapshot.driverNotes : "",
    internalNotes: typeof snapshot.internalNotes === "string" ? snapshot.internalNotes : "",
    selectedExtras: Array.isArray(snapshot.extras)
      ? snapshot.extras.filter((x): x is string => typeof x === "string")
      : [],
    discountAmount:
      typeof snapshot.discountAmount === "number" ? snapshot.discountAmount : 0,
  };
}

export function buildFormMetaPayload(fields: {
  pickupLocation: string;
  returnLocation: string;
  driverNotes: string;
  internalNotes: string;
  selectedExtras: string[];
  discountAmount: number;
}) {
  const meta: Record<string, unknown> = {};
  if (fields.pickupLocation.trim()) meta.pickupLocation = fields.pickupLocation.trim();
  if (fields.returnLocation.trim()) meta.returnLocation = fields.returnLocation.trim();
  if (fields.driverNotes.trim()) meta.driverNotes = fields.driverNotes.trim();
  if (fields.internalNotes.trim()) meta.internalNotes = fields.internalNotes.trim();
  if (fields.selectedExtras.length) meta.extras = fields.selectedExtras;
  if (fields.discountAmount > 0) meta.discountAmount = fields.discountAmount;
  return Object.keys(meta).length ? meta : undefined;
}
