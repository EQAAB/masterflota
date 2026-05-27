import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { driversTableCard, tableRow, tableRowExpandedAccent } from "../../../theme/classNames";
import { EmptyState } from "../../theme/EmptyState";
import { SettlementRowActions } from "./SettlementRowActions";
import {
  asSettlementNumber,
  settlementPayable,
  settlementRowKey,
  settlementStatusDisplay,
} from "./settlementsDisplayUtils";

/** Full desktop: 14 data cols + actions */
const FULL_GRID_COLS =
  "minmax(0,1.05fr) minmax(0,0.42fr) minmax(0,0.6fr) minmax(0,0.5fr) minmax(0,0.55fr) " +
  "minmax(0,0.55fr) minmax(0,0.48fr) minmax(0,0.48fr) minmax(0,0.48fr) minmax(0,0.48fr) " +
  "minmax(0,0.48fr) minmax(0,0.48fr) minmax(0,0.6fr) minmax(0,0.55fr) 2.75rem";

/** Compact: summary cols + actions */
const COMPACT_GRID_COLS =
  "minmax(0,1.15fr) minmax(0,0.42fr) minmax(0,0.62fr) minmax(0,0.62fr) minmax(0,0.58fr) 2.75rem";

const scrollShellClass =
  "max-h-[65vh] overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth " +
  "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)]";

const headerCellClass =
  "px-1.5 py-2 text-[10px] font-medium uppercase tracking-wide text-ink-muted bg-surface/95";

const bodyCellClass = "px-1.5 py-1.5 min-w-0 align-top";

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
  const { label, className } = settlementStatusDisplay(row);
  return (
    <span
      className={`inline-flex max-w-full rounded-full px-1.5 py-0.5 text-[9px] font-medium leading-tight xl:text-[10px] ${className}`}
    >
      {label}
    </span>
  );
}

function MoneyCell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <span
      className={`block text-right tabular-nums leading-snug break-words text-[10px] xl:text-[11px] ${
        bold ? "font-semibold text-ink" : "font-medium text-ink"
      }`}
    >
      {value}
    </span>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums text-ink break-words">{value}</p>
    </div>
  );
}

function SettlementRowDetailsPanel({ row }: { row: SubcontractorSettlementRow }) {
  return (
    <div className="border-t border-border/60 bg-surface/30 px-3 py-3 sm:px-4">
      <p className="mb-3 text-xs font-semibold text-ink-muted">Fee breakdown</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Tips" value={formatCurrency(asSettlementNumber(row.total_tips))} />
        <DetailField label="Commission" value={formatCurrency(asSettlementNumber(row.total_commission))} />
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
        <span className="block text-[9px] font-normal text-amber-700 xl:text-[10px]">
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
        className="block truncate text-[11px] font-semibold text-brand hover:underline xl:text-xs"
        title={row.legal_name}
      >
        {row.legal_name}
      </Link>
    );
  }
  return (
    <span className="block truncate text-[11px] font-semibold text-ink xl:text-xs" title="Refresh settlements to open detail">
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

function FullGridHeader() {
  const headers = [
    "Subcontractor",
    "Drivers",
    "Gross incl. tips",
    "Tips",
    "Commission",
    "Vehicle rent",
    "Acct. fee",
    "Platform fee",
    "Daily cash",
    "Custom ded.",
    "Custom add.",
    "Payable",
    "Status",
  ];
  return (
    <div
      className="sticky top-0 z-10 hidden xl:grid border-b border-border backdrop-blur"
      style={{ gridTemplateColumns: FULL_GRID_COLS }}
    >
      {headers.map((label, i) => (
        <div key={label} className={`${headerCellClass} ${i > 0 && i < 12 ? "text-right" : ""}`}>
          {label}
        </div>
      ))}
      <div className={`${headerCellClass} flex items-center justify-center px-0`} aria-hidden>
        <span className="sr-only">Actions</span>
      </div>
    </div>
  );
}

function CompactGridHeader() {
  const headers = ["Subcontractor", "Drivers", "Gross incl. tips", "Payable", "Status"];
  return (
    <div
      className="sticky top-0 z-10 grid xl:hidden border-b border-border backdrop-blur"
      style={{ gridTemplateColumns: COMPACT_GRID_COLS }}
    >
      {headers.map((label, i) => (
        <div key={label} className={`${headerCellClass} ${i > 0 && i < 4 ? "text-right" : ""}`}>
          {label}
        </div>
      ))}
      <div className={`${headerCellClass} flex items-center justify-center px-0`} aria-hidden>
        <span className="sr-only">Actions</span>
      </div>
    </div>
  );
}

function FullGridRow({
  row,
  rowKey,
  isMenuOpen,
  markPaidPending,
  onActionMenuToggle,
}: {
  row: SubcontractorSettlementRow;
  rowKey: string;
  isMenuOpen: boolean;
  markPaidPending?: boolean;
  onActionMenuToggle: (rowKey: string, event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const dimmed = !row.id;

  return (
    <div
      className={`hidden xl:grid border-b border-border/60 ${tableRow} ${dimmed ? "opacity-70" : ""}`}
      style={{ gridTemplateColumns: FULL_GRID_COLS }}
    >
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
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_tips))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_commission))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_vehicle_rent))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_account_opening_fee))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_platform_fees))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_daily_cash))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_custom_deductions))} />
      </div>
      <div className={bodyCellClass}>
        <MoneyCell value={formatCurrency(asSettlementNumber(row.total_custom_additions))} />
      </div>
      <div className={bodyCellClass}>
        <PayableCell row={row} />
      </div>
      <div className={bodyCellClass}>
        <StatusBadge row={row} />
      </div>
      <div className={`${bodyCellClass} flex items-start justify-center px-0`}>
        <SettlementRowActions
          row={row}
          isActionMenuOpen={isMenuOpen}
          disabled={markPaidPending}
          onActionMenuToggle={(e) => onActionMenuToggle(rowKey, e)}
        />
      </div>
    </div>
  );
}

