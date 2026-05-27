import { Fragment, useState } from "react";
import { Link } from "react-router-dom";
import type { SubcontractorSettlementRow } from "../../../api/earnings";
import { formatCurrency } from "../../../utils/currency";
import { transitionDefault } from "../../../theme/classNames";
import { EmptyState } from "../../theme/EmptyState";
import { SettlementRowActions } from "./SettlementRowActions";
import {
  asSettlementNumber,
  settlementPayable,
  settlementRowKey,
  settlementStatusDisplay,
} from "./settlementsDisplayUtils";

/**
 * Chevron | Subcontractor 36% | Drivers 9% | Gross 15% | Commission 15% | Payable 14% | Status + actions
 */
const GRID_COLS = "2rem 36fr 9fr 15fr 15fr 14fr minmax(120px, 11fr)";

const TABLE_MIN_WIDTH = "920px";

const tnumStyle = { fontFeatureSettings: '"tnum"' } as const;

const scrollShellClass =
  "max-h-[68vh] overflow-y-auto overflow-x-auto overscroll-y-contain scroll-smooth " +
  "[scrollbar-width:thin] [scrollbar-color:rgb(148_163_184)_rgb(241_245_249)]";

const tableCardClass =
  `overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-soft ${transitionDefault}`;

/** Unified header row — single continuous background on the row container */
const headerRowClass =
  "sticky top-0 z-10 grid min-h-[40px] items-center border-b border-slate-200 bg-[#F8FAFC]";

const headerCellBase =
  "px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wide text-slate-600 leading-none";

const bodyRowClass =
  `grid min-h-[58px] items-center border-b border-slate-100/90 bg-white transition-colors duration-150 ease-out hover:bg-slate-50/80 ${transitionDefault}`;

const bodyCellClass = "flex h-full min-h-[58px] items-center px-2.5";

const bodyCellRightClass = `${bodyCellClass} justify-end`;

const moneyCellClass =
  "whitespace-nowrap text-sm font-medium tabular-nums text-slate-800 leading-none";

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
  const { label, className } = settlementStatusDisplay(row);
  return (
    <span
      className={`inline-flex h-7 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-medium leading-none ${className}`}
    >
      {label}
    </span>
  );
}

function MoneyCell({ value, bold }: { value: string; bold?: boolean }) {
  return (
    <span className={`${moneyCellClass} ${bold ? "font-bold text-slate-900" : ""}`} style={tnumStyle}>
      {value}
    </span>
  );
}

type DetailTint = "emerald" | "slate" | "orange" | "blue" | "purple" | "indigo" | "teal";

const detailTintClass: Record<DetailTint, string> = {
  emerald: "border-emerald-100/80 bg-emerald-50/90",
  slate: "border-slate-200/80 bg-slate-50/90",
  orange: "border-orange-100/80 bg-orange-50/90",
  blue: "border-blue-100/80 bg-blue-50/90",
  purple: "border-purple-100/80 bg-purple-50/90",
  indigo: "border-indigo-100/80 bg-indigo-50/90",
  teal: "border-teal-100/80 bg-teal-50/90",
};

function DetailField({ label, value, tint = "slate" }: { label: string; value: string; tint?: DetailTint }) {
  return (
    <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${detailTintClass[tint]}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-slate-900 whitespace-nowrap" style={tnumStyle}>
        {value}
      </p>
    </div>
  );
}

