import { Trans, useTranslation } from "react-i18next";
import type { PricingFilters } from "./pricingListUtils";

type PricingToolbarProps = {
  filters: PricingFilters;
  onChange: (patch: Partial<PricingFilters>) => void;
  vehicleTypes: string[];
  resultCount: number;
};

export function PricingToolbar({
  filters,
  onChange,
  vehicleTypes,
  resultCount,
}: PricingToolbarProps) {
  const { t } = useTranslation();
  return (
    <div className="fm-rental-pricing__toolbar mb-5 space-y-4">
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
            className="fm-rental-pricing__search"
            placeholder={t("pages.pricing.searchPlaceholder")}
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          <Trans i18nKey="pages.pricing.resultCount" count={resultCount} />
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-pricing__filter-select"
          value={filters.pricingType}
          onChange={(e) => onChange({ pricingType: e.target.value as PricingFilters["pricingType"] })}
          aria-label={t("pages.pricing.pricingTypeAriaLabel")}
        >
          <option value="">{t("pages.pricing.allPricingTypes")}</option>
          <option value="vehicle">{t("pages.pricing.perVehicle")}</option>
          <option value="default">{t("pages.pricing.defaultTypeOption")}</option>
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value })}
          aria-label={t("pages.pricing.vehicleTypeAriaLabel")}
        >
          <option value="">{t("pages.pricing.allVehicleTypes")}</option>
          {vehicleTypes.map((vt) => (
            <option key={vt} value={vt}>
              {vt}
            </option>
          ))}
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.vehicleStatus}
          onChange={(e) => onChange({ vehicleStatus: e.target.value })}
          aria-label={t("pages.pricing.availabilityAriaLabel")}
        >
          <option value="">{t("pages.pricing.anyAvailability")}</option>
          <option value="available">{t("vehicleStatus.available")}</option>
          <option value="rented">{t("vehicleStatus.rented")}</option>
          <option value="maintenance">{t("vehicleStatus.maintenance")}</option>
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as PricingFilters["sort"] })}
          aria-label={t("pages.availability.sortAriaLabel")}
        >
          <option value="plate">{t("pages.pricing.sortPlate")}</option>
          <option value="daily">{t("pages.pricing.sortDaily")}</option>
          <option value="weekly">{t("pages.pricing.sortWeekly")}</option>
          <option value="monthly">{t("pages.pricing.sortMonthly")}</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white px-3 py-2 text-sm shadow-sm">
          <input
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(e) => onChange({ activeOnly: e.target.checked })}
            className="rounded border-slate-300 text-brand focus:ring-brand/30"
          />
          {t("pages.pricing.activeOnly")}
        </label>
      </div>
    </div>
  );
}
