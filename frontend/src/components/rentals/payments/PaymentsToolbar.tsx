import type { PaymentsFilters } from "./paymentsListUtils";
import { formatCurrency } from "../../../utils/currency";
import { btnSecondary } from "../../../theme/classNames";

type PaymentsToolbarProps = {
  filters: PaymentsFilters;
  onChange: (patch: Partial<PaymentsFilters>) => void;
  customers: Array<{ id: string; name: string }>;
  visibleCount: number;
  filteredCount?: number;
  filteredTotal?: number;
  summaryLoading?: boolean;
  onTodayPreset: () => void;
};

export function PaymentsToolbar({
  filters,
  onChange,
  customers,
  visibleCount,
  filteredCount = 0,
  filteredTotal = 0,
  summaryLoading,
  onTodayPreset,
}: PaymentsToolbarProps) {
  const truncated = filteredCount > visibleCount;

  return (
    <div className="fm-rental-payments__toolbar mb-5 space-y-4">
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
            className="fm-rental-payments__search"
            placeholder="Search booking, customer, invoice…"
            value={filters.q}
            onChange={(e) => onChange({ q: e.target.value })}
          />
        </div>
        <button type="button" className={`${btnSecondary} !text-xs`} onClick={onTodayPreset}>
          Today
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="fm-rental-payments__filter-select"
          value={filters.status}
          onChange={(e) => onChange({ status: e.target.value })}
          aria-label="Payment status"
        >
          <option value="">All statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>

        <input
          type="date"
          className="fm-rental-payments__filter-select"
          value={filters.from}
          onChange={(e) => onChange({ from: e.target.value })}
          aria-label="From date"
        />
        <input
          type="date"
          className="fm-rental-payments__filter-select"
          value={filters.to}
          onChange={(e) => onChange({ to: e.target.value })}
          aria-label="To date"
        />

        <select
          className="fm-rental-payments__filter-select"
          value={filters.paymentType}
          onChange={(e) => onChange({ paymentType: e.target.value })}
          aria-label="Payment type"
        >
          <option value="">All types</option>
          <option value="rent">Rent</option>
          <option value="deposit">Deposit</option>
          <option value="deposit_refund">Refund</option>
          <option value="extra">Extra / fee</option>
          <option value="damage">Damage</option>
        </select>

        <select
          className="fm-rental-payments__filter-select min-w-[140px]"
          value={filters.customerId}
          onChange={(e) => onChange({ customerId: e.target.value })}
          aria-label="Customer"
        >
          <option value="">All customers</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          className="fm-rental-payments__filter-select"
          value={filters.sort}
          onChange={(e) => onChange({ sort: e.target.value as PaymentsFilters["sort"] })}
          aria-label="Sort"
        >
          <option value="date">Sort: Date</option>
          <option value="amount">Sort: Amount</option>
          <option value="customer">Sort: Customer</option>
        </select>
      </div>

      <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 text-sm">
        {summaryLoading ? (
          <p className="text-slate-500">Calculating totals…</p>
        ) : (
          <>
            <p className="font-semibold text-ink">
              {filteredCount} payment{filteredCount === 1 ? "" : "s"} · Total{" "}
              {formatCurrency(filteredTotal)}
            </p>
            {truncated && (
              <p className="mt-1 text-xs text-slate-600">
                Showing {visibleCount} of {filteredCount} — export CSV for the visible list
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
