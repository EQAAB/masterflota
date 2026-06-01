import { useQuery } from "@tanstack/react-query";
import { getRentalCustomers } from "../../../api/rentals";
import { getVehicles } from "../../../api/vehicles";
import type { CalendarFilters } from "./calendarUtils";

type CalendarFilterBarProps = {
  filters: CalendarFilters;
  onChange: (patch: Partial<CalendarFilters>) => void;
};

export function CalendarFilterBar({ filters, onChange }: CalendarFilterBarProps) {
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "calendar-filter"],
    queryFn: () => getVehicles({ limit: 200 }).then((r) => r.data.data),
  });
  const customersQuery = useQuery({
    queryKey: ["rentals", "customers", "calendar-filter"],
    queryFn: () => getRentalCustomers().then((r) => r.data),
  });

  return (
    <div className="fm-rental-calendar__filter-bar mb-5 space-y-3">
      <div className="relative max-w-md">
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
          className="fm-rental-bookings__search w-full"
          placeholder="Search booking ID, customer, vehicle…"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className="fm-rental-bookings__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          aria-label="Status"
        >
          <option value="">All statuses</option>
          <option value="draft">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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
        <select
          className="fm-rental-bookings__filter-select min-w-[140px]"
          value={filters.customerId}
          onChange={(e) => onChange({ customerId: e.target.value })}
          aria-label="Customer"
        >
          <option value="">All customers</option>
          {(customersQuery.data ?? []).map((c) => (
            <option key={c.id} value={c.id}>
              {c.legal_name}
            </option>
          ))}
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
      </div>
    </div>
  );
}
