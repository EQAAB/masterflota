import type { RentalBooking } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { bookingStatusDisplayLabel, rentPaymentStateLabel } from "../rentalStatus";

export function formatRelativeCreated(createdAt?: string): string {
  if (!createdAt) return "";
  try {
    const d = new Date(createdAt);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "Created just now";
    if (diffMins < 60) return `Created ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Created ${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 14) return `Created ${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
    return `Created ${d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  } catch {
    return "";
  }
}

export function rentalDayCount(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export function countUpcomingPickups(bookings: RentalBooking[]): number {
  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  return bookings.filter((b) => {
    if (b.status !== "confirmed") return false;
    const start = new Date(b.start_at).getTime();
    return start >= now && start <= now + weekMs;
  }).length;
}

export function countCompleted(bookings: RentalBooking[]): number {
  return bookings.filter((b) => b.status === "completed").length;
}

export function countCreatedThisWeek(bookings: RentalBooking[]): number {
  const weekStart = new Date();
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
  return bookings.filter((b) => b.created_at && new Date(b.created_at) >= weekStart).length;
}

export type BookingsDensity = "comfortable" | "compact";

const DENSITY_KEY = "rental-bookings-density";

export function loadBookingsDensity(): BookingsDensity {
  try {
    const v = localStorage.getItem(DENSITY_KEY);
    return v === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

export function saveBookingsDensity(d: BookingsDensity): void {
  try {
    localStorage.setItem(DENSITY_KEY, d);
  } catch {
    /* ignore */
  }
}

export function exportBookingsCsv(bookings: RentalBooking[]): void {
  const headers = [
    "Booking",
    "Customer",
    "Phone",
    "Vehicle",
    "Start",
    "End",
    "Total",
    "Status",
    "Payment",
  ];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const rows = bookings.map((b) =>
    [
      b.booking_number,
      b.customer_name ?? "",
      b.customer_phone ?? "",
      `${b.license_plate ?? ""} ${b.make ?? ""} ${b.model ?? ""}`.trim(),
      b.start_at.slice(0, 10),
      b.end_at.slice(0, 10),
      formatCurrency(Number(b.total_amount)),
      bookingStatusDisplayLabel(b.status),
      rentPaymentStateLabel(b.rent_payment_state),
    ]
      .map(escape)
      .join(","),
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rental-bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
