import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { driversTableCard, transitionDefault } from "../../../theme/classNames";
import { EmptyState } from "../../theme/EmptyState";
import { SettlementRowActions } from "./SettlementRowActions";
import {
  asSettlementNumber,
  settlementPayable,
  settlementRowKey,
  settlementStatusDisplay,
} from "./settlementsDisplayUtils";

/**
 * Chevron | Subcontractor | Drivers | Gross | Commission | Payable | Status | Actions
 * Money cols use fixed widths + nowrap to prevent RON line breaks.
 */
const GRID_COLS =
  "1.75rem minmax(0,1fr) 2.75rem 6.25rem 6.25rem 6.25rem 5.5rem 2.75rem";

const scrollShellClass =
  "max-h-[68vh] overflow-y-auto overflow-x-auto overscroll-y-contain scroll-smooth " +
  "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)]";

const headerCellClass =
  "px-2 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50/95";

const bodyCellClass = "px-2 py-2.5 min-w-0 align-middle";

const moneyCellClass =
  "block text-right tabular-nums whitespace-nowrap text-[11px] font-medium text-ink leading-none";

const rowBaseClass =
  `grid border-b border-border/50 bg-white transition-colors duration-150 ease-out hover:bg-slate-50/80 ${transitionDefault}`;

function ChevronIcon({ className, expanded }: { className?: string; expanded: boolean }) {
  return (
    <svg
      className={`${className ?? ""} transition-transform duration-200 ease-out ${expanded ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function StatusBadge({ row }: { row: SubcontractorSettlementRow }) {
  const { label, className, dotClassName } = settlementStatusDisplay(row);
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium leading-none whitespace-nowrap ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotClassName}`} aria-hidden />
      {label}
    </span>
  );
}

function MoneyCell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <span className={`${moneyCellClass} ${bold ? "font-semibold" : ""}`}>{value}</span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border/40 bg-white/80 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-ink whitespace-nowrap">{value}</p>
    </div>
  );
}

function SettlementRowDetailsPanel({ row }: { row: SubcontractorSettlementRow }) {
  return (
    <div className="border-b border-border/50 bg-slate-50/90 px-3 py-3 sm:px-4">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        Additional breakdown
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Tips" value={formatCurrency(asSettlementNumber(row.total_tips))} />
        <DetailField label="Vehicle rent" value={formatCurrency(asSettlementNumber(row.total_vehicle_rent))} />
        <DetailField label="Acct. fee" value={formatCurrency(asSettlementNumber(row.total_account_opening_fee))} />
        <DetailField label="Platform fee" value={formatCurrency(asSettlementNumber(row.total_platform_fees))} />
        <DetailField label="Daily cash" value={formatCurrency(asSettlementNumber(row.total_daily_cash))} />
        <DetailField label="Custom ded." value={formatCurrency(asSettlementNumber(row.total_custom_deductions))} />
        <DetailField label="Custom add." value={formatCurrency(asSettlementNumber(row.total_custom_additions))} />
      </div>
    </div>
  );
}

function PayableCell({ row }: { row: SubcontractorSettlementRow }) {
  const payable = settlementPayable(row);
  const paidMismatch =
    row.payment_status === "paid" &&
    row.paid_amount != null &&
    Math.abs(asSettlementNumber(row.paid_amount) - payable) > 0.01;

  return (
    <span className="block text-right">
      <MoneyCell value={formatCurrency(payable)} bold />
      {paidMismatch && (
        <span className="mt-0.5 block text-[9px] font-normal tabular-nums whitespace-nowrap text-amber-700">
          Paid {formatCurrency(asSettlementNumber(row.paid_amount))}
        </span>
      )}
    </span>
  );
}

function SubcontractorCell({ row }: { row: SubcontractorSettlementRow }) {
  if (row.id) {
    return (
      <Link
        to={`/earnings/subcontractors/settlements/${row.id}`}
        className="block truncate text-xs font-semibold text-brand hover:underline"
        title={row.legal_name}
      >
        {row.legal_name}
      </Link>
    );
  }
  return (
    <span
      className="block truncate text-xs font-semibold text-ink"
      title="Refresh settlements to open detail"
    >
      {row.legal_name}
    </span>
  );
}

