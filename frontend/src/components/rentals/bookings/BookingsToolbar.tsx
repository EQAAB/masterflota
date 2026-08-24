import { useQuery } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            placeholder={t("pages.bookings.searchPlaceholder")}
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          <Trans i18nKey="pages.bookings.resultCount" count={resultCount} />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-bookings__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          aria-label={t("pages.bookings.statusAriaLabel")}
        >
          <option value="">{t("pages.bookings.allStatuses")}</option>
          <option value="draft">{t("rentalStatus.booking.pending")}</option>
          <option value="confirmed">{t("rentalStatus.booking.confirmed")}</option>
          <option value="active">{t("rentalStatus.booking.active")}</option>
          <option value="completed">{t("rentalStatus.booking.completed")}</option>
          <option value="cancelled">{t("rentalStatus.booking.cancelled")}</option>
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

        {filters.customerId ? (
          <button
            type="button"
            className="fm-rental-bookings__filter-select !border-brand/40 !bg-brand-mint/30 text-brand-dark"
            onClick={() => onChange({ customerId: "" })}
          >
            {t("pages.bookings.clearCustomerFilter")}
          </button>
        ) : null}

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

        <button type="button" className={btnSecondary} onClick={onExport}>
          {t("common.export")}
        </button>

        <button
          type="button"
          className={btnSecondary}
          onClick={() => onDensityChange(density === "comfortable" ? "compact" : "comfortable")}
          title={t("pages.bookings.toggleDensityTitle")}
        >
          {density === "comfortable" ? t("pages.bookings.compactRows") : t("pages.bookings.comfortableRows")}
        </button>
      </div>
    </div>
  );
}
