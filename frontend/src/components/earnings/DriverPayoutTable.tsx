import { Fragment, useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PayoutListItem, PayoutAssignmentDetail } from "../../api/earnings";
import { usePayoutSearch } from "../../hooks/usePayoutSearch";
import { ConfirmDialog } from "../UI/ConfirmDialog";
import {
  alertError,
  btnPrimary,
  btnSecondary,
  card,
  tableRow,
  tableRowAlert,
} from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";
import { HighlightText } from "./payouts/HighlightText";
import { PayoutExpandedDetails } from "./payouts/PayoutExpandedDetails";
import { PayoutRowActions } from "./payouts/PayoutRowActions";
import { PayoutStatusBadge } from "./payouts/PayoutStatusBadge";
import { PayoutTableSkeleton } from "./payouts/PayoutTableSkeleton";
import { PayoutTableToolbar } from "./payouts/PayoutTableToolbar";
import {
  findPayoutRow,
  includesQuery,
  isDebtStyleRow,
  isPayablePayoutRow,
  payoutCommissionTitle,
  payoutGlovoBreakdownTitle,
  periodLabel,
  toNum,
  vehicleRentDetailTitle,
} from "./payouts/payoutRowUtils";

type DriverPayoutTableProps = {
  rows: PayoutListItem[];
  detailsByPayoutId: Map<string, PayoutAssignmentDetail>;
  selectedIds: Set<string>;
  isLoading: boolean;
  isPaying: boolean;
  payingRowId: string | null;
  errorMessage?: string | null;
  onToggleSelection: (id: string) => void;
  onReplaceSelection: (ids: string[]) => void;
  onPayNow: (id: string) => void | Promise<void>;
  onPaySelected: (ids: string[]) => void | Promise<void>;
  onOpenDebtActions?: (row: PayoutListItem) => void;
  onOpenCustomFees?: (row: PayoutListItem) => void;
  onOpenReleaseHold?: (row: PayoutListItem) => void;
};

function getRowFlags(
  row: PayoutListItem,
  onOpenDebtActions?: (row: PayoutListItem) => void,
  onOpenCustomFees?: (row: PayoutListItem) => void,
  onOpenReleaseHold?: (row: PayoutListItem) => void,
) {
  const isDebtStyle = isDebtStyleRow(row);
  const debtBadgeAmount = Math.max(toNum(row.remaining_debt_amount), toNum(row.debt_amount));
  const showDebtBadge = isDebtStyle && (debtBadgeAmount > 0 || row.payment_status === "debt");
  const showPreviousDebtApplied =
    toNum(row.debt_applied_amount) > 0 &&
    !isDebtStyle &&
    (row.payment_status === "pending" ||
      row.payment_status === "paid" ||
      row.payment_status === "approved");
  const isPending = isPayablePayoutRow(row);
  const canDebtActions =
    !!onOpenDebtActions &&
    (row.payment_status === "debt" ||
      toNum(row.raw_net_amount) < 0 ||
      toNum(row.remaining_debt_amount) > 0 ||
      toNum(row.debt_amount) > 0);
  const canCustomFees =
    !!onOpenCustomFees && row.payment_status !== "paid" && row.payment_status !== "approved";
  const canReleaseHold =
    !!onOpenReleaseHold &&
    row.payment_status === "hold" &&
    !row.subcontractor_id &&
    !row.subcontractor_payout_id;
  return {
    isDebtStyle,
    debtBadgeAmount,
    showDebtBadge,
    showPreviousDebtApplied,
    isPending,
    canDebtActions,
    canCustomFees,
    canReleaseHold,
  };
}

