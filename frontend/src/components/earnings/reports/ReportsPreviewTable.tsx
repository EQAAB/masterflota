import { Fragment, useEffect, useMemo, useState } from "react";
import type { EarningsReportRow, PayoutRentEntry } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { commissionBaseTypeLabel } from "../../../utils/commissionBaseLabels";
import { btnGhost, card, input, tableRow, tableRowExpandedAccent } from "../../../theme/classNames";
import { reportStatusBadgeClass } from "./reportsDisplayUtils";
import { DriversPagination } from "../../drivers/DriversPagination";

type SortKey =
  | "driver"
  | "period"
  | "revenue"
  | "commission"
  | "rental"
  | "payout"
  | "debt"
  | "status";

type SortState = {
  key: SortKey;
  dir: "asc" | "desc";
};

type ReportsPreviewTableProps = {
  rows: EarningsReportRow[];
  loading?: boolean;
  onVisibleRowsChange?: (rows: EarningsReportRow[]) => void;
};

/** 9-column grid: driver, period, 5 money cols, status, fixed actions */
const REPORTS_GRID_COLS =
  "minmax(0,1.35fr) minmax(0,0.95fr) minmax(0,0.68fr) minmax(0,0.68fr) minmax(0,0.68fr) minmax(0,0.68fr) minmax(0,0.68fr) minmax(0,0.72fr) 2.75rem";

const scrollShellClass =
  "max-h-[65vh] overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth " +
  "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)]";

const headerCellClass =
  "px-1.5 py-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted bg-surface/95";

const bodyCellClass = "px-1.5 py-1.5 min-w-0 align-top";

function asNumber(v: string | null): number {
  if (v == null || v === "") return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function formatCommissionRate(row: EarningsReportRow): string {
  const r = asNumber(row.commission_rate);
  if (!(r > 0)) return "—";
  return r <= 1 ? `${(r * 100).toFixed(2).replace(/\.?0+$/, "")}%` : `${r}%`;
}

function normalizeReportRentEntries(raw: EarningsReportRow["rent_entries"]): PayoutRentEntry[] {
  if (raw == null || !Array.isArray(raw)) return [];
  return raw.filter(
    (x): x is PayoutRentEntry =>
      typeof x === "object" &&
      x != null &&
      typeof (x as PayoutRentEntry).entry_type === "string" &&
      typeof (x as PayoutRentEntry).amount === "string",
  );
}

function rentEntryTypeLabel(t: string): string {
  switch (t) {
    case "current_week":
      return "This week";
    case "overdue":
      return "Overdue (prior week)";
    case "adjustment":
      return "Adjustment";
    default:
      return t;
  }
}

function vehicleRentBreakdown(row: EarningsReportRow): string | undefined {
  const entries = normalizeReportRentEntries(row.rent_entries);
  const total = asNumber(row.vehicle_rental_fee);
  if (!entries.length && total === 0) return undefined;
  if (!entries.length) return `Vehicle rent: ${formatCurrency(total)}`;
  return [
    `Vehicle rent total: ${formatCurrency(total)}`,
    ...entries.map((e) => {
      const desc = e.description ? ` — ${e.description}` : "";
      return `• ${rentEntryTypeLabel(e.entry_type)}: ${formatCurrency(Number(e.amount) || 0)}${desc}`;
    }),
  ].join("\n");
}

function driverSubline(row: EarningsReportRow): string {
  return row.phone?.trim() || "No phone";
}

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DetailField({ label, value, valueClassName = "" }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className={`mt-0.5 text-sm font-medium tabular-nums text-ink break-words ${valueClassName}`}>{value}</p>
    </div>
  );
}

