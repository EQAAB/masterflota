import { useMemo, useState } from "react";

import { Link, useNavigate } from "react-router-dom";

import type { ConsolidatedDriverPayout, PayoutListItem } from "../../../api/earnings";

import { ConfirmDialog } from "../../UI/ConfirmDialog";

import { tableCell, tableRow, tableRowExpandable } from "../../../theme/classNames";

import { formatCurrency } from "../../../utils/currency";

import { PayoutPagination } from "./PayoutPagination";

import { formatConsolidatedPeriod, tableTaxDisplay } from "./payoutBreakdownUtils";



type UnifiedPayoutsTableProps = {

  rows: ConsolidatedDriverPayout[];

  isLoading: boolean;

  isPaying: boolean;

  payingDriverId: string | null;

  weekStart: string;

  weekEnd: string;

  payableCount: number;

  onPayDriver: (driverId: string) => void | Promise<void>;

  onPayAll: () => void | Promise<void>;

  onOpenDebtActions?: (row: PayoutListItem) => void;

  onOpenCustomFees?: (row: PayoutListItem) => void;

  onOpenReleaseHold?: (row: PayoutListItem) => void;

};



const PAGE_SIZE = 25;



const STATUS_LABELS: Record<string, string> = {

  payable: "Pending",

  paid: "Paid",

  debt: "Debt",

  hold: "On hold",

  partial: "Partial",

  mixed: "Mixed",

};



function statusClass(status: string): string {

  switch (status) {

    case "payable":

      return "bg-amber-50 text-amber-900 ring-amber-200/80";

    case "paid":

      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";

    case "debt":

      return "bg-rose-50 text-rose-800 ring-rose-200/80";

    case "hold":

      return "bg-amber-50 text-amber-900 ring-amber-200/80";

    default:

      return "bg-slate-50 text-slate-700 ring-slate-200/80";

  }

}



function toNum(v: string | undefined | null): number {

  const n = Number(v ?? 0);

  return Number.isFinite(n) ? n : 0;

}



function payoutDetailsUrl(row: ConsolidatedDriverPayout, weekStart: string, weekEnd: string): string {

  const from = encodeURIComponent(weekStart);

  const to = encodeURIComponent(weekEnd);

  return `/earnings/payouts/${row.driver_id}?from=${from}&to=${to}`;

}



function RowActionsMenu({

  row,

  weekStart,

  weekEnd,

  onPay,

  disabled,

}: {

  row: ConsolidatedDriverPayout;

  weekStart: string;

  weekEnd: string;

  onPay: () => void;

  disabled: boolean;

}) {

  const [open, setOpen] = useState(false);

  const detailsUrl = payoutDetailsUrl(row, weekStart, weekEnd);

  return (

    <div className="relative inline-block">

      <button

        type="button"

        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-ink"

        aria-label="Row actions"

        onClick={(e) => {

          e.stopPropagation();

          setOpen((v) => !v);

        }}

      >

        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>

          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />

        </svg>

      </button>

      {open && (

        <>

          <button

            type="button"

            className="fixed inset-0 z-10 cursor-default"

            aria-label="Close menu"

            onClick={(e) => {

              e.stopPropagation();

              setOpen(false);

            }}

          />

          <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-lg border border-border/80 bg-white py-1 shadow-lg">

            <Link

              to={detailsUrl}

              className="block px-3 py-1.5 text-xs text-ink hover:bg-slate-50"

              onClick={(e) => e.stopPropagation()}

            >

              View combined details

            </Link>

            <Link

              to={`/drivers/${row.driver_id}`}

              className="block px-3 py-1.5 text-xs text-ink hover:bg-slate-50"

              onClick={(e) => e.stopPropagation()}

            >

              View driver

            </Link>

            {row.can_pay && (

              <button

                type="button"

                className="block w-full px-3 py-1.5 text-left text-xs text-ink hover:bg-slate-50 disabled:opacity-50"

                disabled={disabled}

                onClick={(e) => {

                  e.stopPropagation();

                  setOpen(false);

                  onPay();

                }}

              >

                Pay now

              </button>

            )}

          </div>

        </>

      )}

    </div>

  );

}



