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
            placeholder="Search vehicle, plate, model…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          {resultCount} rule{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-pricing__filter-select"
          value={filters.pricingType}
          onChange={(e) => onChange({ pricingType: e.target.value as PricingFilters["pricingType"] })}
          aria-label="Pricing type"
        >
          <option value="">All pricing types</option>
          <option value="vehicle">Per vehicle</option>
          <option value="default">Default / type</option>
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.vehicleType}
          onChange={(e) => onChange({ vehicleType: e.target.value })}
          aria-label="Vehicle type"
        >
          <option value="">All vehicle types</option>
          {vehicleTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.vehicleStatus}
          onChange={(e) => onChange({ vehicleStatus: e.target.value })}
          aria-label="Availability"
        >
          <option value="">Any availability</option>
          <option value="available">Available</option>
          <option value="rented">Rented</option>
          <option value="maintenance">Maintenance</option>
        </select>

        <select
          className="fm-rental-pricing__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as PricingFilters["sort"] })}
          aria-label="Sort"
        >
          <option value="plate">Sort: Plate</option>
          <option value="daily">Sort: Daily rate</option>
          <option value="weekly">Sort: Weekly rate</option>
          <option value="monthly">Sort: Monthly rate</option>
        </select>

        <label className="inline-flex items-center gap-2 rounded-xl border border-border/80 bg-white px-3 py-2 text-sm shadow-sm">
          <input
            type="checkbox"
            checked={filters.activeOnly}
            onChange={(e) => onChange({ activeOnly: e.target.checked })}
            className="rounded border-slate-300 text-brand focus:ring-brand/30"
          />
          Active only
        </label>
      </div>
    </div>
  );
}