export function DriverPayoutTable({
  rows,
  detailsByPayoutId,
  selectedIds,
  isLoading,
  isPaying,
  payingRowId,
  errorMessage,
  onToggleSelection,
  onReplaceSelection,
  onPayNow,
  onPaySelected,
  onOpenDebtActions,
  onOpenCustomFees,
  onOpenReleaseHold,
}: DriverPayoutTableProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [payConfirm, setPayConfirm] = useState<
    null | { kind: "one"; payoutId: string } | { kind: "many"; ids: string[] }
  >(null);

  const {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    statusFilter,
    setStatusFilter,
    filteredRows,
    totalCount,
    filteredCount,
    isFilterPending,
    clearSearch,
  } = usePayoutSearch(rows, detailsByPayoutId);

  const hasQuery = searchQuery.trim().length > 0 || statusFilter.length > 0;

  const pendingIds = useMemo(
    () => filteredRows.filter((r) => isPayablePayoutRow(r)).map((r) => r.id),
    [filteredRows],
  );
  const selectedPendingIds = pendingIds.filter((id) => selectedIds.has(id));
  const pendingTotal = filteredRows.reduce(
    (sum, r) => (isPayablePayoutRow(r) ? sum + toNum(r.net_driver_payout) : sum),
    0,
  );
  const paidCount = filteredRows.filter((r) => r.payment_status === "paid").length;
  const platformIdMatchCount = filteredRows.filter((r) =>
    includesQuery(r.platform_id, debouncedQuery),
  ).length;

  const showNoRows = !isLoading && filteredRows.length === 0;

  const payConfirmRow = payConfirm?.kind === "one" ? findPayoutRow(rows, payConfirm.payoutId) : undefined;
  const payConfirmBulkTotal =
    payConfirm?.kind === "many"
      ? payConfirm.ids.reduce((sum, id) => sum + toNum(findPayoutRow(rows, id)?.net_driver_payout), 0)
      : 0;

  const handlePayConfirm = async () => {
    if (!payConfirm) return;
    if (payConfirm.kind === "one") {
      await onPayNow(payConfirm.payoutId);
    } else {
      await onPaySelected(payConfirm.ids);
    }
    setPayConfirm(null);
  };

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const debtRowClass = tableRowAlert;
  const normalRowClass = tableRow;

  return (
    <div className="space-y-4">
      <PayoutTableToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        hasQuery={hasQuery}
        onClearSearch={clearSearch}
        isFilterPending={isFilterPending}
        filteredCount={filteredCount}
        totalCount={totalCount}
        debouncedQuery={debouncedQuery}
        platformIdMatchCount={platformIdMatchCount}
        pendingTotal={pendingTotal}
        paidCount={paidCount}
      />

      {selectedPendingIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-card border border-brand-mint bg-brand-mint px-4 py-3 shadow-soft">
          <span className="text-sm font-medium text-ink">
            {selectedPendingIds.length} pending selected
          </span>
          <button
            type="button"
            disabled={isPaying}
            onClick={() => setPayConfirm({ kind: "many", ids: [...selectedPendingIds] })}
            className={`${btnPrimary} disabled:opacity-50`}
          >
            {isPaying ? "Updating…" : "Pay selected"}
          </button>
          <button
            type="button"
            className={`${btnSecondary} text-brand`}
            onClick={() => onReplaceSelection([])}
          >
            Clear
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-slate-50 disabled:opacity-50"
          onClick={() => onReplaceSelection(pendingIds)}
          disabled={pendingIds.length === 0}
        >
          Select all pending ({pendingIds.length})
        </button>
      </div>

      {errorMessage && (
        <div className={alertError}>
          {errorMessage}
        </div>
      )}

      {isLoading ? (
        <PayoutTableSkeleton />
      ) : showNoRows ? (
        <div className={`${card} py-12 text-center`}>
          <p className="text-sm font-medium text-ink">No payouts match your filters</p>
          <p className="text-xs text-ink-muted mt-2 max-w-md mx-auto">
            Try driver name, platform ID, period dates, rental amount, or status in the quick search above.
          </p>
        </div>
      ) : (
        <>
          <div
            className={`hidden md:block ${card} overflow-hidden p-0`}
          >
            <div className="overflow-x-auto shadow-[inset_-8px_0_8px_-8px_rgba(0,0,0,0.08)]">
              <table className="min-w-full text-sm text-left">
                <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur text-xs font-medium uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th className="px-4 py-3">Driver</th>
                    <th className="px-4 py-3">Period</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Fleet / Sub</th>
                    <th className="px-4 py-3 text-right">Net payout</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Vehicle</th>
                    <th className="px-4 py-3 text-right min-w-[12rem]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRows.map((row) => {
                    const detail = detailsByPayoutId.get(row.id);
                    const isExpanded = expanded.has(row.id);
                    const flags = getRowFlags(row, onOpenDebtActions, onOpenCustomFees, onOpenReleaseHold);
                    const isPayingRow = payingRowId === row.id;

                    return (
                      <Fragment key={row.id}>
                        <tr className={`align-top text-ink ${flags.isDebtStyle ? debtRowClass : normalRowClass}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-ink">
                              <HighlightText
                                text={`${row.first_name} ${row.last_name}`}
                                query={debouncedQuery}
                              />
                            </div>
                            {(row.subcontractor_id || row.subcontractor_payout_id) && (
                              <div className="mt-1 flex flex-wrap items-center gap-1">
                                <span className="inline-flex rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                                  Via subcontractor
                                </span>
                                {row.subcontractor_legal_name && (
                                  <span className="text-[10px] text-violet-700">{row.subcontractor_legal_name}</span>
                                )}
                                <Link
                                  to="/earnings/subcontractors/settlements"
                                  className="text-[10px] text-brand hover:underline"
                                >
                                  Settlements
                                </Link>
                              </div>
                            )}
                            <div className="text-xs text-ink-muted mt-0.5">
                              <HighlightText text={row.phone || "No phone"} query={debouncedQuery} />
                            </div>
                            <div className="mt-0.5 text-xs text-ink-muted">
                              ID:{" "}
                              <span className="font-mono text-ink-muted">
                                <HighlightText text={row.platform_id || "—"} query={debouncedQuery} />
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-ink-muted">
                            <HighlightText text={periodLabel(row)} query={debouncedQuery} />
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-ink">
                            {formatCurrency(toNum(row.total_gross_earnings))}
                          </td>
                          <td
                            className="px-4 py-3 text-right tabular-nums text-ink"
                            title={payoutCommissionTitle(row)}
                          >
                            {formatCurrency(toNum(row.company_commission))}
                          </td>
                          <td className="px-4 py-3 text-right" title={payoutGlovoBreakdownTitle(row)}>
                            <div className="text-base font-semibold tabular-nums text-ink">
                              {formatCurrency(toNum(row.net_driver_payout))}
                            </div>
                            {flags.showDebtBadge && (
                              <div className="mt-1 inline-flex rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800">
                                DEBT {formatCurrency(-flags.debtBadgeAmount)}
                              </div>
                            )}
                            {flags.isDebtStyle && !flags.showDebtBadge && row.payment_status === "hold" && (
                              <div className="mt-1 text-[10px] font-medium text-ink-muted">Debt cleared (hold)</div>
                            )}
                            {flags.showPreviousDebtApplied && (
                              <div className="mt-1 text-[10px] font-medium text-amber-800">
                                Prev. debt: {formatCurrency(toNum(row.debt_applied_amount))}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <PayoutStatusBadge status={row.payment_status} highlightQuery={debouncedQuery} />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex rounded-full bg-amber-50 border border-amber-200/80 px-2 py-0.5 text-xs font-medium text-amber-900 tabular-nums"
                              title={vehicleRentDetailTitle(row)}
                            >
                              <HighlightText
                                text={
                                  toNum(row.vehicle_rental_fee)
                                    ? formatCurrency(toNum(row.vehicle_rental_fee))
                                    : "—"
                                }
                                query={debouncedQuery}
                              />
                            </span>
                            {detail?.license_plate && (
                              <span className="ml-1 text-[11px] text-ink-muted">{detail.license_plate}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <PayoutRowActions
                              row={row}
                              isPending={flags.isPending}
                              isPaying={isPaying}
                              isPayingRow={isPayingRow}
                              isSelected={selectedIds.has(row.id)}
                              isExpanded={isExpanded}
                              canCustomFees={flags.canCustomFees}
                              canDebtActions={flags.canDebtActions}
                              canReleaseHold={flags.canReleaseHold}
                              onToggleSelection={() => onToggleSelection(row.id)}
                              onPayNow={() => setPayConfirm({ kind: "one", payoutId: row.id })}
                              onOpenCustomFees={() => onOpenCustomFees?.(row)}
                              onOpenDebtActions={() => onOpenDebtActions?.(row)}
                              onOpenReleaseHold={() => onOpenReleaseHold?.(row)}
                              onToggleExpand={() => toggleExpand(row.id)}
                              align="right"
                            />
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-slate-50/60">
                            <td colSpan={8} className="px-4 py-4">
                              <PayoutExpandedDetails row={row} detail={detail} debouncedQuery={debouncedQuery} />
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

          <div className="space-y-3 md:hidden">
            {filteredRows.map((row) => {
              const detail = detailsByPayoutId.get(row.id);
              const isExpanded = expanded.has(row.id);
              const flags = getRowFlags(row, onOpenDebtActions, onOpenCustomFees, onOpenReleaseHold);
              const isPayingRow = payingRowId === row.id;

              return (
                <div
                  key={row.id}
                  className={`${card} ${flags.isDebtStyle ? "border-danger/20 " + debtRowClass : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink truncate">
                        <HighlightText text={`${row.first_name} ${row.last_name}`} query={debouncedQuery} />
                      </p>
                      <p className="text-xs text-ink-muted mt-0.5">
                        <HighlightText text={row.phone || "No phone"} query={debouncedQuery} />
                      </p>
                    </div>
                    <PayoutStatusBadge status={row.payment_status} highlightQuery={debouncedQuery} />
                  </div>
                  <div
                    className="mt-3 flex items-baseline justify-between gap-2"
                    title={payoutGlovoBreakdownTitle(row)}
                  >
                    <span className="text-xs text-ink-muted">Net payout</span>
                    <p className="text-xl font-semibold tabular-nums text-ink">
                      {formatCurrency(toNum(row.net_driver_payout))}
                    </p>
                  </div>
                  {flags.showDebtBadge && (
                    <p className="mt-1 text-xs font-semibold text-rose-800">
                      DEBT {formatCurrency(-flags.debtBadgeAmount)}
                    </p>
                  )}
                  {flags.showPreviousDebtApplied && (
                    <p className="mt-1 text-xs font-medium text-amber-800">
                      Previous debt: {formatCurrency(toNum(row.debt_applied_amount))}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
                    <span>
                      <HighlightText text={periodLabel(row)} query={debouncedQuery} />
                    </span>
                    <span title={payoutCommissionTitle(row)}>
                      Fleet {formatCurrency(toNum(row.company_commission))}
                    </span>
                    <span
                      className="font-medium text-amber-900"
                      title={vehicleRentDetailTitle(row)}
                    >
                      Rent{" "}
                      <HighlightText
                        text={
                          toNum(row.vehicle_rental_fee)
                            ? formatCurrency(toNum(row.vehicle_rental_fee))
                            : "—"
                        }
                        query={debouncedQuery}
                      />
                    </span>
                  </p>
                  {detail?.license_plate && (
                    <p className="mt-1 text-[11px] text-ink-muted">Plate: {detail.license_plate}</p>
                  )}
                  <div className="mt-4">
                    <PayoutRowActions
                      row={row}
                      isPending={flags.isPending}
                      isPaying={isPaying}
                      isPayingRow={isPayingRow}
                      isSelected={selectedIds.has(row.id)}
                      isExpanded={isExpanded}
                      canCustomFees={flags.canCustomFees}
                      canDebtActions={flags.canDebtActions}
                      canReleaseHold={flags.canReleaseHold}
                      onToggleSelection={() => onToggleSelection(row.id)}
                      onPayNow={() => setPayConfirm({ kind: "one", payoutId: row.id })}
                      onOpenCustomFees={() => onOpenCustomFees?.(row)}
                      onOpenDebtActions={() => onOpenDebtActions?.(row)}
                      onOpenReleaseHold={() => onOpenReleaseHold?.(row)}
                      onToggleExpand={() => toggleExpand(row.id)}
                    />
                  </div>
                  {isExpanded && (
                    <div className="mt-4 rounded-xl border border-border/80 bg-slate-50/80 p-3">
                      <PayoutExpandedDetails
                        row={row}
                        detail={detail}
                        debouncedQuery={debouncedQuery}
                        compact
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <ConfirmDialog
        open={payConfirm != null}
        onClose={() => !isPaying && setPayConfirm(null)}
        title={payConfirm?.kind === "many" ? "Pay multiple payouts?" : "Mark payout as paid?"}
        description={
          payConfirm?.kind === "one" && payConfirmRow ? (
            <p>
              You are about to record a payment of{" "}
              <span className="font-semibold tabular-nums text-ink">
                {formatCurrency(toNum(payConfirmRow.net_driver_payout))}
              </span>{" "}
              for{" "}
              <span className="font-semibold text-ink">
                {payConfirmRow.first_name} {payConfirmRow.last_name}
              </span>
              . This cannot be undone from here without admin support.
            </p>
          ) : payConfirm?.kind === "one" ? (
            <p className="text-amber-800">
              This payout is not visible in the current list; you can still confirm if you started payment from this
              page.
            </p>
          ) : payConfirm?.kind === "many" ? (
            <div className="space-y-2">
              <p>
                You are about to mark{" "}
                <span className="font-semibold text-ink">{payConfirm.ids.length}</span> pending payout
                {payConfirm.ids.length === 1 ? "" : "s"} as paid, for a combined total of{" "}
                <span className="font-semibold tabular-nums text-ink">
                  {formatCurrency(payConfirmBulkTotal)}
                </span>
                .
              </p>
              {payConfirmBulkTotal === 0 && payConfirm.ids.length > 0 && (
                <p className="text-xs text-amber-800">
                  Totals are based on rows visible in the current page response; verify amounts in the table before
                  confirming.
                </p>
              )}
            </div>
          ) : null
        }
        confirmLabel={payConfirm?.kind === "many" ? "Pay all selected" : "Confirm payment"}
        cancelLabel="Go back"
        confirmVariant="primary"
        isLoading={isPaying}
        onConfirm={handlePayConfirm}
      />
    </div>
  );
}