function CompactGridRow({
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
        className={`grid xl:hidden border-b border-border/60 ${tableRow} ${expanded ? tableRowExpandedAccent : ""} ${dimmed ? "opacity-70" : ""}`}
        style={{ gridTemplateColumns: COMPACT_GRID_COLS }}
      >
        <div className={`${bodyCellClass} flex min-w-0 items-start gap-1`}>
          <button
            type="button"
            className="mt-0.5 shrink-0 rounded p-0.5 text-ink-muted hover:bg-surface hover:text-ink"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide fee breakdown" : "Show fee breakdown"}
          >
            <ChevronIcon className="h-3.5 w-3.5" expanded={expanded} />
          </button>
          <div className="min-w-0 flex-1">
            <SubcontractorCell row={row} />
          </div>
        </div>
        <div className={`${bodyCellClass} text-right`}>
          <MoneyCell value={String(row.driver_payout_count ?? "—")} />
        </div>
        <div className={bodyCellClass}>
          <MoneyCell value={formatCurrency(asSettlementNumber(row.total_gross_income))} />
        </div>
        <div className={bodyCellClass}>
          <PayableCell row={row} />
        </div>
        <div className={bodyCellClass}>
          <StatusBadge row={row} />
        </div>
        <div className={`${bodyCellClass} flex items-start justify-center px-0`}>
          <SettlementRowActions
            row={row}
            isActionMenuOpen={isMenuOpen}
            disabled={markPaidPending}
            onActionMenuToggle={(e) => onActionMenuToggle(rowKey, e)}
          />
        </div>
      </div>
      {expanded && (
        <div className="xl:hidden">
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
          <FullGridHeader />
          <CompactGridHeader />
          {rows.map((row) => {
            const rowKey = settlementRowKey(row);
            const isMenuOpen = openMenuRowKey === rowKey;
            const expanded = expandedKeys.has(rowKey);
            return (
              <Fragment key={rowKey}>
                <FullGridRow
                  row={row}
                  rowKey={rowKey}
                  isMenuOpen={isMenuOpen}
                  markPaidPending={markPaidPending}
                  onActionMenuToggle={onActionMenuToggle}
                />
                <CompactGridRow
                  row={row}
                  rowKey={rowKey}
                  isMenuOpen={isMenuOpen}
                  markPaidPending={markPaidPending}
                  onActionMenuToggle={onActionMenuToggle}
                  expanded={expanded}
                  onToggleExpand={() => toggleExpand(rowKey)}
                />
              </Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
