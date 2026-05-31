import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams, useSearchParams } from "react-router-dom";
import Papa from "papaparse";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import {
  getConsolidatedPayouts,
  getEarningsPayouts,
  getPayoutsAssignmentDetails,
  postPayDriverConsolidated,
  type PayoutListItem,
} from "../../api/earnings";
import { CombinedPayoutDetailsContent } from "../../components/earnings/payouts/CombinedPayoutDetailsContent";
import { computeUnifiedBreakdown } from "../../components/earnings/payouts/payoutBreakdownUtils";
import { ConfirmDialog } from "../../components/UI/ConfirmDialog";
import { DebtActionsModal } from "../../components/earnings/DebtActionsModal";
import { CustomFeesModal } from "../../components/earnings/CustomFeesModal";
import { ReleaseHoldModal } from "../../components/earnings/ReleaseHoldModal";
import { alertError, alertSuccess, btnSecondary } from "../../theme/classNames";
import { getPreviousWeek } from "../../utils/earningsImportWeek";

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

export function CombinedPayoutDetailsPage() {
  const { driverId } = useParams<{ driverId: string }>();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);

  const defaultWeek = useMemo(() => getPreviousWeek(), []);
  const weekStart = searchParams.get("from")?.trim() || defaultWeek.start;
  const weekEnd = searchParams.get("to")?.trim() || defaultWeek.end;

  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [debtModalRow, setDebtModalRow] = useState<PayoutListItem | null>(null);
  const [customFeesModalRow, setCustomFeesModalRow] = useState<PayoutListItem | null>(null);
  const [releaseHoldRow, setReleaseHoldRow] = useState<PayoutListItem | null>(null);

  const backUrl = `/earnings/payouts?from=${encodeURIComponent(weekStart)}&to=${encodeURIComponent(weekEnd)}`;

  const consolidatedQuery = useQuery({
    queryKey: ["earnings", "payouts", "unified", "detail", driverId, weekStart, weekEnd],
    queryFn: () =>
      getConsolidatedPayouts({
        weekStart,
        weekEnd,
        driverId: driverId!,
      }).then((r) => r.data.items[0] ?? null),
    enabled: (user?.role === "admin" || user?.role === "accountant") && !!driverId && !!weekStart && !!weekEnd,
  });

  const row = consolidatedQuery.data;

  const payoutsQuery = useQuery({
    queryKey: ["earnings", "payouts", "driver-week", driverId, weekStart, weekEnd],
    queryFn: () =>
      getEarningsPayouts({
        driverId: driverId!,
        from: weekStart,
        to: weekEnd,
        pageSize: 50,
        page: 1,
        excludeSubcontractorManaged: false,
      }).then((r) => r.data.items),
    enabled: !!row && !!driverId,
    staleTime: 30_000,
  });

  const detailsQuery = useQuery({
    queryKey: ["earnings", "payout-assignment-details", driverId, weekStart, weekEnd],
    queryFn: () =>
      getPayoutsAssignmentDetails({
        driverId: driverId!,
        from: weekStart,
        to: weekEnd,
        pageSize: 50,
        page: 1,
        excludeSubcontractorManaged: false,
      }).then((r) => r.data.items),
    enabled: !!row && !!driverId,
    staleTime: 30_000,
  });

  const payoutItems = payoutsQuery.data ?? [];
  const detailsById = useMemo(
    () => new Map((detailsQuery.data ?? []).map((d) => [d.payout_id, d] as const)),
    [detailsQuery.data],
  );

  const payMut = useMutation({
    mutationFn: () => postPayDriverConsolidated({ driverId: driverId!, weekStart, weekEnd }),
    onSuccess: () => {
      setError(null);
      setSuccessMsg("Driver marked as paid.");
      setPayConfirmOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
    },
    onError: (e) => setError(errMessage(e)),
  });

  function handleDownloadReport() {
    if (!row || !payoutItems.length) return;
    setDownloadBusy(true);
    try {
      const breakdown = computeUnifiedBreakdown(row, payoutItems);
      const rows = [
        { section: "Combined", label: "Total gross income", amount: breakdown.totalGross },
        { section: "Combined", label: "Platform fees", amount: -breakdown.totalPlatformFees },
        { section: "Combined", label: "Fleet / subscription", amount: -breakdown.totalFleetSub },
        { section: "Combined", label: "Total net income", amount: breakdown.totalNetIncome },
        { section: "Combined", label: "Net after fleet (before cash)", amount: breakdown.netAfterFleetBeforeCash },
        { section: "Combined", label: "Cash balance", amount: -breakdown.totalCashBalance },
        { section: "Combined", label: "Total net payout of all platforms", amount: breakdown.totalNetPayoutAllPlatforms },
        { section: "Combined", label: "Custom fee / vehicle rent", amount: -breakdown.customFeeVehicleRent },
        { section: "Combined", label: "Amount after vehicle rent", amount: breakdown.amountAfterVehicleRent },
        ...(breakdown.crossPlatformDebtOffset > 0.02
          ? [
              { section: "Combined", label: "Cross-platform debt offset", amount: -breakdown.crossPlatformDebtOffset },
              { section: "Combined", label: "Net after cross-platform offset", amount: breakdown.weekRawNet },
            ]
          : []),
        ...(breakdown.totalDebtApplied > 0.02
          ? [{ section: "Combined", label: "Debt applied (prior periods)", amount: -breakdown.totalDebtApplied }]
          : []),
        ...(breakdown.newPeriodDebt > 0.02
          ? [{ section: "Combined", label: "New period deficit (debt)", amount: -breakdown.newPeriodDebt }]
          : []),
        ...(breakdown.otherAdjustments > 0.02
          ? [{ section: "Combined", label: "Custom fees & other adjustments", amount: -breakdown.otherAdjustments }]
          : []),
        { section: "Combined", label: "Final net payout", amount: breakdown.finalNet },
        ...breakdown.platforms.flatMap((p) => [
          { section: p.platform, label: "Gross", amount: p.gross },
          { section: p.platform, label: "Cash balance", amount: -p.cashBalance },
          { section: p.platform, label: "Net payout from platform", amount: p.netPayoutFromPlatform },
        ]),
      ];
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payout-${row.first_name}-${row.last_name}-${weekStart}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadBusy(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <p className="p-6 text-ink-muted">You do not have access.</p>;
  }

  if (consolidatedQuery.isLoading || (row && payoutsQuery.isLoading)) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <p className="text-sm text-slate-500">Loading combined payout details…</p>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="mx-auto max-w-[1600px] p-6 sm:p-8">
        <Link to={backUrl} className={`${btnSecondary} !text-xs mb-4`}>
          ← Back to payouts
        </Link>
        <p className="text-sm text-rose-700">No combined payout found for this driver and period.</p>
      </div>
    );
  }

  const driverName = `${row.first_name} ${row.last_name}`;

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f4f6f8] print:bg-white">
      <header className="shrink-0 border-b border-border/80 bg-white/90 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5 print:hidden">
        <nav className="mb-3 text-xs text-ink-muted">
          <Link to="/earnings/payouts" className="hover:text-brand hover:underline">
            Payouts
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <Link to={`/drivers/${row.driver_id}`} className="hover:text-brand hover:underline">
            {driverName}
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-ink">Combined Payout Details</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to={backUrl} className={`${btnSecondary} !mb-3 !min-h-0 !py-1.5 !px-3 !text-xs inline-flex`}>
              ← Back to payouts
            </Link>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Combined Payout Details</h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-muted">
              Detailed breakdown of earnings, deductions and final payout.
            </p>
          </div>
          <button
            type="button"
            disabled={downloadBusy || !payoutItems.length}
            className={`${btnSecondary} !gap-2 shrink-0 !text-xs print:hidden`}
            onClick={handleDownloadReport}
          >
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloadBusy ? "Downloading…" : "Download report"}
          </button>
        </div>
      </header>

      <div ref={printRef} className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-6 sm:space-y-8">
        {error && <div className={alertError}>{error}</div>}
        {successMsg && <div className={alertSuccess}>{successMsg}</div>}

        <CombinedPayoutDetailsContent
          row={row}
          payoutItems={payoutItems}
          detailsById={detailsById}
          isPaying={payMut.isPending}
          onPay={() => setPayConfirmOpen(true)}
          onOpenDebtActions={setDebtModalRow}
          onOpenCustomFees={setCustomFeesModalRow}
          onOpenReleaseHold={setReleaseHoldRow}
          onDownloadReport={handleDownloadReport}
          onPrint={handlePrint}
          downloadBusy={downloadBusy}
        />
      </div>

      <ConfirmDialog
        open={payConfirmOpen}
        onClose={() => !payMut.isPending && setPayConfirmOpen(false)}
        title="Pay this driver?"
        description={`Mark all platform payouts for ${driverName} as paid for ${weekStart} – ${weekEnd}.`}
        confirmLabel="Confirm payment"
        cancelLabel="Cancel"
        isLoading={payMut.isPending}
        onConfirm={async () => {
          await payMut.mutateAsync();
        }}
      />

      <DebtActionsModal
        row={debtModalRow}
        open={debtModalRow != null}
        onClose={() => setDebtModalRow(null)}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["earnings"] })}
      />
      <CustomFeesModal
        row={customFeesModalRow}
        open={customFeesModalRow != null}
        onClose={() => setCustomFeesModalRow(null)}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["earnings"] })}
      />
      <ReleaseHoldModal
        row={releaseHoldRow}
        open={releaseHoldRow != null}
        onClose={() => setReleaseHoldRow(null)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["earnings"] });
          setSuccessMsg("Hold released successfully.");
        }}
      />
    </div>
  );
}
