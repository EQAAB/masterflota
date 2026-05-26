import type { SubcontractorStatusFilter } from "../../hooks/useSubcontractorsListFilters";
import { driversFilterCard, input, btnGhost } from "../../theme/classNames";

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

type SubcontractorsFilterBarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearSearch: () => void;
  statusFilter: SubcontractorStatusFilter;
  onStatusChange: (value: SubcontractorStatusFilter) => void;
  filtersExpanded: boolean;
  onToggleFilters: () => void;
  totalCount: number;
  filteredCount: number;
  isFilterPending: boolean;
  debouncedQuery: string;
  hasActiveFilters: boolean;
  onClearAllFilters: () => void;
};

export function SubcontractorsFilterBar({
  searchQuery,
  onSearchChange,
  onClearSearch,
  statusFilter,
  onStatusChange,
  filtersExpanded,
  onToggleFilters,
  totalCount,
  filteredCount,
  isFilterPending,
  debouncedQuery,
  hasActiveFilters,
  onClearAllFilters,
}: SubcontractorsFilterBarProps) {
  const hasQuery = searchQuery.trim().length > 0;

  return (
    <div className={driversFilterCard}>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center lg:gap-2">
        <div className="relative min-w-0">
          <label htmlFor="subcontractor-search" className="sr-only">
            Search subcontractors
          </label>
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-ink-muted" />
          <input
            id="subcontractor-search"
            type="search"
            autoComplete="off"
            placeholder="Search subcontractor name, phone, email..."
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
          onChange={(e) => onStatusChange(e.target.value as SubcontractorStatusFilter)}
          className={selectClass}
        >
          <option value="all">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
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
        <p className="mt-3 text-xs text-ink-muted">More filters (contract dates, registration type) coming soon.</p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border/40 pt-3">
        {totalCount > 0 && (
          <p className="text-xs text-ink-muted sm:text-sm">
            {hasQuery && isFilterPending ? (
              <span>Matching subcontractors…</span>
            ) : debouncedQuery.trim() || hasActiveFilters ? (
              <>
                Showing{" "}
                <span className="font-semibold tabular-nums text-ink">{filteredCount.toLocaleString()}</span> of{" "}
                <span className="tabular-nums">{totalCount.toLocaleString()}</span>
              </>
            ) : (
              <>
                <span className="font-semibold tabular-nums text-ink">{totalCount.toLocaleString()}</span>{" "}
                subcontractor{totalCount === 1 ? "" : "s"}
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
