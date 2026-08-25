import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import Papa from "papaparse";
import {
  getDriverVehicleHistory,
  getVehicleDriverHistory,
  type AssignmentHistoryStatus,
  type VehicleAssignmentHistoryRow,
} from "../../api/vehicleAssignmentHistory";
import { useAnyPermission, useCanViewPayouts } from "../../lib/permissions";
import { formatCurrency } from "../../utils/currency";

type PanelMode = "driver" | "vehicle";

function toDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  return value.split("T")[0] ?? "";
}

function formatDisplayDate(value: string | null | undefined): string {
  const d = toDateOnly(value);
  return d || "—";
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function payoutPeriodLink(row: VehicleAssignmentHistoryRow): string {
  const from = toDateOnly(row.assigned_at);
  const to = toDateOnly(row.unassigned_at) || todayIso();
  const params = new URLSearchParams({
    driverId: row.driver_id,
    from,
    to,
  });
  return `/earnings/payouts?${params.toString()}`;
}

export function VehicleAssignmentHistoryPanel({
  mode,
  entityId,
  title,
}: {
  mode: PanelMode;
  entityId: string;
  title: string;
}) {
  const { t } = useTranslation();
  const canView = useAnyPermission(
    mode === "driver" ? "drivers.view" : "vehicles.view",
  );
  const canViewPayouts = useCanViewPayouts();

  const [status, setStatus] = useState<AssignmentHistoryStatus>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [csvBusy, setCsvBusy] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => window.clearTimeout(id);
  }, [q]);

  const filters = useMemo(
    () => ({
      status,
      from: from || undefined,
      to: to || undefined,
      q: debouncedQ || undefined,
    }),
    [status, from, to, debouncedQ],
  );

  const query = useQuery({
    queryKey: ["vehicle-assignment-history", mode, entityId, filters],
    queryFn: () =>
      (mode === "driver"
        ? getDriverVehicleHistory(entityId, filters)
        : getVehicleDriverHistory(entityId, filters)
      ).then((r) => r.data.items),
    enabled: canView && Boolean(entityId),
  });

  const items = query.data ?? [];

  async function exportCsv() {
    if (!items.length) return;
    setCsvBusy(true);
    try {
      const csv =
        mode === "driver"
          ? Papa.unparse(
              items.map((r) => ({
                vehicle: r.vehicle_name || `${r.make ?? ""} ${r.model ?? ""}`.trim(),
                plate: r.license_plate ?? "",
                assigned: toDateOnly(r.assigned_at),
                returned: r.unassigned_at ? toDateOnly(r.unassigned_at) : "Active",
                days_held: r.days_held,
                weekly_rent: r.weekly_rent_at_time ?? "",
                total_rent_paid: r.total_rent_paid,
                notes: r.notes ?? "",
              })),
            )
          : Papa.unparse(
              items.map((r) => ({
                driver: r.driver_name,
                phone: r.driver_phone ?? "",
                assigned: toDateOnly(r.assigned_at),
                returned: r.unassigned_at ? toDateOnly(r.unassigned_at) : "Active",
                days_held: r.days_held,
                weekly_rent: r.weekly_rent_at_time ?? "",
                total_rent_collected: r.total_rent_paid,
                notes: r.notes ?? "",
              })),
            );
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${mode}-assignment-history-${entityId.slice(0, 8)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setCsvBusy(false);
    }
  }

  if (!canView) return null;

  return (
    <section className="rounded-[16px] border border-border/70 bg-white p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <button
          type="button"
          onClick={() => void exportCsv()}
          disabled={csvBusy || items.length === 0}
          className="inline-flex h-9 items-center rounded-lg border border-border/80 px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {csvBusy ? t("pages.assignmentHistory.exportingButton") : t("pages.assignmentHistory.exportCsvButton")}
        </button>
      </div>

      <div className="mb-3 grid grid-cols-1 gap-2.5 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">{t("pages.vehicleDetail.fromLabel")}</span>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="h-10 rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">{t("pages.vehicleDetail.toLabel")}</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="h-10 rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-ink-muted">{t("common.status")}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AssignmentHistoryStatus)}
            className="h-10 rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          >
            <option value="all">{t("pages.assignmentHistory.statusAllOption")}</option>
            <option value="active">{t("pages.assignmentHistory.statusActiveOption")}</option>
            <option value="returned">{t("pages.assignmentHistory.statusReturnedOption")}</option>
          </select>
        </label>
        <label className="flex min-w-[12rem] flex-col gap-1 sm:col-span-2 lg:col-span-1">
          <span className="text-xs text-ink-muted">{t("common.search")}</span>
          <input
            type="search"
            placeholder={mode === "driver" ? t("pages.assignmentHistory.searchPlateMakeModelPlaceholder") : t("pages.assignmentHistory.searchDriverNamePhonePlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
          />
        </label>
      </div>

      {query.isLoading && <p className="text-sm text-ink-muted">{t("pages.assignmentHistory.loadingHistoryEllipsis")}</p>}
      {query.isError && (
        <p className="text-sm text-red-600">{t("pages.assignmentHistory.failedToLoadAssignmentHistory")}</p>
      )}
      {!query.isLoading && !query.isError && items.length === 0 && (
        <p className="text-sm text-ink-muted">{t("pages.assignmentHistory.noAssignmentHistoryYet")}</p>
      )}

      {items.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-border/70 bg-slate-50/40">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F8FAFC]">
              <tr className="border-b border-border text-left text-xs text-ink-muted">
                {mode === "driver" ? (
                  <>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.assignmentHistory.vehicleColumnLabel")}</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.assignmentHistory.plateColumnLabel")}</th>
                  </>
                ) : (
                  <>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.vehicleDetail.driverLabel")}</th>
                    <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.invoiceForm.phoneLabel")}</th>
                  </>
                )}
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.assignmentHistory.assignedColumnLabel")}</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.assignmentHistory.returnedColumnLabel")}</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide">{t("pages.assignmentHistory.daysColumnLabel")}</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide">{t("pages.vehicleDetail.weeklyRentShortLabel")}</th>
                <th className="px-3 py-2 text-right font-semibold uppercase tracking-wide">
                  {mode === "driver" ? t("pages.assignmentHistory.totalRentPaidColumnLabel") : t("pages.assignmentHistory.totalRentCollectedColumnLabel")}
                </th>
                <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("pages.invoiceDetail.notesLabel")}</th>
                {mode === "driver" && canViewPayouts && (
                    <th className="px-3 py-2 font-semibold uppercase tracking-wide">{t("common.actions")}</th>
                  )}
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id} className="border-b border-border/70 bg-white hover:bg-brand-mint/15">
                  {mode === "driver" ? (
                    <>
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/vehicles/${row.vehicle_id}`}
                          className="text-brand hover:underline"
                        >
                          {row.vehicle_name?.trim() ||
                            `${row.make ?? ""} ${row.model ?? ""}`.trim() ||
                            t("pages.assignmentHistory.vehicleFallback")}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs">{row.license_plate ?? "—"}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-3 py-2.5">
                        <Link
                          to={`/drivers/${row.driver_id}`}
                          className="text-brand hover:underline"
                        >
                          {row.driver_name || t("pages.assignmentHistory.driverFallback")}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5">{row.driver_phone ?? "—"}</td>
                    </>
                  )}
                  <td className="px-3 py-2.5 whitespace-nowrap">{formatDisplayDate(row.assigned_at)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {row.is_active || !row.unassigned_at ? (
                      <span className="inline-flex h-6 items-center rounded-full bg-emerald-100 px-2.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200/70">
                        {t("pages.assignmentHistory.activeBadge")}
                      </span>
                    ) : (
                      formatDisplayDate(row.unassigned_at)
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{row.days_held}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {row.weekly_rent_at_time != null
                      ? formatCurrency(Number(row.weekly_rent_at_time))
                      : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">
                    {formatCurrency(Number(row.total_rent_paid ?? 0))}
                  </td>
                  <td className="max-w-[10rem] truncate px-3 py-2.5 text-ink-muted" title={row.notes ?? undefined}>
                    {row.notes || "—"}
                  </td>
                  {mode === "driver" && canViewPayouts && (
                    <td className="px-3 py-2.5 whitespace-nowrap">
                      <Link
                        to={payoutPeriodLink(row)}
                        className="text-xs text-brand hover:underline"
                      >
                        {t("pages.assignmentHistory.viewPayoutsLink")}
                      </Link>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