function ReportsRowDetailsPanel({ row }: { row: EarningsReportRow }) {
  return (
    <div className="border-t border-border/60 bg-surface/30 px-3 py-3 sm:px-4">
      <p className="mb-3 text-xs font-semibold text-ink-muted">Payout breakdown</p>
      <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label="Income" value={formatCurrency(asNumber(row.income))} />
        <DetailField label="Tips" value={formatCurrency(asNumber(row.tips))} />
        <DetailField label="Platform fees" value={formatCurrency(asNumber(row.total_platform_fees))} />
        <DetailField label="Daily cash" value={formatCurrency(Math.abs(asNumber(row.total_daily_cash)))} />
        <DetailField label="Comm. base" value={formatCurrency(asNumber(row.commission_base))} />
        <DetailField label="Rate" value={formatCommissionRate(row)} />
        <DetailField
          label="Acct opening fee"
          value={formatCurrency(asNumber(row.account_opening_fee))}
          valueClassName="text-rose-700"
        />
        <DetailField label="Base type" value={commissionBaseTypeLabel(row.commission_base_type)} />
        {row.platform_id?.trim() && <DetailField label="Platform ID" value={row.platform_id.trim()} />}
      </div>
      {vehicleRentBreakdown(row) && (
        <p className="mt-3 border-t border-border/60 pt-2 text-[11px] leading-relaxed text-ink-muted whitespace-pre-line">
          {vehicleRentBreakdown(row)}
        </p>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex max-w-full rounded-full px-1.5 py-0.5 text-[9px] font-medium capitalize leading-tight xl:text-[10px] ${reportStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}

function MoneyCell({ value, bold, danger }: { value: string; bold?: boolean; danger?: boolean }) {
  return (
    <span
      className={`block text-right tabular-nums leading-snug break-words text-[10px] xl:text-[11px] ${
        bold ? "font-semibold" : "font-medium"
      } ${danger ? "text-danger" : "text-ink"}`}
    >
      {value}
    </span>
  );
}

function SummaryMetric({
  label,
  value,
  bold,
  danger,
}: {
  label: string;
  value: string;
  bold?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p
        className={`mt-0.5 break-words tabular-nums text-xs ${bold ? "font-semibold" : "font-medium"} ${danger ? "text-danger" : "text-ink"}`}
      >
        {value}
      </p>
    </div>
  );
}

function MobileReportCard({
  row,
  isExpanded,
  onToggle,
}: {
  row: EarningsReportRow;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const remainingDebt = asNumber(row.remaining_debt_amount);

  return (
    <div className="rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-ink break-words">{row.driver_name}</p>
          <p className="text-[11px] text-ink-muted break-words">{driverSubline(row)}</p>
          <p className="mt-1 text-[11px] text-ink-muted break-words">
            {row.period_start_label} – {row.period_end_label}
          </p>
        </div>
        <StatusBadge status={row.payment_status} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        <SummaryMetric label="Total gross" value={formatCurrency(asNumber(row.total_gross_earnings))} bold />
        <SummaryMetric label="Commission" value={formatCurrency(asNumber(row.company_commission))} />
        <SummaryMetric label="Vehicle rental" value={formatCurrency(asNumber(row.vehicle_rental_fee))} />
        <SummaryMetric label="Net payout" value={formatCurrency(asNumber(row.net_driver_payout))} bold />
        <SummaryMetric
          label="Remaining debt"
          value={formatCurrency(remainingDebt)}
          bold
          danger={remainingDebt > 0}
        />
      </div>

      <button
        type="button"
        className={`${btnGhost} mt-3 !min-h-0 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border/80 py-1.5 text-xs font-medium`}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        {isExpanded ? "Hide details" : "View details"}
        <ChevronIcon className="h-4 w-4" expanded={isExpanded} />
      </button>

      {isExpanded && <ReportsRowDetailsPanel row={row} />}
    </div>
  );
}

function SortHeaderButton({
  label,
  sortKey,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  sortKey: SortKey;
  sort: SortState;
  onSort: (key: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === sortKey;
  const arrow = active ? (sort.dir === "asc" ? " ↑" : " ↓") : "";
  return (
    <button
      type="button"
      className={`w-full font-medium hover:text-ink ${active ? "text-ink" : ""} ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {arrow}
    </button>
  );
}

function ReportsGridHeader({ sort, onSort }: { sort: SortState; onSort: (key: SortKey) => void }) {
  return (
    <div
      className="sticky top-0 z-10 grid border-b border-border backdrop-blur"
      style={{ gridTemplateColumns: REPORTS_GRID_COLS }}
    >
      <div className={headerCellClass}>
        <SortHeaderButton label="Driver" sortKey="driver" sort={sort} onSort={onSort} />
      </div>
      <div className={headerCellClass}>
        <SortHeaderButton label="Period" sortKey="period" sort={sort} onSort={onSort} />
      </div>
      <div className={`${headerCellClass} text-right`}>
        <SortHeaderButton label="Gross" sortKey="revenue" sort={sort} onSort={onSort} align="right" />
      </div>
      <div className={`${headerCellClass} text-right`}>
        <SortHeaderButton label="Comm." sortKey="commission" sort={sort} onSort={onSort} align="right" />
      </div>
      <div className={`${headerCellClass} text-right`}>
        <SortHeaderButton label="Rental" sortKey="rental" sort={sort} onSort={onSort} align="right" />
      </div>
      <div className={`${headerCellClass} text-right`}>
        <SortHeaderButton label="Net" sortKey="payout" sort={sort} onSort={onSort} align="right" />
      </div>
      <div className={`${headerCellClass} text-right`}>
        <SortHeaderButton label="Debt" sortKey="debt" sort={sort} onSort={onSort} align="right" />
      </div>
      <div className={headerCellClass}>
        <SortHeaderButton label="Status" sortKey="status" sort={sort} onSort={onSort} />
      </div>
      <div className={`${headerCellClass} flex items-center justify-center px-0`} aria-hidden>
        <span className="sr-only">Actions</span>
      </div>
    </div>
  );
}

function ReportsGridRow({
  row,
  isExpanded,
  stripeClass,
  onToggle,
}: {
  row: EarningsReportRow;
  isExpanded: boolean;
  stripeClass: string;
  onToggle: () => void;
}) {
  const remainingDebt = asNumber(row.remaining_debt_amount);

  return (
    <>
      <div
        className={`grid border-b border-border/60 text-ink ${tableRow} ${stripeClass} ${isExpanded ? tableRowExpandedAccent : ""}`}
        style={{ gridTemplateColumns: REPORTS_GRID_COLS }}
      >
        <div className={bodyCellClass}>
          <p className="break-words font-semibold leading-snug text-[11px] text-ink">{row.driver_name}</p>
          <p className="break-words text-[10px] leading-snug text-ink-muted">{driverSubline(row)}</p>
        </div>
        <div className={`${bodyCellClass} leading-snug`}>
          <span className="block break-words text-[10px] text-ink">{row.period_start_label}</span>
          <span className="block break-words text-[10px] text-ink-muted">{row.period_end_label}</span>
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asNumber(row.total_gross_earnings))} bold />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asNumber(row.company_commission))} />
        </div>
        <div className={bodyCellClass} title={vehicleRentBreakdown(row)}>
          <MoneyCell value={formatCurrency(asNumber(row.vehicle_rental_fee))} />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asNumber(row.net_driver_payout))} bold />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(remainingDebt)} bold danger={remainingDebt > 0} />
        </div>
        <div className={`${bodyCellClass} flex items-start`}>
          <StatusBadge status={row.payment_status} />
        </div>
        <div className={`${bodyCellClass} flex items-start justify-center px-0`}>
          <button
            type="button"
            className={`${btnGhost} !min-h-0 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg p-0`}
            onClick={onToggle}
            aria-expanded={isExpanded}
            title={isExpanded ? "Hide details" : "View details"}
            aria-label={isExpanded ? "Hide payout details" : "View payout details"}
          >
            <ChevronIcon className="h-4 w-4" expanded={isExpanded} />
          </button>
        </div>
      </div>
      {isExpanded && <ReportsRowDetailsPanel row={row} />}
    </>
  );
}

export function ReportsPreviewTable({
  rows,
  loading = false,
  onVisibleRowsChange,
}: ReportsPreviewTableProps) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>({ key: "period", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filteredSortedRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = q
      ? rows.filter((r) => {
          const hay = [
            r.driver_name,
            r.first_name,
            r.last_name,
            r.phone ?? "",
            r.platform_id ?? "",
            r.payment_status,
            r.period_start_label,
            r.period_end_label,
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        })
      : rows;

    return [...filtered].sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "driver") return a.driver_name.localeCompare(b.driver_name) * dir;
      if (sort.key === "status") return a.payment_status.localeCompare(b.payment_status) * dir;
      if (sort.key === "period")
        return a.payment_period_start.localeCompare(b.payment_period_start) * dir;
      if (sort.key === "revenue")
        return (asNumber(a.total_gross_earnings) - asNumber(b.total_gross_earnings)) * dir;
      if (sort.key === "commission")
        return (asNumber(a.company_commission) - asNumber(b.company_commission)) * dir;
      if (sort.key === "rental")
        return (asNumber(a.vehicle_rental_fee) - asNumber(b.vehicle_rental_fee)) * dir;
      if (sort.key === "debt")
        return (asNumber(a.remaining_debt_amount) - asNumber(b.remaining_debt_amount)) * dir;
      return (asNumber(a.net_driver_payout) - asNumber(b.net_driver_payout)) * dir;
    });
  }, [rows, search, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredSortedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredSortedRows.slice(start, start + pageSize);
  }, [filteredSortedRows, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
    setExpanded(new Set());
  }, [search, sort, rows]);

  useEffect(() => {
    setExpanded(new Set());
  }, [safePage, pageSize]);

  useEffect(() => {
    onVisibleRowsChange?.(filteredSortedRows);
  }, [filteredSortedRows, onVisibleRowsChange]);

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" },
    );
  }

  function toggleExpand(rowId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  return (
    <section className={`${card} min-w-0 !p-4 space-y-3 overflow-hidden`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor="reports-table-search" className="sr-only">
            Search preview rows
          </label>
          <input
            id="reports-table-search"
            type="search"
            className={input}
            placeholder="Driver, phone, platform ID, debt, period…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={loading}
          />
        </div>
        <p className="shrink-0 text-xs text-ink-muted whitespace-nowrap">
          Showing <span className="font-semibold text-ink">{filteredSortedRows.length.toLocaleString()}</span> of{" "}
          {rows.length.toLocaleString()} rows
        </p>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border py-10 text-center text-sm text-ink-muted">
          Loading live preview…
        </div>
      ) : paginatedRows.length === 0 ? (
        <div className="rounded-xl border border-border py-10 text-center text-sm text-ink-muted">
          No rows match the current filters.
        </div>
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {paginatedRows.map((row) => (
              <MobileReportCard
                key={row.id}
                row={row}
                isExpanded={expanded.has(row.id)}
                onToggle={() => toggleExpand(row.id)}
              />
            ))}
          </div>

          <div className="hidden md:block min-w-0 max-w-full overflow-hidden rounded-xl border border-border">
            <div className={scrollShellClass}>
              <ReportsGridHeader sort={sort} onSort={toggleSort} />
              {paginatedRows.map((row, index) => (
                <Fragment key={row.id}>
                  <ReportsGridRow
                    row={row}
                    isExpanded={expanded.has(row.id)}
                    stripeClass={index % 2 === 0 ? "bg-white" : "bg-surface/30"}
                    onToggle={() => toggleExpand(row.id)}
                  />
                </Fragment>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && filteredSortedRows.length > 0 && (
        <div className="min-w-0 overflow-hidden rounded-xl border border-border">
          <DriversPagination
            page={safePage}
            pageSize={pageSize}
            totalItems={filteredSortedRows.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            selectId="reports-page-size"
          />
        </div>
      )}
    </section>
  );
}
