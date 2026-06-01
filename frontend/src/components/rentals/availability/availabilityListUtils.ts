import type {
  RentalAvailabilityBlock,
  RentalAvailabilityBooking,
  RentalAvailabilityVehicle,
} from "../../../api/rentals";
import type { VehicleAvailabilityDisplayStatus } from "../rentalStatus";

export type DaySegmentState = "available" | "booked" | "blocked" | "maintenance";

export type DaySegment = {
  date: string;
  state: DaySegmentState;
};

export type AvailabilityFilters = {
  q: string;
  status: "" | VehicleAvailabilityDisplayStatus;
  vehicleType: string;
  rentalStatus: "" | "active" | "confirmed" | "any";
  sort: "plate" | "availability" | "booked";
};

export function dateRangeDays(from: string, to: string): string[] {
  const days: string[] = [];
  const d = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);
  while (d <= end) {
    days.push(d.toISOString().slice(0, 10));
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return days;
}

export function defaultRange(days = 30): { from: string; to: string } {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days - 1);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function bookingCoversDate(b: RentalAvailabilityBooking, dateStr: string): boolean {
  if (b.status === "cancelled") return false;
  const startDay = b.start_at.slice(0, 10);
  const endDay = b.end_at.slice(0, 10);
  return dateStr >= startDay && dateStr <= endDay;
}

export function buildDaySegments(
  vehicle: RentalAvailabilityVehicle,
  bookings: RentalAvailabilityBooking[],
  blocks: RentalAvailabilityBlock[],
  from: string,
  to: string,
): DaySegment[] {
  const vehicleBookings = bookings.filter((b) => b.vehicle_id === vehicle.id);
  const vehicleBlocks = blocks.filter((b) => b.vehicle_id === vehicle.id);

  return dateRangeDays(from, to).map((date) => {
    if (vehicle.status === "maintenance") {
      return { date, state: "maintenance" as const };
    }
    const booked = vehicleBookings.some((b) => bookingCoversDate(b, date));
    if (booked) return { date, state: "booked" as const };
    const block = vehicleBlocks.find((b) => b.avail_date.slice(0, 10) === date);
    if (block && !block.is_available && !block.blocking_booking_id) {
      return { date, state: "blocked" as const };
    }
    if (block && !block.is_available) {
      return { date, state: "booked" as const };
    }
    return { date, state: "available" as const };
  });
}

export function deriveVehicleDisplayStatus(
  vehicle: RentalAvailabilityVehicle,
  segments: DaySegment[],
  bookings: RentalAvailabilityBooking[],
): VehicleAvailabilityDisplayStatus {
  if (["sold", "scrapped"].includes(vehicle.status)) return "unavailable";
  if (vehicle.status === "maintenance") return "maintenance";
  const hasActive = bookings.some(
    (b) =>
      b.vehicle_id === vehicle.id &&
      (b.status === "active" || b.status === "confirmed"),
  );
  if (hasActive && vehicle.status === "rented") return "rented";
  if (hasActive) return "rented";
  const hasBlocked = segments.some((s) => s.state === "blocked");
  if (hasBlocked) return "blocked";
  return "available";
}

export function countSegmentStates(segments: DaySegment[]) {
  let booked = 0;
  let blocked = 0;
  let available = 0;
  for (const s of segments) {
    if (s.state === "booked") booked++;
    else if (s.state === "blocked") blocked++;
    else if (s.state === "available") available++;
  }
  return { booked, blocked, available, total: segments.length };
}

export function availabilityPct(segments: DaySegment[]): number {
  const { available, total } = countSegmentStates(segments);
  if (total === 0) return 100;
  return Math.round((available / total) * 100);
}

export function formatRangeLabel(from: string, to: string): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  const f = new Date(`${from}T12:00:00.000Z`);
  const t = new Date(`${to}T12:00:00.000Z`);
  return `${f.toLocaleDateString("en-GB", opts)} – ${t.toLocaleDateString("en-GB", opts)}`;
}

export function filterAndSortVehicles(
  vehicles: RentalAvailabilityVehicle[],
  bookings: RentalAvailabilityBooking[],
  blocks: RentalAvailabilityBlock[],
  from: string,
  to: string,
  filters: AvailabilityFilters,
): RentalAvailabilityVehicle[] {
  let list = vehicles.map((v) => {
    const segments = buildDaySegments(v, bookings, blocks, from, to);
    return { v, segments, displayStatus: deriveVehicleDisplayStatus(v, segments, bookings) };
  });

  const q = filters.q.trim().toLowerCase();
  if (q) {
    list = list.filter(
      ({ v }) =>
        v.license_plate.toLowerCase().includes(q) ||
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q),
    );
  }

  if (filters.status) {
    list = list.filter(({ displayStatus }) => displayStatus === filters.status);
  }

  if (filters.vehicleType) {
    list = list.filter(({ v }) => v.vehicle_type === filters.vehicleType);
  }

  if (filters.rentalStatus === "active") {
    list = list.filter(({ v }) =>
      bookings.some((b) => b.vehicle_id === v.id && b.status === "active"),
    );
  } else if (filters.rentalStatus === "confirmed") {
    list = list.filter(({ v }) =>
      bookings.some((b) => b.vehicle_id === v.id && b.status === "confirmed"),
    );
  }

  const sorted = [...list];
  sorted.sort((a, b) => {
    if (filters.sort === "availability") {
      return availabilityPct(b.segments) - availabilityPct(a.segments);
    }
    if (filters.sort === "booked") {
      return countSegmentStates(b.segments).booked - countSegmentStates(a.segments).booked;
    }
    return a.v.license_plate.localeCompare(b.v.license_plate);
  });

  return sorted.map((x) => x.v);
}

export function vehicleTypeOptions(vehicles: RentalAvailabilityVehicle[]): string[] {
  return [...new Set(vehicles.map((v) => v.vehicle_type).filter(Boolean))].sort();
}

export function summarizePeriodText(segments: DaySegment[]): string {
  const { booked, blocked } = countSegmentStates(segments);
  const parts: string[] = [];
  if (booked > 0) parts.push(`${booked} day${booked === 1 ? "" : "s"} booked`);
  if (blocked > 0) parts.push(`${blocked} blocked`);
  if (parts.length === 0) return "Fully available in range";
  return parts.join(" · ");
}
