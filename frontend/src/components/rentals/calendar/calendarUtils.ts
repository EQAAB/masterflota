import type { RentalAvailabilityBooking } from "../../../api/rentals";

export type CalendarViewMode = "month" | "week" | "list";

export type CalendarFilters = {
  q: string;
  status: string;
  vehicleId: string;
  customerId: string;
  from: string;
  to: string;
};

export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthRange(d: Date): { from: string; to: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: toDateKey(start), to: toDateKey(end) };
}

export function weekRange(d: Date): { from: string; to: string } {
  const day = new Date(d);
  const dow = (day.getDay() + 6) % 7;
  const start = new Date(day);
  start.setDate(day.getDate() - dow);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { from: toDateKey(start), to: toDateKey(end) };
}

export type MonthCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
};

export function buildMonthCells(cursor: Date): MonthCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startPad = (first.getDay() + 6) % 7;
  const cells: MonthCell[] = [];

  for (let i = startPad - 1; i >= 0; i--) {
    const d = new Date(year, month, -i);
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: true });
  }
  while (cells.length % 7 !== 0 || cells.length < 42) {
    const last = cells[cells.length - 1].date;
    const d = new Date(last);
    d.setDate(d.getDate() + 1);
    cells.push({ date: d, dateKey: toDateKey(d), inMonth: false });
  }
  return cells.slice(0, 42);
}

export function buildWeekDays(cursor: Date): Date[] {
  const { from } = weekRange(cursor);
  const start = new Date(from + "T12:00:00");
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function isBookingOnDay(booking: RentalAvailabilityBooking, dateKey: string): boolean {
  const dayStart = new Date(dateKey + "T00:00:00");
  const dayEnd = new Date(dateKey + "T23:59:59");
  const start = new Date(booking.start_at);
  const end = new Date(booking.end_at);
  return start <= dayEnd && end >= dayStart;
}

export function bookingsForDay(bookings: RentalAvailabilityBooking[], dateKey: string): RentalAvailabilityBooking[] {
  return bookings.filter((b) => isBookingOnDay(b, dateKey));
}

export function formatEventDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  return `${s.toLocaleDateString("en-GB", opts)} → ${e.toLocaleDateString("en-GB", opts)}`;
}

export function groupBookingsByDay(bookings: RentalAvailabilityBooking[]): Map<string, RentalAvailabilityBooking[]> {
  const map = new Map<string, RentalAvailabilityBooking[]>();
  for (const b of bookings) {
    const start = new Date(b.start_at);
    const end = new Date(b.end_at);
    const cur = new Date(start);
    cur.setHours(12, 0, 0, 0);
    while (cur <= end) {
      const key = toDateKey(cur);
      const list = map.get(key) ?? [];
      if (!list.some((x) => x.id === b.id)) list.push(b);
      map.set(key, list);
      cur.setDate(cur.getDate() + 1);
    }
  }
  return new Map([...map.entries()].sort(([a], [b]) => a.localeCompare(b)));
}

export function upcomingPickups(bookings: RentalAvailabilityBooking[]): RentalAvailabilityBooking[] {
  const now = Date.now();
  const week = now + 7 * 24 * 60 * 60 * 1000;
  return bookings
    .filter((b) => b.status === "confirmed" && new Date(b.start_at).getTime() >= now && new Date(b.start_at).getTime() <= week)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime())
    .slice(0, 8);
}

export function todaysReturns(bookings: RentalAvailabilityBooking[]): RentalAvailabilityBooking[] {
  const today = toDateKey(new Date());
  return bookings
    .filter((b) => (b.status === "active" || b.status === "confirmed") && b.end_at.slice(0, 10) === today)
    .slice(0, 8);
}
