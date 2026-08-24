import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trans, useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import i18n from "../../i18n";
import { useCanAccessFinance, useCanAdjustPayouts, useCanApprovePayouts } from "../../lib/permissions";
import {
  getConsolidatedPayouts,
  getDebtsSummary,
  postPayAllConsolidated,
  postPayDriverConsolidated,
} from "../../api/earnings";
import { PayoutPageSummary } from "../../components/earnings/payouts/PayoutPageSummary";
import { PayoutUnifiedToolbar } from "../../components/earnings/payouts/PayoutUnifiedToolbar";
import { PayoutWeekNavigator } from "../../components/earnings/payouts/PayoutWeekNavigator";
import { UnifiedPayoutsTable } from "../../components/earnings/payouts/UnifiedPayoutsTable";
import { getPreviousWeek } from "../../utils/earningsImportWeek";
import { LoanRepaymentModal } from "../../components/earnings/LoanRepaymentModal";
import type { ConsolidatedDriverPayout } from "../../api/earnings";
import { getLoansSummary } from "../../api/driverLoans";
import { LoanFleetSummaryStrip } from "../../components/drivers/LoanFleetSummaryStrip";
import { invalidateLoanQueries } from "../../components/earnings/loans/invalidateLoanQueries";
import {
  payoutFilterBtnSecondary,
} from "../../components/earnings/payouts/PayoutFiltersCard";
import { alertError, btnSecondary } from "../../theme/classNames";

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : i18n.t("pages.earningsImport.somethingWentWrong");
}

function statusLabel(status: string): string {
  return i18n.t(`pages.earningsPayouts.payoutStatus.${status}`, { defaultValue: status });
}

const PLATFORM_LABELS: Record<string, string> = {
  glovo: "Glovo",
  bolt: "Bolt",
  bolt_taxi: "Bolt Taxi",
  uber: "Uber",
};

