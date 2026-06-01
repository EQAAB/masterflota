import type { AvailabilityFilters } from "./availabilityListUtils";

type AvailabilityToolbarProps = {
  filters: AvailabilityFilters;
  onChange: (patch: Partial<AvailabilityFilters>) => void;
  vehicleTypes: string[];
  resultCount: number;
};

export function AvailabilityToolbar({
  filters,
  onChange,
  vehicleTypes,
  resultCount,
}: AvailabilityToolbarProps) {
  return (
    <div className="fm-rental-availability__toolbar mb-5 space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative min-w-0 max-w-md flex-1">
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
            className="fm-rental-availability__search"
            placeholder="Search plate, model, vehicle…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          {resultCount} vehicle{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-availability__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as AvailabilityFilters["status"] })}
          aria-label="Availability status"
        >
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
          <option value="blocked">Blocked</option>
          <option value="unavailable">Unavailable</option>
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value })}
          aria-label="Vehicle type"
        >
          <option value="">All types</option>
          {vehicleTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.rentalStatus}
          onChange={(e) => onChange({ rentalStatus: e.target.value as AvailabilityFilters["rentalStatus"] })}
          aria-label="Rental status"
        >
          <option value="">Any rental</option>
          <option value="active">Active rental</option>
          <option value="confirmed">Confirmed upcoming</option>
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as AvailabilityFilters["sort"] })}
          aria-label="Sort"
        >
          <option value="plate">Sort: Plate</option>
          <option value="availability">Sort: Availability %</option>
          <option value="booked">Sort: Days booked</option>
        </select>
      </div>
    </div>
  );
}