function SettlementRowDetailsPanel({ row }: { row: SubcontractorSettlementRow }) {
  return (
    <div className="border-b border-slate-200/60 bg-slate-50/80 px-4 py-3.5 sm:px-5">
      <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
        Additional breakdown
      </p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
        <DetailField label="Tips" tint="emerald" value={formatCurrency(asSettlementNumber(row.total_tips))} />
        <DetailField label="Vehicle rent" tint="slate" value={formatCurrency(asSettlementNumber(row.total_vehicle_rent))} />
        <DetailField label="Acct. fee" tint="teal" value={formatCurrency(asSettlementNumber(row.total_account_opening_fee))} />
        <DetailField label="Platform fee" tint="orange" value={formatCurrency(asSettlementNumber(row.total_platform_fees))} />
        <DetailField label="Daily cash" tint="blue" value={formatCurrency(asSettlementNumber(row.total_daily_cash))} />
        <DetailField label="Custom ded." tint="purple" value={formatCurrency(asSettlementNumber(row.total_custom_deductions))} />
        <DetailField label="Custom add." tint="indigo" value={formatCurrency(asSettlementNumber(row.total_custom_additions))} />
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
    <span className="text-right">
      <MoneyCell value={formatCurrency(payable)} bold />
      {paidMismatch && (
        <span
          className="mt-1 block text-[10px] font-normal tabular-nums whitespace-nowrap text-amber-700"
          style={tnumStyle}
        >
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
        className="block truncate text-sm font-semibold text-brand transition-colors hover:text-brand/80 hover:underline"
        title={row.legal_name}
      >
        {row.legal_name}
      </Link>
    );
  }
  return (
    <span className="block truncate text-sm font-semibold text-slate-800" title="Refresh settlements to open detail">
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
  const headers: { label: string; align: "left" | "right" | "center"; srOnly?: boolean }[] = [
    { label: "Expand", align: "center", srOnly: true },
    { label: "Subcontractor", align: "left" },
    { label: "Drivers", align: "right" },
    { label: "Gross incl. tips", align: "right" },
    { label: "Commission", align: "right" },
    { label: "Payable", align: "right" },
    { label: "Status", align: "right" },
  ];

  return (
    <div className={headerRowClass} style={{ gridTemplateColumns: GRID_COLS, minWidth: TABLE_MIN_WIDTH }}>
      {headers.map((h, i) => (
        <div
          key={`${h.label}-${i}`}
          className={`${headerCellBase} ${h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : ""}`}
        >
          {h.srOnly ? <span className="sr-only">{h.label}</span> : h.label}
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
        className={`${bodyRowClass} ${expanded ? "!bg-slate-50/70" : ""} ${dimmed ? "opacity-80" : ""}`}
        style={{ gridTemplateColumns: GRID_COLS, minWidth: TABLE_MIN_WIDTH }}
      >
        <div className={`${bodyCellClass} justify-center !pl-2 !pr-1`}>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-all duration-150 hover:bg-slate-100 hover:text-brand"
            onClick={onToggleExpand}
            aria-expanded={expanded}
            aria-label={expanded ? "Hide details" : "Show details"}
          >
            <ChevronIcon className="h-4 w-4" expanded={expanded} />
          </button>
        </div>
        <div className={`${bodyCellClass} min-w-0 gap-0`}>
          <SubcontractorCell row={row} />
        </div>
        <div className={bodyCellRightClass}>
          <MoneyCell value={String(row.driver_payout_count ?? "—")} />
        </div>
        <div className={bodyCellRightClass}>
          <MoneyCell value={formatCurrency(asSettlementNumber(row.total_gross_income))} />
        </div>
        <div className={bodyCellRightClass}>
          <MoneyCell value={formatCurrency(asSettlementNumber(row.total_commission))} />
        </div>
        <div className={bodyCellRightClass}>
          <PayableCell row={row} />
        </div>
        <div className={`${bodyCellClass} justify-end !pr-2`}>
          <div className="flex items-center justify-end gap-1.5">
            <StatusBadge row={row} />
            <SettlementRowActions
              row={row}
              isActionMenuOpen={isMenuOpen}
              disabled={markPaidPending}
              onActionMenuToggle={(e) => onActionMenuToggle(rowKey, e)}
            />
          </div>
        </div>
      </div>
      {expanded && (
        <div style={{ minWidth: TABLE_MIN_WIDTH }}>
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
    <div className={tableCardClass}>
      <div className="border-b border-slate-100 px-4 py-2.5 sm:px-4">
        <h2 className="text-sm font-semibold text-slate-800">Settlements</h2>
        <p className="mt-0.5 text-xs text-slate-500">Expand a row for tips, fees, and adjustments.</p>
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
          illustration={<DocumentIcon className="mx-auto h-12 w-12 text-brand/40" />}
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
