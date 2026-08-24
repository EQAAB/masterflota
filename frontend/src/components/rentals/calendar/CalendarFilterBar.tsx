import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { getRentalCustomers } from "../../../api/rentals";
import { getVehicles, RENTAL_VEHICLE_DROPDOWN_LIMIT } from "../../../api/vehicles";
import type { CalendarFilters } from "./calendarUtils";

type CalendarFilterBarProps = {
  filters: CalendarFilters;
  onChange: (patch: Partial<CalendarFilters>) => void;
};

export function CalendarFilterBar({ filters, onChange }: CalendarFilterBarProps) {
  const { t } = useTranslation();
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "calendar-filter"],
    queryFn: () => getVehicles({ limit: RENTAL_VEHICLE_DROPDOWN_LIMIT }).then((r) => r.data.data),
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
          placeholder={t("pages.bookings.searchPlaceholder")}
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <select
          className="fm-rental-bookings__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          aria-label={t("common.status")}
        >
          <option value="">{t("pages.bookings.allStatuses")}</option>
          <option value="draft">{t("rentalStatus.booking.pending")}</option>
          <option value="confirmed">{t("rentalStatus.booking.confirmed")}</option>
          <option value="active">{t("rentalStatus.booking.active")}</option>
          <option value="completed">{t("rentalStatus.booking.completed")}</option>
          <option value="cancelled">{t("rentalStatus.booking.cancelled")}</option>
        </select>
        <select
          className="fm-rental-bookings__filter-select min-w-[140px]"
          value={filters.vehicleId}
          onChange={(e) => onChange({ vehicleId: e.target.value })}
          aria-label={t("pages.bookings.vehicleAriaLabel")}
        >
          <option value="">{t("pages.bookings.allVehicles")}</option>
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
          aria-label={t("pages.rentalCalendar.customerAriaLabel")}
        >
          <option value="">{t("pages.rentalCalendar.allCustomers")}</option>
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
          aria-label={t("pages.bookings.fromDateAriaLabel")}
        />
        <input
          type="date"
          className="fm-rental-bookings__filter-select"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
          aria-label={t("pages.bookings.toDateAriaLabel")}
        />
      </div>
    </div>
  );
}
