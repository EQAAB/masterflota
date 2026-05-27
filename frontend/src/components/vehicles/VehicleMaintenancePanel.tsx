import { useMemo, useState } from "react";
import type { VehicleMaintenance } from "../../api/vehicles";
import { formatCurrency } from "../../utils/currency";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = value.split("T")[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 ring-1 ring-amber-200/70",
  in_progress: "bg-sky-100 text-sky-800 ring-1 ring-sky-200/70",
  completed: "bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/70",
  cancelled: "bg-slate-100 text-slate-600 ring-1 ring-slate-200/80",
};

function maintenanceTypeVisual(type: string): { iconClass: string; label: string } {
  const t = type.toLowerCase();
  if (t.includes("tire") || t.includes("tyre") || t.includes("wheel")) {
    return { iconClass: "bg-emerald-100 text-emerald-700", label: "T" };
  }
  if (t.includes("engine") || t.includes("motor")) {
    return { iconClass: "bg-sky-100 text-sky-700", label: "E" };
  }
  if (t.includes("body") || t.includes("paint") || t.includes("dent")) {
    return { iconClass: "bg-orange-100 text-orange-700", label: "B" };
  }
  if (t.includes("oil") || t.includes("fluid")) {
    return { iconClass: "bg-amber-100 text-amber-700", label: "O" };
  }
  if (t.includes("brake")) {
    return { iconClass: "bg-rose-100 text-rose-700", label: "Br" };
  }
  return { iconClass: "bg-slate-100 text-slate-600", label: type.charAt(0).toUpperCase() || "M" };
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
      />
    </svg>
  );
}

type VehicleMaintenancePanelProps = {
  records: VehicleMaintenance[];
  canEdit: boolean;
  onAdd: () => void;
};

export function VehicleMaintenancePanel({ records, canEdit, onAdd }: VehicleMaintenancePanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const stats = useMemo(() => {
    const pending = records.filter((r) => r.status === "pending").length;
    const inProgress = records.filter((r) => r.status === "in_progress").length;
    const completed = records.filter((r) => r.status === "completed").length;
    return { total: records.length, pending, inProgress, completed };
  }, [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      const hay = `${r.maintenance_type} ${r.description ?? ""} ${r.mechanic_name ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [records, search, statusFilter]);

  const statCards = [
    { label: "Total jobs", value: stats.total, className: "bg-slate-50" },
    { label: "Pending", value: stats.pending, className: "bg-amber-50/80" },
    { label: "In progress", value: stats.inProgress, className: "bg-sky-50/80" },
    { label: "Completed", value: stats.completed, className: "bg-emerald-50/80" },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((s) => (
          <div
            key={s.label}
            className={`rounded-[14px] border border-border/70 px-3 py-3 shadow-soft ${s.className}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-900">{s.value}</p>
          </div>
        ))}
      </div>

      <section className="overflow-hidden rounded-[16px] border border-border/70 bg-white shadow-soft">
        <div className="border-b border-border/70 px-4 py-4 sm:px-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">Maintenance</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Track scheduled work, costs, and service status for this vehicle.
              </p>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={onAdd}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-gradient px-4 text-sm font-medium text-white shadow-sm hover:opacity-95 hover:shadow-md"
              >
                <PlusIcon className="h-4 w-4" />
                Add maintenance
              </button>
            )}
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr_11rem]">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search type, description, mechanic…"
              className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 w-full rounded-xl border border-border/80 bg-white px-3 text-sm shadow-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-brand-mint/40 text-brand">
              <WrenchIcon className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium text-slate-800">
              {records.length === 0 ? "No maintenance records yet" : "No matching records"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {records.length === 0
                ? "Add the first service entry to start tracking maintenance history."
                : "Try adjusting your search or status filter."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 z-10 bg-[#F8FAFC]">
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Type
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Description
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Scheduled
                  </th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Cost
                  </th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const visual = maintenanceTypeVisual(m.maintenance_type);
                  return (
                    <tr
                      key={m.id}
                      className="border-b border-slate-100/90 bg-white transition-colors duration-150 hover:bg-brand-mint/15"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${visual.iconClass}`}
                          >
                            {visual.label}
                          </span>
                          <span className="font-medium text-slate-900">{m.maintenance_type}</span>
                        </div>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="text-slate-800">{m.description ?? "—"}</p>
                        {m.mechanic_name && (
                          <p className="mt-0.5 text-xs text-slate-500">Mechanic: {m.mechanic_name}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-slate-700">
                        {formatDate(m.scheduled_date)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-right font-medium tabular-nums text-slate-900">
                        {m.cost != null ? formatCurrency(Number(m.cost)) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex h-7 items-center rounded-full px-3 text-xs font-medium capitalize ${STATUS_STYLES[m.status] ?? STATUS_STYLES.pending}`}
                        >
                          {m.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
