import { Trans, useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
            placeholder={t("pages.availability.searchPlaceholder")}
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          <Trans i18nKey="pages.availability.resultCount" count={resultCount} />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-availability__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value as AvailabilityFilters["status"] })}
          aria-label={t("pages.availability.statusAriaLabel")}
        >
          <option value="">{t("pages.bookings.allStatuses")}</option>
          <option value="available">{t("vehicleStatus.available")}</option>
          <option value="rented">{t("vehicleStatus.rented")}</option>
          <option value="maintenance">{t("vehicleStatus.maintenance")}</option>
          <option value="blocked">{t("rentalStatus.vehicleAvailability.blocked")}</option>
          <option value="unavailable">{t("rentalStatus.vehicleAvailability.unavailable")}</option>
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value })}
          aria-label={t("pages.availability.vehicleTypeAriaLabel")}
        >
          <option value="">{t("pages.availability.allTypes")}</option>
          {vehicleTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.rentalStatus}
          onChange={(e) => onChange({ rentalStatus: e.target.value as AvailabilityFilters["rentalStatus"] })}
          aria-label={t("pages.availability.rentalStatusAriaLabel")}
        >
          <option value="">{t("pages.availability.anyRental")}</option>
          <option value="active">{t("pages.availability.activeRentalOption")}</option>
          <option value="confirmed">{t("pages.availability.confirmedUpcomingOption")}</option>
        </select>

        <select
          className="fm-rental-availability__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as AvailabilityFilters["sort"] })}
          aria-label={t("pages.availability.sortAriaLabel")}
        >
          <option value="plate">{t("pages.availability.sortPlate")}</option>
          <option value="availability">{t("pages.availability.sortAvailability")}</option>
          <option value="booked">{t("pages.availability.sortBooked")}</option>
        </select>
      </div>
    </div>
  );
}
