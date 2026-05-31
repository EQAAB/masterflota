import { filterInputClass, filterSelectClass } from "./PayoutFiltersCard";

type PayoutTableToolbarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  hasQuery: boolean;
  onClearSearch: () => void;
  isFilterPending: boolean;
  filteredCount: number;
  totalCount: number;
  debouncedQuery: string;
  platformIdMatchCount: number;
};

/** In-page quick filter only. Summary KPIs live in PayoutPageKpiCards above the table. */
export function PayoutTableToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasQuery,
  onClearSearch,
  isFilterPending,
  debouncedQuery,
  platformIdMatchCount,
  filteredCount,
  totalCount,
}: PayoutTableToolbarProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-slate-50/50 px-3 py-3 sm:px-4">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Filter this page
      </p>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
          <label htmlFor="payout-search" className="sr-only">
            Quick search
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
            <input
              id="payout-search"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Name, platform ID, status, amount…"
              className={`${filterInputClass} pl-9 ${hasQuery ? "pr-[4.5rem]" : ""}`}
            />
            {hasQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-white hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="payout-status" className="sr-only">
            Status on page
          </label>
          <select
            id="payout-status"
            className={filterSelectClass}
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="hold">Hold</option>
            <option value="debt">Debt</option>
          </select>
        </div>
      </div>
      <p className="mt-2 text-[11px] text-ink-muted">
        {isFilterPending
          ? "Filtering…"
          : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()} rows on this page`}
        {debouncedQuery.trim() && !isFilterPending && (
          <>
            {" "}
            · {platformIdMatchCount.toLocaleString()} platform ID match
            {platformIdMatchCount === 1 ? "" : "es"}
          </>
        )}
      </p>
    </div>
  );
}
