import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useCanAccessFinance } from "../../lib/permissions";
import {
  getConsolidatedPayouts,
  getDebtsSummary,
  postPayAllConsolidated,
  postPayDriverConsolidated,
} from "../../api/earnings";
import type { PayoutListItem } from "../../api/earnings";
import { PayoutPageSummary } from "../../components/earnings/payouts/PayoutPageSummary";
import { PayoutUnifiedToolbar } from "../../components/earnings/payouts/PayoutUnifiedToolbar";
import { PayoutWeekNavigator } from "../../components/earnings/payouts/PayoutWeekNavigator";
import { UnifiedPayoutsTable } from "../../components/earnings/payouts/UnifiedPayoutsTable";
import { getPreviousWeek } from "../../utils/earningsImportWeek";
import { DebtActionsModal } from "../../components/earnings/DebtActionsModal";
import { CustomFeesModal } from "../../components/earnings/CustomFeesModal";
import { ReleaseHoldModal } from "../../components/earnings/ReleaseHoldModal";
import {
  payoutFilterBtnSecondary,
} from "../../components/earnings/payouts/PayoutFiltersCard";
import { alertError, alertSuccess, btnSecondary } from "../../theme/classNames";

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

const STATUS_LABELS: Record<string, string> = {
  payable: "Ready to pay",
  paid: "Paid",
  debt: "Debt",
  hold: "Hold",
  partial: "Partial",
  mixed: "Mixed",
};

const PLATFORM_LABELS: Record<string, string> = {
  glovo: "Glovo",
  bolt: "Bolt",
  bolt_taxi: "Bolt Taxi",
  uber: "Uber",
};

export function EarningsPayoutsPage() {
  const canAccess = useCanAccessFinance();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const driverIdFromUrl =
    searchParams.get("driverId")?.trim() || searchParams.get("driver_id")?.trim() || undefined;

  const defaultWeek = useMemo(() => getPreviousWeek(), []);
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [status, setStatus] = useState("");
  const [platform, setPlatform] = useState("");
  const [weekStart, setWeekStart] = useState(defaultWeek.start);
  const [weekEnd, setWeekEnd] = useState(defaultWeek.end);
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [payingRowId, setPayingRowId] = useState<string | null>(null);
  const [debtModalRow, setDebtModalRow] = useState<PayoutListItem | null>(null);
  const [customFeesModalRow, setCustomFeesModalRow] = useState<PayoutListItem | null>(null);
  const [releaseHoldRow, setReleaseHoldRow] = useState<PayoutListItem | null>(null);
  const [releaseHoldMsg, setReleaseHoldMsg] = useState<string | null>(null);

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
    ],
    queryFn: () =>
      getConsolidatedPayouts({
        weekStart,
        weekEnd,
        q: debouncedQ || undefined,
        status: status || undefined,
        platform: platform || undefined,
        driverId: driverIdFromUrl,
      }).then((r) => r.data),
    enabled:
      canAccess && !!weekStart && !!weekEnd,
  });

  const debtSummaryQuery = useQuery({
    queryKey: ["earnings", "debts", "summary"],
    queryFn: () => getDebtsSummary().then((r) => r.data),
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
      label: `Status: ${STATUS_LABELS[status] ?? status}`,
      onRemove: () => setStatus(""),
    });
  }
  if (platform) {
    activeChips.push({
      key: "platform",
      label: `Platform: ${PLATFORM_LABELS[platform] ?? platform}`,
      onRemove: () => setPlatform(""),
    });
  }
  if (debouncedQ) {
    activeChips.push({
      key: "q",
      label: `Search: ${debouncedQ}`,
      onRemove: () => {
        setQ("");
        setDebouncedQ("");
      },
    });
  }
  if (driverIdFromUrl) {
    activeChips.push({
      key: "driver",
      label: "One driver",
      onRemove: clearDriverFilter,
    });
  }

  const summary = payoutsQuery.data?.summary;
  const rows = payoutsQuery.data?.items ?? [];

  if (!canAccess) {
    return <p className="p-6 text-ink-muted">You do not have access.</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <header className="shrink-0 border-b border-border/80 bg-white/80 px-4 py-4 backdrop-blur-md sm:px-6 sm:py-5">
        <nav className="mb-2 text-xs text-ink-muted">
          <Link to="/earnings" className="hover:text-brand hover:underline">
            Earnings
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="font-medium text-ink">Payouts</span>
        </nav>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-ink sm:text-2xl">Payouts</h1>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-muted">
              Unified driver payouts across all connected platforms.
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
              {filtersOpen ? "Hide filters" : "Filters"}
            </button>
            <button
              type="button"
              className={`${payoutFilterBtnSecondary} !min-h-[36px] !text-xs`}
              disabled={payoutsQuery.isFetching}
              onClick={() => void payoutsQuery.refetch()}
            >
              {payoutsQuery.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1600px] flex-1 space-y-3 p-4 pb-20 sm:p-6 sm:space-y-4">
        {error && <div className={alertError}>{error}</div>}
        {releaseHoldMsg && <div className={alertSuccess}>{releaseHoldMsg}</div>}

        {debtSummaryQuery.data && debtSummaryQuery.data.totalOutstanding > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200/70 bg-rose-50/50 px-3 py-2 text-sm">
            <span className="text-rose-900">
              <span className="font-semibold tabular-nums">
                {debtSummaryQuery.data.totalOutstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                RON
              </span>{" "}
              outstanding across {debtSummaryQuery.data.driversWithDebt} driver
              {debtSummaryQuery.data.driversWithDebt === 1 ? "" : "s"}
            </span>
            <button
              type="button"
              className="text-xs font-medium text-rose-800 hover:underline"
              onClick={() => setStatus("debt")}
            >
              Show debt payouts
            </button>
          </div>
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
          onPayDriver={async (driverId) => {
            setPayingRowId(driverId);
            await payDriverMut.mutateAsync(driverId);
          }}
          onPayAll={async () => {
            setPayingRowId(null);
            await payAllMut.mutateAsync();
          }}
          onOpenDebtActions={(row) => setDebtModalRow(row)}
          onOpenCustomFees={(row) => setCustomFeesModalRow(row)}
          onOpenReleaseHold={(row) => setReleaseHoldRow(row)}
        />

        <DebtActionsModal
          row={debtModalRow}
          open={debtModalRow != null}
          onClose={() => setDebtModalRow(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["earnings"] });
            void debtSummaryQuery.refetch();
          }}
        />

        <CustomFeesModal
          row={customFeesModalRow}
          open={customFeesModalRow != null}
          onClose={() => setCustomFeesModalRow(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["earnings"] });
          }}
        />

        <ReleaseHoldModal
          row={releaseHoldRow}
          open={releaseHoldRow != null}
          onClose={() => setReleaseHoldRow(null)}
          onSuccess={() => {
            void queryClient.invalidateQueries({ queryKey: ["earnings"] });
            setReleaseHoldMsg("Hold released successfully.");
          }}
        />
      </div>
    </div>
  );
}
