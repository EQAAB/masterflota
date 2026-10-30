import { useMemo, useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Papa from "papaparse";
import axios from "axios";
import i18n from "../../i18n";
import { useCanAccessFinance, useCanAdjustPayouts, useCanApprovePayouts } from "../../lib/permissions";
import {
  getConsolidatedPayouts,
  getEarningsPayouts,
  getPayoutCustomFees,
  getPayoutWeekDebtAdjustments,
  getPayoutsAssignmentDetails,
  postPayDriverConsolidated,
  type PayoutListItem,
} from "../../api/earnings";
import { CombinedPayoutDetailsContent } from "../../components/earnings/payouts/CombinedPayoutDetailsContent";
import { PayoutDetailsPageHeader } from "../../components/earnings/payouts/PayoutDetailsPageHeader";
import { PayoutExplainModal } from "../../components/earnings/payouts/PayoutExplainModal";
import { PayoutWeekNavigator } from "../../components/earnings/payouts/PayoutWeekNavigator";
import { computeUnifiedBreakdown } from "../../components/earnings/payouts/payoutBreakdownUtils";
import { buildWeekFeeBreakdown } from "../../components/earnings/payouts/payoutFeeBreakdown";
import { CourierPayoutStatement } from "../../components/earnings/payouts/CourierPayoutStatement";
import { downloadCourierStatementPdf } from "../../components/earnings/payouts/courierStatementPdf";
import { ConfirmDialog } from "../../components/UI/ConfirmDialog";
import { DebtActionsModal } from "../../components/earnings/DebtActionsModal";
import { CustomFeesModal } from "../../components/earnings/CustomFeesModal";
import { ReleaseHoldModal } from "../../components/earnings/ReleaseHoldModal";
import { LoanRepaymentModal } from "../../components/earnings/LoanRepaymentModal";
import { getDriverWeekLoanRepayments } from "../../api/driverLoans";
import { alertError, alertSuccess, btnSecondary } from "../../theme/classNames";
import { getPreviousWeek } from "../../utils/earningsImportWeek";

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : i18n.t("pages.combinedPayoutDetailsPage.somethingWentWrong");
}

