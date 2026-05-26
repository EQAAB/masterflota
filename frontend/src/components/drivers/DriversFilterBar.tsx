import { useQuery } from "@tanstack/react-query";
import { getSubcontractors } from "../../api/subcontractors";
import { driversFilterCard, input, btnGhost } from "../../theme/classNames";
import type { DriverPlatformFilter, DriverStatusFilter } from "../../hooks/useDriversListFilters";

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <circle cx="11" cy="11" r="8" strokeWidth={1.75} />
      <path strokeLinecap="round" strokeWidth={1.75} d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FiltersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M4 6h16M6 12h12M8 18h8"
      />
    </svg>
  );
}

const selectClass = `${input} min-h-0 py-2.5 appearance-none cursor-pointer`;

type DriversFilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: DriverStatusFilter;
  onStatusChange: (value: DriverStatusFilter) => void;
  subcontractorFilter: string;
  onSubcontractorChange: (value: string) => void;
  platformFilter: DriverPlatformFilter;
  onPlatformChange: (value: DriverPlatformFilter) => void;
  filtersExpanded: boolean;
  onToggleFilters: () => void;
  totalCount: number;
  filteredCount: number;
  isFilterPending: boolean;
  debouncedQuery: string;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
};

export function DriversFilterBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusChange,
  subcontractorFilter,
  onSubcontractorChange,
  platformFilter,
  onPlatformChange,
  filtersExpanded,
  onToggleFilters,
  totalCount,
  filteredCount,
  isFilterPending,
  debouncedQuery,
  hasActiveFilters,
  onClearAllFilters,
}: DriversFilterBarProps) {
  const subcontractorsQuery = useQuery({
    queryKey: ["subcontractors", "list"],
    queryFn: async () => {
      const { data } = await getSubcontractors();
      return data;
    },
  });

  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className={driversFilterCard}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] lg:items-center lg:gap-2">
        <div className="relative min-w-0 lg:col-span-1">
          <label htmlFor="driver-search" className="sr-only">
            Search drivers
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
          <input
            id="driver-search"
            type="search"
            autoComplete="off"
            placeholder="Search name, phone, ID, city…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`${input} pl-10 ${hasQuery ? "pr-20" : ""}`}
          />
          {hasQuery && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1 text-xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              Clear
            </button>
          )}
        </div>

        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value as DriverStatusFilter)}
          className={selectClass}
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="terminated">Terminated</option>
        </select>

        <select
          aria-label="Filter by subcontractor"
          value={subcontractorFilter}
          onChange={(e) => onSubcontractorChange(e.target.value)}
          className={selectClass}
        >
          <option value="all">All subcontractors</option>
          {(subcontractorsQuery.data ?? []).map((s) => (
            <option key={s.id} value={s.id}>
              {s.legal_name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by platform"
          value={platformFilter}
          onChange={(e) => onPlatformChange(e.target.value as DriverPlatformFilter)}
          className={selectClass}
        >
          <option value="all">All platforms</option>
          <option value="bolt">Bolt</option>
          <option value="glovo">Glovo</option>
          <option value="bolt_glovo">Bolt + Glovo</option>
          <option value="uber">Uber</option>
          <option value="wolt">Wolt</option>
        </select>

        <button
          type="button"
          onClick={onToggleFilters}
          className={`${btnGhost} inline-flex shrink-0 items-center gap-2 text-sm`}
        >
          <FiltersIcon className="h-4 w-4" />
          Filters
        </button>
      </div>

      {filtersExpanded && (
        <p className="mt-3 text-xs text-ink-muted">
          More filters (commission range, vehicle assignment) coming soon.
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        {totalCount > 0 && (
          <p className="text-xs text-ink-muted sm:text-sm">
            {hasQuery && isFilterPending ? (
              <span>Matching drivers…</span>
            ) : debouncedQuery.trim() || hasActiveFilters ? (
              <>
                Showing{" "}
                <span className="font-semibold tabular-nums text-ink">{filteredCount.toLocaleString()}</span> of{" "}
                <span className="tabular-nums">{totalCount.toLocaleString()}</span>
              </>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-ink">{totalCount.toLocaleString()}</span> driver
                {totalCount === 1 ? "" : "s"}
              </>
            )}
          </p>
        )}
        {hasActiveFilters && (
          <button type="button" onClick={onClearAllFilters} className="text-xs font-medium text-brand hover:underline">
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
