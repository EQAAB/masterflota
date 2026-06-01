import { btnSecondary } from "../../../theme/classNames";

export type CustomersFilters = {
  q: string;
  customerType: "" | "company" | "individual";
  rentalStatus: "" | "active" | "none" | "inactive";
  activeOnly: boolean;
  sort: "name" | "revenue" | "bookings" | "created";
};

type CustomersToolbarProps = {
  filters: CustomersFilters;
  onChange: (patch: Partial<CustomersFilters>) => void;
  onExport: () => void;
  resultCount: number;
};

export function CustomersToolbar({ filters, onChange, onExport, resultCount }: CustomersToolbarProps) {
  return (
    <div className="fm-rental-customers__toolbar mb-5 space-y-4">
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
            className="fm-rental-customers__search"
            placeholder="Search name, email, phone…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <p className="text-xs text-ink-muted lg:shrink-0">
          {resultCount} customer{resultCount === 1 ? "" : "s"}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-customers__filter-select"
          value={filters.customerType}
          onChange={(e) =>
            onChange({ customerType: e.target.value as CustomersFilters["customerType"] })
          }
          aria-label="Customer type"
        >
          <option value="">All types</option>
          <option value="company">Company</option>
          <option value="individual">Individual</option>
        </select>

        <select
          className="fm-rental-customers__filter-select"
          value={filters.rentalStatus}
          onChange={(e) =>
            onChange({ rentalStatus: e.target.value as CustomersFilters["rentalStatus"] })
          }
          aria-label="Rental status"
        >
          <option value="">Any rental status</option>
          <option value="active">Has active rental</option>
          <option value="none">No active rental</option>
          <option value="inactive">Inactive accounts</option>
        </select>

        <select
          className="fm-rental-customers__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as CustomersFilters["sort"] })}
          aria-label="Sort"
        >
          <option value="name">Sort: Name</option>
          <option value="revenue">Sort: Revenue</option>
          <option value="bookings">Sort: Bookings</option>
          <option value="created">Sort: Newest</option>
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

        <button type="button" className={btnSecondary} onClick={onExport}>
          Export CSV
        </button>
      </div>
    </div>
  );
}