export function CombinedPayoutDetailsPage() {
  const { t } = useTranslation();
  const { driverId } = useParams<{ driverId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canAccess = useCanAccessFinance();
  const canApprove = useCanApprovePayouts();
  const canAdjust = useCanAdjustPayouts();
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  const statementRef = useRef<HTMLDivElement>(null);

  const defaultWeek = useMemo(() => getPreviousWeek(), []);
  const weekStart = searchParams.get("from")?.trim() || defaultWeek.start;
  const weekEnd = searchParams.get("to")?.trim() || defaultWeek.end;

  const [payConfirmOpen, setPayConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [statementBusy, setStatementBusy] = useState(false);
  const [debtModalRow, setDebtModalRow] = useState<PayoutListItem | null>(null);
  const [customFeesModalRow, setCustomFeesModalRow] = useState<PayoutListItem | null>(null);
  const [releaseHoldRow, setReleaseHoldRow] = useState<PayoutListItem | null>(null);
  const [loanModalOpen, setLoanModalOpen] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const backUrl = `/earnings/payouts?from=${encodeURIComponent(weekStart)}&to=${encodeURIComponent(weekEnd)}`;

  function handleWeekChange(start: string, end: string) {
    if (!driverId) return;
    navigate(
      `/earnings/payouts/${driverId}?from=${encodeURIComponent(start)}&to=${encodeURIComponent(end)}`,
    );
  }

  const consolidatedQuery = useQuery({
    queryKey: ["earnings", "payouts", "unified", "detail", driverId, weekStart, weekEnd],
    queryFn: () =>
      getConsolidatedPayouts({
        weekStart,
        weekEnd,
        driverId: driverId!,
      }).then((r) => r.data.items[0] ?? null),
    enabled: canAccess && !!driverId && !!weekStart && !!weekEnd,
  });

  const weekNavigator = (
    <div className="border-b border-border/80 bg-white px-4 py-2 sm:px-6 print:hidden">
      <PayoutWeekNavigator
        weekStart={weekStart}
        weekEnd={weekEnd}
        showDateInputs={false}
        disabled={consolidatedQuery.isFetching}
        onWeekChange={handleWeekChange}
      />
    </div>
  );

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

  const feeQueries = useQueries({
    queries: payoutItems.map((p) => ({
      queryKey: ["earnings", "payout-custom-fees", p.id] as const,
      queryFn: () => getPayoutCustomFees(p.id).then((r) => r.data),
      enabled: payoutItems.length > 0,
      staleTime: 30_000,
    })),
  });

  const weekFeeBreakdown = useMemo(() => {
    const feesByPayoutId = new Map(
      payoutItems.flatMap((p, i) => {
        const data = feeQueries[i]?.data;
        return data ? ([[p.id, data]] as const) : [];
      }),
    );
    const isLoading = payoutItems.length > 0 && feeQueries.some((q) => q.isLoading);
    return buildWeekFeeBreakdown(payoutItems, feesByPayoutId, isLoading);
  }, [payoutItems, feeQueries]);

  const debtAdjustmentsQuery = useQuery({
    queryKey: ["earnings", "payout-debt-adjustments", driverId, weekStart, weekEnd],
    queryFn: () =>
      getPayoutWeekDebtAdjustments({
        driverId: driverId!,
        from: weekStart,
        to: weekEnd,
      }).then((r) => r.data.items),
    enabled: !!row && !!driverId && !!weekStart && !!weekEnd,
    staleTime: 30_000,
  });

  const loanRepaymentsQuery = useQuery({
    queryKey: ["earnings", "loan-repayments", driverId, weekStart, weekEnd],
    queryFn: () =>
      getDriverWeekLoanRepayments(driverId!, weekStart, weekEnd).then((r) => r.data.items),
    enabled: !!row && !!driverId && !!weekStart && !!weekEnd,
    staleTime: 30_000,
  });

  const payMut = useMutation({
    mutationFn: () => postPayDriverConsolidated({ driverId: driverId!, weekStart, weekEnd }),
    onSuccess: () => {
      setError(null);
      setSuccessMsg(t("pages.combinedPayoutDetailsPage.driverMarkedPaidMsg"));
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

  async function handleDownloadStatement() {
    if (!row) return;
    setStatementBusy(true);
    try {
      const safeName = `${row.first_name}-${row.last_name}`.replace(/\s+/g, "-");
      await downloadCourierStatementPdf({
        row,
        payoutItems,
        weekFeeBreakdown,
        loanRepayments: loanRepaymentsQuery.data ?? [],
        filename: `payout-statement-${safeName}-${weekStart}.pdf`,
      });
    } catch (e) {
      setError(errMessage(e));
    } finally {
      setStatementBusy(false);
    }
  }

  function handlePrintStatement() {
    const source = statementRef.current?.querySelector(".payout-statement");
    if (!source) return;
    const mount = document.createElement("div");
    mount.className = "payout-statement-print-root";
    mount.appendChild(source.cloneNode(true));
    document.body.appendChild(mount);
    document.body.classList.add("printing-payout-statement");
    const cleanup = () => {
      document.body.classList.remove("printing-payout-statement");
      mount.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    window.print();
  }

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">{t("common.noAccess")}</p>;
  }

  if (consolidatedQuery.isLoading || (row && payoutsQuery.isLoading)) {
    return (
      <div className="flex flex-col flex-1 overflow-auto bg-[#f4f6f8]">
        {weekNavigator}
        <div className="flex flex-1 items-center justify-center p-12">
          <p className="text-sm text-slate-500">{t("pages.combinedPayoutDetailsPage.loadingCombinedDetails")}</p>
        </div>
      </div>
    );
  }

  if (!row) {
    return (
      <div className="flex flex-col flex-1 overflow-auto bg-[#f4f6f8]">
        {weekNavigator}
        <div className="mx-auto max-w-[1600px] p-6 sm:p-8">
          <Link to={backUrl} className={`${btnSecondary} !text-xs mb-4`}>
            ← {t("pages.earningsPayouts.detail.backToPayouts")}
          </Link>
          <p className="text-sm text-rose-700">{t("pages.combinedPayoutDetailsPage.noCombinedPayoutFound")}</p>
        </div>
      </div>
    );
  }

  const driverName = `${row.first_name} ${row.last_name}`;

  return (
    <div className="flex flex-col flex-1 overflow-auto bg-[#f4f6f8] print:bg-white">
      <PayoutDetailsPageHeader
        driverName={driverName}
        driverId={row.driver_id}
        backUrl={backUrl}
        downloadBusy={downloadBusy}
        downloadDisabled={!payoutItems.length}
        onDownloadReport={handleDownloadReport}
        showExplain
        explainDisabled={!payoutItems.length}
        onExplainPayout={() => setExplainOpen(true)}
      />

      {weekNavigator}

      <div ref={printRef} className="mx-auto w-full max-w-[1400px] flex-1 space-y-6 p-6 sm:space-y-8">
        {error && <div className={alertError}>{error}</div>}
        {successMsg && <div className={alertSuccess}>{successMsg}</div>}

        <CombinedPayoutDetailsContent
          row={row}
          payoutItems={payoutItems}
          detailsById={detailsById}
          weekFeeBreakdown={weekFeeBreakdown}
          weekDebtAdjustments={debtAdjustmentsQuery.data ?? []}
          weekDebtAdjustmentsLoading={debtAdjustmentsQuery.isLoading}
          weekLoanRepayments={loanRepaymentsQuery.data ?? []}
          weekLoanRepaymentsLoading={loanRepaymentsQuery.isLoading}
          isPaying={payMut.isPending}
          onPay={canApprove ? () => setPayConfirmOpen(true) : undefined}
          onOpenDebtActions={canAdjust ? setDebtModalRow : undefined}
          onOpenLoanActions={canAdjust ? () => setLoanModalOpen(true) : undefined}
          onOpenCustomFees={canAdjust ? setCustomFeesModalRow : undefined}
          onOpenReleaseHold={canApprove ? setReleaseHoldRow : undefined}
          onDownloadReport={handleDownloadReport}
          onPrint={handlePrint}
          onDownloadStatement={handleDownloadStatement}
          onPrintStatement={handlePrintStatement}
          downloadBusy={downloadBusy}
          statementBusy={statementBusy}
        />
      </div>

      <div ref={statementRef} className="payout-statement-host" aria-hidden>
        <CourierPayoutStatement
          row={row}
          payoutItems={payoutItems}
          weekFeeBreakdown={weekFeeBreakdown}
          loanRepayments={loanRepaymentsQuery.data ?? []}
        />
      </div>

      {canApprove && (
      <ConfirmDialog
        open={payConfirmOpen}
        onClose={() => !payMut.isPending && setPayConfirmOpen(false)}
        title={t("pages.earningsPayouts.payThisDriverTitle")}
        description={t("pages.combinedPayoutDetailsPage.markAllPlatformPayoutsDesc", { name: driverName, from: weekStart, to: weekEnd })}
        confirmLabel={t("pages.earningsPayouts.confirmPayment")}
        cancelLabel={t("common.cancel")}
        isLoading={payMut.isPending}
        onConfirm={async () => {
          await payMut.mutateAsync();
        }}
      />
      )}

      {canAdjust && (
      <DebtActionsModal
        row={debtModalRow}
        open={debtModalRow != null}
        onClose={() => setDebtModalRow(null)}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["earnings"] })}
      />
      )}
      {canAdjust && (
      <CustomFeesModal
        row={customFeesModalRow}
        open={customFeesModalRow != null}
        onClose={() => setCustomFeesModalRow(null)}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["earnings"] })}
      />
      )}
      {canApprove && (
      <ReleaseHoldModal
        row={releaseHoldRow}
        open={releaseHoldRow != null}
        onClose={() => setReleaseHoldRow(null)}
        onSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ["earnings"] });
          setSuccessMsg(t("pages.combinedPayoutDetailsPage.holdReleasedSuccessMsg"));
        }}
      />
      )}
      {canAdjust && (
      <LoanRepaymentModal
        row={row ?? null}
        weekStart={weekStart}
        weekEnd={weekEnd}
        open={loanModalOpen && row != null}
        onClose={() => setLoanModalOpen(false)}
        onSuccess={() => void queryClient.invalidateQueries({ queryKey: ["earnings"] })}
      />
      )}
      <PayoutExplainModal
        open={explainOpen && !!driverId}
        onClose={() => setExplainOpen(false)}
        driverId={driverId!}
        weekStart={weekStart}
        weekEnd={weekEnd}
        driverName={driverName}
      />
    </div>
  );
}
