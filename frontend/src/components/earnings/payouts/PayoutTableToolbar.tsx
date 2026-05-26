import { card, input, sectionLabel } from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";

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
  pendingTotal: number;
  paidCount: number;
};

export function PayoutTableToolbar({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  hasQuery,
  onClearSearch,
  isFilterPending,
  filteredCount,
  totalCount,
  debouncedQuery,
  platformIdMatchCount,
  pendingTotal,
  paidCount,
}: PayoutTableToolbarProps) {
  return (
    <div className={`${card} space-y-4`}>
      <div>
        <h2 className="text-sm font-semibold text-ink">Filter this page</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Search within the 25 rows loaded; use filters above for date/status across all pages.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="md:col-span-2">
            <label htmlFor="payout-search" className={sectionLabel}>
            Quick search
          </label>
          <div className="relative">
            <input
              id="payout-search"
              type="search"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="e.g. Bilal, 46bcf8, pending, 250"
                className={`${input} ${hasQuery ? "pr-[4.5rem]" : ""}`}
            />
            {hasQuery && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-medium text-ink-muted hover:bg-slate-100 hover:text-ink"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        <div>
          <label htmlFor="payout-status" className={sectionLabel}>
            Status on page
          </label>
          <select
            id="payout-status"
            className={input}
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

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-white/70 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">Showing</p>
          <p className="text-sm font-semibold text-ink tabular-nums mt-0.5">
            {isFilterPending ? "Filtering…" : `${filteredCount.toLocaleString()} of ${totalCount.toLocaleString()}`}
          </p>
          {!isFilterPending && debouncedQuery.trim() && (
            <p className="mt-1 text-xs text-ink-muted">
              Found {platformIdMatchCount.toLocaleString()} matching platform ID
              {platformIdMatchCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">Pending total</p>
          <p className="text-sm font-semibold text-amber-900 tabular-nums mt-0.5">{formatCurrency(pendingTotal)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 px-3 py-2.5">
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Paid rows</p>
          <p className="text-sm font-semibold text-emerald-900 tabular-nums mt-0.5">{paidCount.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
