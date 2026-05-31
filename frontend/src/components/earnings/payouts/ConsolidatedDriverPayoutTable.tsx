import { Fragment, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ConsolidatedDriverPayout } from "../../../api/earnings";
import { PlatformBadge } from "../../drivers/platformLogos";
import { ConfirmDialog } from "../../UI/ConfirmDialog";
import {
  tableCell,
  tableRow,
  tableRowExpandable,
  tableRowExpandedAccent,
} from "../../../theme/classNames";
import { formatCurrency } from "../../../utils/currency";
import { earningsPlatformLabel } from "../../../utils/earningsPlatformLabel";
import { PayoutPageKpiCards } from "./PayoutPageKpiCards";

type ConsolidatedDriverPayoutTableProps = {
  rows: ConsolidatedDriverPayout[];
  isLoading: boolean;
  isPaying: boolean;
  payingDriverId: string | null;
  weekStart: string;
  weekEnd: string;
  weekTotal?: string;
  payableCount: number;
  paidCount?: number;
  onPayDriver: (driverId: string) => void | Promise<void>;
  onPayAll: () => void | Promise<void>;
};

const STATUS_LABELS: Record<string, string> = {
  payable: "Ready to pay",
  paid: "Paid",
  debt: "Debt",
  hold: "On hold",
  partial: "Partial",
  mixed: "Mixed",
};

function statusClass(status: string): string {
  switch (status) {
    case "payable":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
    case "paid":
      return "bg-slate-100 text-slate-700 ring-slate-200/80";
    case "debt":
      return "bg-rose-50 text-rose-800 ring-rose-200/80";
    case "hold":
      return "bg-amber-50 text-amber-900 ring-amber-200/80";
    default:
      return "bg-slate-50 text-slate-700 ring-slate-200/80";
  }
}

