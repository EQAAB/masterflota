import { useQuery } from "@tanstack/react-query";
import { getVehicles, RENTAL_VEHICLE_DROPDOWN_LIMIT } from "../../../api/vehicles";
import { btnSecondary } from "../../../theme/classNames";
import type { BookingsDensity } from "./bookingsListUtils";

export type BookingsFilters = {
  q: string;
  status: string;
  from: string;
  to: string;
  vehicleId: string;
  customerId: string;
};

type BookingsToolbarProps = {
  filters: BookingsFilters;
  onChange: (patch: Partial<BookingsFilters>) => void;
  density: BookingsDensity;
  onDensityChange: (d: BookingsDensity) => void;
  onExport: () => void;
  resultCount: number;
};

export function BookingsToolbar({
  filters,
  onChange,
  density,
  onDensityChange,
  onExport,
  resultCount,
}: BookingsToolbarProps) {
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "bookings-filter"],
    queryFn: () => getVehicles({ limit: RENTAL_VEHICLE_DROPDOWN_LIMIT }).then((r) => r.data.data),
  });

  return (
    <div className="fm-rental-bookings__toolbar mb-5 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 flex-1 max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle cx="11" cy="11" r="8" strokeWidth={1.75} />
            <path strokeLinecap="round" strokeWidth={1.75} d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            className="fm-rental-bookings__search"
            placeholder="Search booking ID, customer, vehicle…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          {resultCount} booking{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-bookings__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          aria-label="Booking status"
        >
          <option value="">All statuses</option>
          <option value="draft">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <input
          type="date"
          className="fm-rental-bookings__filter-select"
          value={filters.from}
          onChange={(e) => onChange({ from: e.target.value })}
          aria-label="From date"
        />
        <input
          type="date"
          className="fm-rental-bookings__filter-select"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
          aria-label="To date"
        />

        {filters.customerId ? (
          <button
            type="button"
            className="fm-rental-bookings__filter-select !border-brand/40 !bg-brand-mint/30 text-brand-dark"
            onClick={() => onChange({ customerId: "" })}
          >
            Clear customer filter ×
          </button>
        ) : null}

        <select
          className="fm-rental-bookings__filter-select min-w-[140px]"
          value={filters.vehicleId}
          onChange={(e) => onChange({ vehicleId: e.target.value })}
          aria-label="Vehicle"
        >
          <option value="">All vehicles</option>
          {(vehiclesQuery.data ?? []).map((v) => (
            <option key={v.id} value={v.id}>
              {v.license_plate}
            </option>
          ))}
        </select>

        <button type="button" className={btnSecondary} onClick={onExport}>
          Export
        </button>

        <button
          type="button"
          className={btnSecondary}
          onClick={() => onDensityChange(density === "comfortable" ? "compact" : "comfortable")}
          title="Toggle row density"
        >
          {density === "comfortable" ? "Compact rows" : "Comfortable rows"}
        </button>
      </div>
    </div>
  );
}
