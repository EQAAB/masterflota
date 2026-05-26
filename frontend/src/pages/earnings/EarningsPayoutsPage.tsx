import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuthStore } from "../../store/authStore";
import {
  bulkUpdatePayouts,
  getDebtsSummary,
  getEarningsPayouts,
  getPayoutsAssignmentDetails,
  postDebtsBulkCarryForward,
} from "../../api/earnings";
import type { PayoutListItem } from "../../api/earnings";
import { DriverPayoutTable } from "../../components/earnings/DriverPayoutTable";
import { DebtActionsModal } from "../../components/earnings/DebtActionsModal";
import { CustomFeesModal } from "../../components/earnings/CustomFeesModal";
import { ReleaseHoldModal } from "../../components/earnings/ReleaseHoldModal";
import {
  alertError,
  alertSuccess,
  btnDangerOutline,
  btnPrimary,
  btnSecondary,
  card,
  input,
  sectionLabel,
} from "../../theme/classNames";
import { FilterChip } from "../../components/theme/FilterBar";

function errMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const m = e.response?.data as { message?: string } | undefined;
    if (m?.message) return m.message;
    return e.message;
  }
  return e instanceof Error ? e.message : "Something went wrong";
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  approved: "Approved",
  paid: "Paid",
  failed: "Failed",
  hold: "Hold",
  debt: "Debt",
};