function toNum(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function ConsolidatedDriverPayoutTable({
  rows,
  isLoading,
  isPaying,
  payingDriverId,
  weekStart,
  weekEnd,
  weekTotal,
  payableCount,
  paidCount: paidCountProp,
  onPayDriver,
  onPayAll,
}: ConsolidatedDriverPayoutTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [payConfirm, setPayConfirm] = useState<null | { kind: "one"; driverId: string } | { kind: "all" }>(
    null,
  );

  const pendingTotal = useMemo(
    () => rows.reduce((sum, r) => (r.can_pay ? sum + toNum(r.total_amount) : sum), 0),
    [rows],
  );
  const paidCount = paidCountProp ?? rows.filter((r) => r.consolidated_status === "paid").length;

  const toggleExpand = (driverId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(driverId)) next.delete(driverId);
      else next.add(driverId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="fm-card p-10 text-center text-sm text-ink-muted">Loading consolidated payouts…</div>
    );
  }

  if (!weekStart || !weekEnd) {
    return (
      <div className="fm-card p-10 text-center text-sm text-ink-muted">
        Select a payment week (start and end dates) to view consolidated payouts.
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="fm-card p-10 text-center text-sm text-ink-muted">
        No direct-driver payouts for {weekStart} – {weekEnd}.
      </div>
    );
  }

  return (
    <>
      <PayoutPageKpiCards
        showingLabel="Drivers"
        showingValue={rows.length.toLocaleString()}
        showingSubtitle={weekTotal ? `Week total ${weekTotal} RON` : `${weekStart} – ${weekEnd}`}
        pendingTotal={pendingTotal}
        paidCount={paidCount}
      />

      <div className="fm-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="fm-payout-table w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr>
                <th className={`${tableCell} !py-3 w-8`} />
                <th className={`${tableCell} !py-3`}>Driver</th>
                <th className={`${tableCell} !py-3`}>Platforms</th>
                <th className={`${tableCell} !py-3 text-right`}>Total payout</th>
                <th className={`${tableCell} !py-3`}>Status</th>
                <th className={`${tableCell} !py-3 text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const isOpen = expanded.has(row.driver_id);
                const total = toNum(row.total_amount);
                const isDebt = row.consolidated_status === "debt" || total < 0;
                return (
                  <Fragment key={row.driver_id}>
                    <tr
                      className={`fm-payout-row ${tableRow} ${tableRowExpandable} cursor-pointer border-b border-border/80 ${
                        idx % 2 === 1 ? "bg-slate-50/40" : "bg-white"
                      }`}
                      onClick={() => toggleExpand(row.driver_id)}
                    >
                      <td className={`${tableCell} !py-3.5`}>
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-ink-muted transition-colors ${
                            isOpen ? "bg-brand-mint/50 text-brand" : "bg-slate-100"
                          }`}
                          aria-hidden
                        >
                          {isOpen ? "▼" : "▶"}
                        </span>
                      </td>
                      <td className={`${tableCell} !py-3.5`}>
                        <Link
                          to={`/drivers/${row.driver_id}`}
                          className="font-semibold text-ink hover:text-brand hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {row.first_name} {row.last_name}
                        </Link>
                        {row.phone && (
                          <p className="mt-0.5 text-xs text-ink-muted">{row.phone}</p>
                        )}
                      </td>
                      <td className={`${tableCell} !py-3.5`}>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {row.platforms.map((p) => (
                            <PlatformBadge
                              key={p}
                              platform={p as "glovo" | "bolt" | "uber" | "bolt_taxi"}
                              compact
                            />
                          ))}
                        </div>
                      </td>
                      <td
                        className={`${tableCell} !py-3.5 text-right tabular-nums text-base font-bold ${
                          isDebt ? "text-rose-800" : "text-ink"
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
                        {row.paid_at && (
                          <p className="mt-1 text-[11px] text-ink-muted">
                            Paid {row.paid_at.slice(0, 10)}
                          </p>
                        )}
                      </td>
                      <td className={`${tableCell} !py-3.5 text-right`} onClick={(e) => e.stopPropagation()}>
                        {row.can_pay ? (
                          <button
                            type="button"
                            disabled={isPaying}
                            className="fm-payout-pay-btn"
                            onClick={() => setPayConfirm({ kind: "one", driverId: row.driver_id })}
                          >
                            {payingDriverId === row.driver_id && isPaying ? "Paying…" : "Pay driver"}
                          </button>
                        ) : (
                          <span className="text-xs text-ink-muted">—</span>
                        )}
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className={tableRowExpandedAccent}>
                        <td colSpan={6} className="border-0 p-0">
                          <div className="border-t border-border/70 bg-gradient-to-b from-slate-50/90 to-white px-4 py-4">
                            <p className="fm-payout-panel-title mb-3">Platform breakdown</p>
                            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {row.platform_lines.map((line) => (
                                <li
                                  key={line.payout_id}
                                  className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-white px-3 py-2 text-sm shadow-sm"
                                >
                                  <span className="font-medium text-ink">
                                    {earningsPlatformLabel(line.platform)}
                                    <span className="ml-2 text-[10px] font-normal capitalize text-ink-muted">
                                      {line.payment_status}
                                    </span>
                                  </span>
                                  <span className="font-semibold tabular-nums text-ink">
                                    {formatCurrency(toNum(line.net_driver_payout))}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-border/70 bg-white px-4 py-3 shadow-soft sm:flex-row sm:px-5">
        <p className="text-sm text-ink-muted">
          <span className="font-medium text-ink">{rows.length}</span> driver
          {rows.length === 1 ? "" : "s"}
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
            ? `Mark all ${payableCount} payable driver(s) as paid for ${weekStart} – ${weekEnd}. All platform payout rows will be updated.`
            : "Mark all platform payouts for this driver as paid in one consolidated payment."
        }
        confirmLabel="Confirm payment"
        cancelLabel="Cancel"
        isLoading={isPaying}
        onConfirm={async () => {
          if (!payConfirm) return;
          if (payConfirm.kind === "all") {
            await onPayAll();
          } else {
            await onPayDriver(payConfirm.driverId);
          }
          setPayConfirm(null);
        }}
      />
    </>
  );
}