type SettlementsTableProps = {
  rows: SubcontractorSettlementRow[];
  loading?: boolean;
  isError?: boolean;
  showEmpty?: boolean;
  openMenuRowKey: string | null;
  markPaidPending?: boolean;
  onActionMenuToggle: (rowKey: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  onRefresh: () => void;
};

function GridHeader() {
  const headers: { label: string; align?: "right" | "center" }[] = [
    { label: "", align: "center" },
    { label: "Subcontractor" },
    { label: "Drivers", align: "right" },
    { label: "Gross incl. tips", align: "right" },
    { label: "Commission", align: "right" },
    { label: "Payable", align: "right" },
    { label: "Status" },
    { label: "", align: "center" },
  ];

  return (
    <div
      className="sticky top-0 z-10 grid min-w-[640px] border-b border-border/60 backdrop-blur-sm"
      style={{ gridTemplateColumns: GRID_COLS }}
    >
      {headers.map((h, i) => (
        <div
          key={`${h.label}-${i}`}
          className={`${headerCellClass} ${h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : ""}`}
        >
          {i === 0 || i === headers.length - 1 ? <span className="sr-only">{i === 0 ? "Expand" : "Actions"}</span> : h.label}
        </div>
      ))}
    </div>
  );
}

function SettlementGridRow({
  row,
  rowKey,
  isMenuOpen,
  markPaidPending,
  onActionMenuToggle,
  expanded,
  onToggleExpand,
}: {
  row: SubcontractorSettlementRow;
  rowKey: string;
  isMenuOpen: boolean;
  markPaidPending?: boolean;
  onActionMenuToggle: (rowKey: string, event: React.MouseEvent<HTMLButtonElement>) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const dimmed = !row.id;

  return (
    <Fragment>
      <div
        className={`${rowBaseClass} min-w-[640px] ${expanded ? "bg-slate-50/60" : ""} ${dimmed ? "opacity-75" : ""}`}
        style={{ gridTemplateColumns: GRID_COLS }}
      >
        <div className={`${bodyCellClass} flex items-center justify-center`}>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 transition-colors duration-150 hover:bg-slate-100 hover:text-brand"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            <ChevronIcon className="h-3.5 w-3.5" expanded={expanded} />
          </button>
        </div>
        <div className={bodyCellClass}>
          <SubcontractorCell row={row} />
        </div>
        <div className={`${bodyCellClass} text-right`}>
          <MoneyCell value={String(row.driver_payout_count ?? "—")} />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asSettlementNumber(row.total_gross_income))} />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asSettlementNumber(row.total_commission))} />
        </div>
        <div className={bodyCellClass}>
          <PayableCell row={row} />
        </div>
        <div className={bodyCellClass}>
          <StatusBadge row={row} />
        </div>
        <div className={`${bodyCellClass} flex items-center justify-center px-0`}>
          <SettlementRowActions
            row={row}
            isActionMenuOpen={isMenuOpen}
            disabled={markPaidPending}
            onActionMenuToggle={(e) => onActionMenuToggle(rowKey, e)}
          />
        </div>
      </div>
      {expanded && (
        <div className="min-w-[640px]">
          <SettlementRowDetailsPanel row={row} />
        </div>
      )}
    </Fragment>
  );
}

export function SettlementsTable({
  rows,
  loading,
  isError,
  showEmpty,
  openMenuRowKey,
  markPaidPending,
  onActionMenuToggle,
  onRefresh,
}: SettlementsTableProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  function toggleExpand(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className={driversTableCard}>
      <div className="border-b border-border/60 px-4 py-3 sm:px-5">
        <h2 className="text-sm font-semibold text-ink">Settlements</h2>
        <p className="mt-0.5 text-xs text-ink-muted">Expand a row to view tips, fees, and adjustments.</p>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <span
            className="inline-block h-9 w-9 animate-spin rounded-full border-2 border-brand border-t-transparent"
            role="status"
            aria-label="Loading settlements"
          />
          <p className="text-sm text-ink-muted">Loading settlements…</p>
        </div>
      )}

      {!loading && isError && (
        <EmptyState
          title="Failed to load settlements"
          description="Check your connection and try refreshing."
          action={{ label: "Refresh settlements", onClick: onRefresh }}
          className="border-0 shadow-none"
        />
      )}

      {!loading && !isError && showEmpty && (
        <EmptyState
          title="No settlements for this period yet"
          description="Import earnings or click Refresh settlements to load data."
          illustration={<DocumentIcon className="mx-auto h-12 w-12" />}
          action={{ label: "Refresh settlements", onClick: onRefresh }}
          className="border-0 shadow-none"
        />
      )}

      {!loading && !isError && !showEmpty && rows.length > 0 && (
        <div className={scrollShellClass}>
          <GridHeader />
          {rows.map((row) => {
            const rowKey = settlementRowKey(row);
            return (
              <SettlementGridRow
                key={rowKey}
                row={row}
                rowKey={rowKey}
                isMenuOpen={openMenuRowKey === rowKey}
                markPaidPending={markPaidPending}
                onActionMenuToggle={onActionMenuToggle}
                expanded={expandedKeys.has(rowKey)}
                onToggleExpand={() => toggleExpand(rowKey)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