export function EarningsPayoutsPage() {
  const { t } = useTranslation();
  const canAccess = useCanAccessFinance();
  const canApprove = useCanApprovePayouts();
  const canAdjust = useCanAdjustPayouts();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const driverIdFromUrl =
    searchParams.get("driverId")?.trim() || searchParams.get("driver_id")?.trim() || undefined;

  const defaultWeek = useMemo(() => getPreviousWeek(), []);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [loanOnly, setLoanOnly] = useState(false);
  const [weekStart, setWeekStart] = useState(defaultWeek.start);
  const [weekEnd, setWeekEnd] = useState(defaultWeek.end);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [payingRowId, setPayingRowId] = useState<string | null>(null);
  const [loanModalRow, setLoanModalRow] = useState<ConsolidatedDriverPayout | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const urlFrom = searchParams.get("from")?.trim();
    const urlTo = searchParams.get("to")?.trim();
    if (urlFrom && /^\d{4}-\d{2}-\d{2}$/.test(urlFrom)) setWeekStart(urlFrom);
    if (urlTo && /^\d{4}-\d{2}-\d{2}$/.test(urlTo)) setWeekEnd(urlTo);
  }, [searchParams]);

  const applyWeek = useCallback(
    (start: string, end: string) => {
      setWeekStart(start);
      setWeekEnd(end);
      const next = new URLSearchParams(searchParams);
      next.set("from", start);
      next.set("to", end);
      setSearchParams(next);
    },
    [searchParams, setSearchParams],
  );

  const payoutsQuery = useQuery({
    queryKey: [
      "earnings",
      "payouts",
      "unified",
      weekStart,
      weekEnd,
      debouncedQ,
      status,
      platform,
      driverIdFromUrl,
      loanOnly,
    ],
    queryFn: () =>
      getConsolidatedPayouts({
        weekStart,
        weekEnd,
        q: debouncedQ || undefined,
        status: status || undefined,
        platform: platform || undefined,
        driverId: driverIdFromUrl,
        hasOutstandingLoan: loanOnly || undefined,
      }).then((r) => r.data),
    enabled:
      canAccess && !!weekStart && !!weekEnd,
  });

  const debtSummaryQuery = useQuery({
    queryKey: ["earnings", "debts", "summary"],
    queryFn: () => getDebtsSummary().then((r) => r.data),
    enabled: canAccess,
  });

  const loansSummaryQuery = useQuery({
    queryKey: ["drivers", "loans", "summary"],
    queryFn: () => getLoansSummary().then((r) => r.data),
    enabled: canAccess,
  });

  const payDriverMut = useMutation({
    mutationFn: (driverId: string) =>
      postPayDriverConsolidated({ driverId, weekStart, weekEnd }),
    onSuccess: () => {
      setError(null);
      setPayingRowId(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setError(errMessage(e)),
  });

  const payAllMut = useMutation({
    mutationFn: () => postPayAllConsolidated({ weekStart, weekEnd }),
    onSuccess: () => {
      setError(null);
      setPayingRowId(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setError(errMessage(e)),
  });

  function clearDriverFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("driverId");
    next.delete("driver_id");
    setSearchParams(next);
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (status) {
    activeChips.push({
      key: "status",
      label: t("pages.earningsPayouts.statusChipLabel", { label: statusLabel(status) }),
      onRemove: () => setStatus(""),
    });
  }
  if (loanOnly) {
    activeChips.push({
      key: "loan",
      label: t("pages.earningsPayouts.outstandingLoansChip"),
      onRemove: () => setLoanOnly(false),
    });
  }
  if (platform) {
    activeChips.push({
      key: "platform",
      label: t("pages.earningsPayouts.platformChipLabel", { label: PLATFORM_LABELS[platform] ?? platform }),
      onRemove: () => setPlatform(""),
    });
  }
  if (debouncedQ) {
    activeChips.push({
      key: "q",
      label: t("pages.earningsPayouts.searchChipLabel", { query: debouncedQ }),
      onRemove: () => {
        setQ("");
        setDebouncedQ("");
      },
    });
  }
  if (driverIdFromUrl) {
    activeChips.push({
      key: "driver",
      label: t("pages.earningsPayouts.oneDriverChip"),
      onRemove: clearDriverFilter,
    });
  }

  const summary = payoutsQuery.data?.summary;
  const rows = payoutsQuery.data?.items ?? [];

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">{t("common.noAccess")}</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <header className="shrink-0 border-b border-border/80 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
        <nav className="mb-2 text-xs text-ink-muted">
          <Link to="/earnings" className="hover:text-brand hover:underline">
            {t("nav.earnings")}
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-ink">{t("pages.earningsPayouts.title")}</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">{t("pages.earningsPayouts.title")}</h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">
              {t("pages.earningsPayouts.unifiedSubtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <PayoutWeekNavigator
              weekStart={weekStart}
              weekEnd={weekEnd}
              onWeekChange={applyWeek}
              disabled={payoutsQuery.isFetching}
            />
            <button
              type="button"
              className={`${btnSecondary} !min-h-[36px] !text-xs`}
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
            >
              {filtersOpen ? t("pages.earningsPayouts.hideFilters") : t("pages.driversList.filtersButton")}
            </button>
            <button
              type="button"
              className={`${payoutFilterBtnSecondary} !min-h-[36px] !text-xs`}
              disabled={payoutsQuery.isFetching}
              onClick={() => void payoutsQuery.refetch()}
            >
              {payoutsQuery.isFetching ? t("pages.earningsPayouts.refreshing") : t("common.refresh")}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-3 p-4 pb-20 sm:p-6 sm:space-y-4">
        {error && <div className={alertError}>{error}</div>}

        {debtSummaryQuery.data && debtSummaryQuery.data.totalOutstanding > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/70 bg-rose-50/50 px-3 py-2 text-sm">
            <span className="text-rose-900">
              <Trans
                i18nKey="pages.earningsPayouts.outstandingAcrossDrivers"
                values={{
                  amount: debtSummaryQuery.data.totalOutstanding.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }),
                  count: debtSummaryQuery.data.driversWithDebt,
                }}
                components={{ b: <span className="font-semibold tabular-nums" /> }}
              />
            </span>
            <button
              type="button"
              className="text-xs font-medium text-rose-800 hover:underline"
              onClick={() => setStatus("debt")}
            >
              {t("pages.earningsPayouts.showDebtPayouts")}
            </button>
          </div>
        )}

        {loansSummaryQuery.data && (
          <LoanFleetSummaryStrip
            data={loansSummaryQuery.data}
            action={
              <div className="flex flex-wrap items-center gap-3">
                {loansSummaryQuery.data.totalOutstanding > 0 && (
                  <button
                    type="button"
                    className="text-xs font-medium text-sky-800 hover:underline"
                    onClick={() => setLoanOnly(true)}
                  >
                    {t("pages.earningsPayouts.showLoanPayouts")}
                  </button>
                )}
                <Link
                  to="/earnings/loans"
                  className="text-xs font-medium text-sky-800 hover:underline"
                >
                  {t("pages.driversList.viewLoanReport")}
                </Link>
              </div>
            }
          />
        )}

        <PayoutPageSummary
          driverCount={summary?.driver_count ?? 0}
          pendingCount={summary?.payable_count ?? 0}
          paidCount={summary?.paid_count ?? 0}
          totalAmount={summary ? Number(summary.total_amount) : 0}
          loading={payoutsQuery.isLoading}
        />

        {filtersOpen && (
          <PayoutUnifiedToolbar
            q={q}
            onQChange={setQ}
            status={status}
            onStatusChange={setStatus}
            platform={platform}
            onPlatformChange={setPlatform}
            weekStart={weekStart}
            weekEnd={weekEnd}
            onWeekStartChange={(start) => applyWeek(start, weekEnd)}
            onWeekEndChange={(end) => applyWeek(weekStart, end)}
            activeChips={activeChips}
          />
        )}

        <UnifiedPayoutsTable
          rows={rows}
          isLoading={payoutsQuery.isLoading}
          isPaying={payDriverMut.isPending || payAllMut.isPending}
          payingDriverId={payingRowId}
          weekStart={weekStart}
          weekEnd={weekEnd}
          payableCount={summary?.payable_count ?? 0}
          canApprove={canApprove}
          canAdjust={canAdjust}
          onPayDriver={async (driverId) => {
            setPayingRowId(driverId);
            await payDriverMut.mutateAsync(driverId);
          }}
          onPayAll={async () => {
            setPayingRowId(null);
            await payAllMut.mutateAsync();
          }}
          onOpenLoanActions={canAdjust ? (row) => setLoanModalRow(row) : undefined}
        />

        {canAdjust && (
        <LoanRepaymentModal
          row={loanModalRow}
          weekStart={weekStart}
          weekEnd={weekEnd}
          open={loanModalRow != null}
          onClose={() => setLoanModalRow(null)}
          onSuccess={() => {
            invalidateLoanQueries(queryClient);
          }}
        />
        )}
      </div>
    </div>
  );
}