export function UnifiedPayoutsTable({

  rows,

  isLoading,

  isPaying,

  payingDriverId,

  weekStart,

  weekEnd,

  payableCount,

  onPayDriver,

  onPayAll,

}: UnifiedPayoutsTableProps) {

  const navigate = useNavigate();

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [page, setPage] = useState(1);

  const [payConfirm, setPayConfirm] = useState<null | { kind: "one"; driverId: string } | { kind: "all" }>(

    null,

  );



  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  const safePage = Math.min(page, totalPages);

  const pageRows = useMemo(() => {

    const start = (safePage - 1) * PAGE_SIZE;

    return rows.slice(start, start + PAGE_SIZE);

  }, [rows, safePage]);



  const toggleSelect = (driverId: string) => {

    setSelected((prev) => {

      const next = new Set(prev);

      if (next.has(driverId)) next.delete(driverId);

      else next.add(driverId);

      return next;

    });

  };



  const openDetails = (row: ConsolidatedDriverPayout) => {

    navigate(payoutDetailsUrl(row, weekStart, weekEnd));

  };



  if (isLoading) {

    return <div className="fm-card p-12 text-center text-sm text-ink-muted">Loading payouts…</div>;

  }



  if (!weekStart || !weekEnd) {

    return (

      <div className="fm-card p-12 text-center text-sm text-ink-muted">

        Select a payment week to view unified driver payouts.

      </div>

    );

  }



  if (rows.length === 0) {

    return (

      <div className="fm-card p-12 text-center text-sm text-ink-muted">

        No driver payouts for {weekStart} – {weekEnd}. Try adjusting filters or the date range.

      </div>

    );

  }



  return (

    <>

      <div className="fm-card min-w-0 overflow-hidden p-0">

        <div className="overflow-x-auto min-w-0">

          <table className="fm-payout-table w-full min-w-[1020px] text-left text-sm">

            <thead>

              <tr>

                <th className={`${tableCell} !py-3 w-8`} />

                <th className={`${tableCell} !py-3 w-8`}>

                  <span className="sr-only">Select</span>

                </th>

                <th className={`${tableCell} !py-3`}>Driver</th>

                <th className={`${tableCell} !py-3`}>Period</th>

                <th className={`${tableCell} !py-3 text-right`}>Gross (combined)</th>

                <th className={`${tableCell} !py-3 text-right`}>Fleet / sub</th>

                <th className={`${tableCell} !py-3 text-right`}>Taxes</th>

                <th className={`${tableCell} !py-3 text-right`}>Net payout</th>

                <th className={`${tableCell} !py-3`}>Status</th>

                <th className={`${tableCell} !py-3 text-right`}>Actions</th>

              </tr>

            </thead>

            <tbody>

              {pageRows.map((row, idx) => {

                const isSelected = selected.has(row.driver_id);

                const total = toNum(row.total_amount);

                const isDebt = row.consolidated_status === "debt" || total < 0;

                const taxDisplay = tableTaxDisplay(row);

                return (

                  <tr

                    key={row.driver_id}

                    className={`fm-payout-row ${tableRow} ${tableRowExpandable} cursor-pointer border-b border-border/80 transition-colors hover:bg-brand-mint/15 ${

                      idx % 2 === 1 ? "bg-slate-50/35" : "bg-white"

                    }`}

                    onClick={() => openDetails(row)}

                  >

                    <td className={`${tableCell} !py-3.5`}>

                      <span

                        className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-xs text-ink-muted"

                        aria-hidden

                      >

                        →

                      </span>

                    </td>

                    <td className={`${tableCell} !py-3.5`} onClick={(e) => e.stopPropagation()}>

                      <input

                        type="checkbox"

                        className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand/30"

                        checked={isSelected}

                        aria-label={`Select ${row.first_name} ${row.last_name}`}

                        onChange={() => toggleSelect(row.driver_id)}

                      />

                    </td>

                    <td className={`${tableCell} !py-3.5 min-w-[160px]`}>

                      <span className="font-semibold text-ink group-hover:text-brand">

                        {row.first_name} {row.last_name}

                      </span>

                      {row.phone && <p className="mt-0.5 text-xs text-ink-muted">{row.phone}</p>}

                    </td>

                    <td className={`${tableCell} !py-3.5 text-xs text-ink-muted whitespace-nowrap`}>

                      {formatConsolidatedPeriod(row)}

                    </td>

                    <td className={`${tableCell} !py-3.5 text-right tabular-nums font-medium text-ink`}>

                      {formatCurrency(toNum(row.total_gross))}

                    </td>

                    <td className={`${tableCell} !py-3.5 text-right tabular-nums text-ink-muted`}>

                      {formatCurrency(toNum(row.total_fees))}

                    </td>

                    <td className={`${tableCell} !py-3.5 text-right tabular-nums text-rose-700/90`}>

                      {taxDisplay != null ? formatCurrency(taxDisplay) : "—"}

                    </td>

                    <td

                      className={`${tableCell} !py-3.5 text-right tabular-nums text-base font-bold ${

                        isDebt ? "text-rose-800" : "text-emerald-900"

                      }`}

                    >

                      {formatCurrency(total)}

                    </td>

                    <td className={`${tableCell} !py-3.5`}>

                      <span

                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(row.consolidated_status)}`}

                      >

                        {STATUS_LABELS[row.consolidated_status] ?? row.consolidated_status}

                      </span>

                    </td>

                    <td className={`${tableCell} !py-3.5 text-right`} onClick={(e) => e.stopPropagation()}>

                      <div className="inline-flex items-center justify-end gap-1">

                        {row.can_pay ? (

                          <button

                            type="button"

                            disabled={isPaying}

                            className="fm-payout-pay-btn"

                            onClick={() => setPayConfirm({ kind: "one", driverId: row.driver_id })}

                          >

                            {payingDriverId === row.driver_id && isPaying ? "Paying…" : "Pay now"}

                          </button>

                        ) : (

                          <span className="text-xs text-ink-muted px-2">—</span>

                        )}

                        <RowActionsMenu

                          row={row}

                          weekStart={weekStart}

                          weekEnd={weekEnd}

                          disabled={isPaying}

                          onPay={() => setPayConfirm({ kind: "one", driverId: row.driver_id })}

                        />

                      </div>

                    </td>

                  </tr>

                );

              })}

            </tbody>

          </table>

        </div>

      </div>



      {rows.length > PAGE_SIZE && (

        <div className="mt-3">

          <PayoutPagination

            page={safePage}

            totalPages={totalPages}

            total={rows.length}

            onPageChange={setPage}

          />

        </div>

      )}



      <footer className="fm-payout-action-bar shrink-0">

        <p className="min-w-0 text-sm text-ink-muted">

          <span className="font-medium text-ink">{rows.length}</span> driver{rows.length === 1 ? "" : "s"}

          <span className="mx-2 text-slate-300">·</span>

          <span className="font-medium text-emerald-800">{payableCount}</span> ready to pay

        </p>

        <button

          type="button"

          disabled={isPaying || payableCount === 0}

          className="fm-payout-pay-btn !px-5 !py-2 !text-sm"

          onClick={() => setPayConfirm({ kind: "all" })}

        >

          {isPaying && payingDriverId === null ? "Paying all…" : `Pay all (${payableCount})`}

        </button>

      </footer>



      <ConfirmDialog

        open={payConfirm != null}

        onClose={() => !isPaying && setPayConfirm(null)}

        title={payConfirm?.kind === "all" ? "Pay all drivers?" : "Pay this driver?"}

        description={

          payConfirm?.kind === "all"

            ? `Mark all ${payableCount} payable driver(s) as paid for ${weekStart} – ${weekEnd}.`

            : "Mark all platform payouts for this driver as paid in one payment."

        }

        confirmLabel="Confirm payment"

        cancelLabel="Cancel"

        isLoading={isPaying}

        onConfirm={async () => {

          if (!payConfirm) return;

          if (payConfirm.kind === "all") await onPayAll();

          else await onPayDriver(payConfirm.driverId);

          setPayConfirm(null);

        }}

      />

    </>

  );

}