export function EarningsPayoutsPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const driverIdFromUrl =
    searchParams.get("driverId")?.trim() || searchParams.get("driver_id")?.trim() || undefined;

  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [payingRowId, setPayingRowId] = useState<string | null>(null);
  const [debtModalRow, setDebtModalRow] = useState<PayoutListItem | null>(null);
  const [customFeesModalRow, setCustomFeesModalRow] = useState<PayoutListItem | null>(null);
  const [releaseHoldRow, setReleaseHoldRow] = useState<PayoutListItem | null>(null);
  const [debtActionMsg, setDebtActionMsg] = useState<string | null>(null);
  const [releaseHoldMsg, setReleaseHoldMsg] = useState<string | null>(null);
  const [bulkDebtBusy, setBulkDebtBusy] = useState(false);
  const [showSubManaged, setShowSubManaged] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  useEffect(() => {
    const urlFrom = searchParams.get("from")?.trim();
    const urlTo = searchParams.get("to")?.trim();
    if (urlFrom && /^\d{4}-\d{2}-\d{2}$/.test(urlFrom)) setFrom(urlFrom);
    if (urlTo && /^\d{4}-\d{2}-\d{2}$/.test(urlTo)) setTo(urlTo);
  }, [searchParams]);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const query = useQuery({
    queryKey: ["earnings", "payouts", page, status, from, to, debouncedQ, driverIdFromUrl, showSubManaged],
    queryFn: () =>
      getEarningsPayouts({
        page,
        pageSize: 25,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        q: debouncedQ || undefined,
        driverId: driverIdFromUrl,
        excludeSubcontractorManaged: driverIdFromUrl ? false : !showSubManaged,
      }).then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / (query.data?.pageSize ?? 25)));

  const detailsQuery = useQuery({
    queryKey: [
      "earnings",
      "payout-assignment-details",
      page,
      status,
      from,
      to,
      debouncedQ,
      driverIdFromUrl,
      showSubManaged,
    ],
    queryFn: () =>
      getPayoutsAssignmentDetails({
        page,
        pageSize: 25,
        status: status || undefined,
        from: from || undefined,
        to: to || undefined,
        q: debouncedQ || undefined,
        driverId: driverIdFromUrl,
        excludeSubcontractorManaged: driverIdFromUrl ? false : !showSubManaged,
      }).then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });
  const detailsByPayoutId = useMemo(
    () => new Map((detailsQuery.data?.items ?? []).map((d) => [d.payout_id, d])),
    [detailsQuery.data?.items],
  );

  const debtSummaryQuery = useQuery({
    queryKey: ["earnings", "debts", "summary"],
    queryFn: () => getDebtsSummary().then((r) => r.data),
    enabled: user?.role === "admin" || user?.role === "accountant",
  });

  const bulkMut = useMutation({
    mutationFn: (ids: string[]) =>
      bulkUpdatePayouts({
        ids,
        paymentStatus: "paid",
      }),
    onSuccess: () => {
      setSelected(new Set());
      setError(null);
      setPayingRowId(null);
      void queryClient.invalidateQueries({ queryKey: ["earnings"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard", "stats"] });
    },
    onError: (e) => setError(errMessage(e)),
  });

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearDriverFilter() {
    const next = new URLSearchParams(searchParams);
    next.delete("driverId");
    next.delete("driver_id");
    setSearchParams(next);
    setPage(1);
  }

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  if (status) {
    activeChips.push({
      key: "status",
      label: `Status: ${STATUS_LABELS[status] ?? status}`,
      onRemove: () => {
        setStatus("");
        setPage(1);
      },
    });
  }
  if (from) {
    activeChips.push({
      key: "from",
      label: `From ${from}`,
      onRemove: () => {
        setFrom("");
        setPage(1);
      },
    });
  }
  if (to) {
    activeChips.push({
      key: "to",
      label: `To ${to}`,
      onRemove: () => {
        setTo("");
        setPage(1);
      },
    });
  }
  if (debouncedQ) {
    activeChips.push({
      key: "q",
      label: `Search: ${debouncedQ}`,
      onRemove: () => {
        setQ("");
        setDebouncedQ("");
        setPage(1);
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
  if (showSubManaged && !driverIdFromUrl) {
    activeChips.push({
      key: "sub",
      label: "Sub-managed included",
      onRemove: () => {
        setShowSubManaged(false);
        setPage(1);
      },
    });
  }

  if (user?.role !== "admin" && user?.role !== "accountant") {
    return <p className="p-6 text-ink-muted">You do not have access.</p>;
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <header className="shrink-0 border-b border-border/80 bg-white/80 backdrop-blur-md px-4 sm:px-6 py-5">
        <nav className="text-xs text-ink-muted mb-2">
          <Link to="/earnings" className="hover:text-brand hover:underline">
            Earnings
          </Link>
          <span className="mx-1.5 text-slate-300">/</span>
          <span className="text-ink font-medium">Payouts</span>
        </nav>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">Payouts</h1>
        <p className="text-sm text-ink-muted mt-1 max-w-2xl leading-relaxed">
          Direct driver payouts only. Sub-managed drivers are paid via{" "}
          <Link
            to="/earnings/subcontractors/settlements"
            className="text-brand font-medium hover:underline"
          >
            subcontractor settlements
          </Link>
          .
        </p>
      </header>

      <div className="flex-1 p-4 sm:p-6 max-w-[1600px] mx-auto w-full space-y-6">
        {error && <div className={alertError}>{error}</div>}

        {releaseHoldMsg && <div className={alertSuccess}>{releaseHoldMsg}</div>}

        {debtSummaryQuery.data && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className={`${card} p-4 sm:p-5 border-rose-200/60`}>
              <p className={sectionLabel}>Outstanding debt</p>
              <p className="text-2xl font-bold tabular-nums text-rose-950 mt-1">
                {debtSummaryQuery.data.totalOutstanding.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{" "}
                <span className="text-lg font-semibold text-rose-800">RON</span>
              </p>
              <p className="text-xs text-rose-800/90 mt-1">
                {debtSummaryQuery.data.driversWithDebt} driver
                {debtSummaryQuery.data.driversWithDebt === 1 ? "" : "s"} with open debt
              </p>
            </div>

            <div className={`${card} p-4 sm:p-5 lg:col-span-1`}>
              <p className={sectionLabel}>Top debtors</p>
              {debtSummaryQuery.data.topDebtors.length === 0 ? (
                <p className="text-sm text-ink-muted mt-2">No outstanding debtors.</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {debtSummaryQuery.data.topDebtors.slice(0, 5).map((d) => (
                    <li key={d.driverId} className="flex justify-between gap-2 text-xs">
                      <button
                        type="button"
                        className="text-left font-medium text-ink hover:text-brand hover:underline truncate"
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set("driverId", d.driverId);
                          setSearchParams(next);
                          setPage(1);
                        }}
                      >
                        {d.name}
                      </button>
                      <span className="tabular-nums font-semibold text-ink shrink-0">
                        {d.outstanding.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        RON
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${card} p-4 sm:p-5 flex flex-col gap-2 justify-center`}>
              <p className={sectionLabel}>Debt actions</p>
              <button
                type="button"
                disabled={bulkDebtBusy}
                onClick={async () => {
                  setBulkDebtBusy(true);
                  setDebtActionMsg(null);
                  try {
                    const r = await postDebtsBulkCarryForward({
                      from: from || undefined,
                      to: to || undefined,
                    });
                    setDebtActionMsg(
                      `Recomputed debt allocation for ${r.data.driversProcessed} driver(s).`,
                    );
                    void queryClient.invalidateQueries({ queryKey: ["earnings"] });
                  } catch (e) {
                    setDebtActionMsg(errMessage(e));
                  } finally {
                    setBulkDebtBusy(false);
                  }
                }}
                className={btnDangerOutline}
              >
                {bulkDebtBusy ? "Working…" : "Bulk carry-forward (filtered period)"}
              </button>
              <button
                type="button"
                className={`${btnPrimary} bg-danger hover:opacity-95`}
                onClick={() => {
                  setPage(1);
                  setStatus("debt");
                }}
              >
                View debt payouts
              </button>
              {debtActionMsg && (
                <p className="text-xs text-ink-muted mt-1 border-t border-border/80 pt-2">{debtActionMsg}</p>
              )}
            </div>
          </section>
        )}

        {status === "hold" && total > 0 && (
          <div className={`${card} px-4 py-3 text-sm text-ink`}>
            <span className="font-semibold text-ink">{total}</span> payout
            {total === 1 ? "" : "s"} on hold. Use <span className="font-medium">Release hold</span> in the row menu
            to return it to the payment workflow.
          </div>
        )}

        <section className={`${card} p-4 sm:p-5 space-y-4`}>
          <div>
            <h2 className="text-sm font-semibold text-ink">Filters</h2>
            <p className="text-xs text-ink-muted mt-0.5">Applies across all pages of results.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className={sectionLabel}>Status</label>
              <select
                className={input}
                value={status}
                onChange={(e) => {
                  setPage(1);
                  setStatus(e.target.value);
                }}
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="hold">Hold</option>
                <option value="debt">Debt</option>
              </select>
            </div>
            <div>
              <label className={sectionLabel}>From</label>
              <input
                type="date"
                className={input}
                value={from}
                onChange={(e) => {
                  setPage(1);
                  setFrom(e.target.value);
                }}
              />
            </div>
            <div>
              <label className={sectionLabel}>To</label>
              <input
                type="date"
                className={input}
                value={to}
                onChange={(e) => {
                  setPage(1);
                  setTo(e.target.value);
                }}
              />
            </div>
            <div>
              <label className={sectionLabel}>Search</label>
              <input
                type="search"
                placeholder="Name, phone, platform ID"
                className={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
              <input
                type="checkbox"
                checked={showSubManaged}
                disabled={!!driverIdFromUrl}
                onChange={(e) => {
                  setShowSubManaged(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-border"
              />
              Show sub-managed (audit)
            </label>
            <button
              type="button"
              className="text-sm text-brand font-medium hover:underline disabled:opacity-50"
              disabled={query.isFetching}
              onClick={() => void query.refetch()}
            >
              {query.isFetching ? "Refreshing…" : "Refresh"}
            </button>
          </div>
          {activeChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/60">
              <span className="text-xs text-ink-muted">Active:</span>
              {activeChips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.onRemove} />
              ))}
            </div>
          )}
        </section>

        <DriverPayoutTable
          rows={items}
          detailsByPayoutId={detailsByPayoutId}
          selectedIds={selected}
          isLoading={query.isLoading}
          isPaying={bulkMut.isPending}
          payingRowId={payingRowId}
          errorMessage={error}
          onToggleSelection={toggleOne}
          onReplaceSelection={(ids) => setSelected(new Set(ids))}
          onPayNow={async (id) => {
            setPayingRowId(id);
            await bulkMut.mutateAsync([id]);
          }}
          onPaySelected={async (ids) => {
            setPayingRowId(null);
            await bulkMut.mutateAsync(ids);
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

        <footer
          className={`${card} flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 sm:px-5`}
        >
          <p className="text-sm text-ink-muted tabular-nums">
            Page {page} of {totalPages}
            <span className="text-slate-400 mx-2">·</span>
            {total.toLocaleString()} total
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className={`${btnSecondary} disabled:opacity-40`}
            >
              Previous
            </button>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-white hover:opacity-95 disabled:opacity-40 min-h-[44px]"
            >
              Next
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
