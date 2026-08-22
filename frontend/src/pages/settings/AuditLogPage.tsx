import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { fetchAuditLogs } from "../../api/audit";
import { OrgContextGate } from "../../components/layout/OrgContextGate";
import { usePermission } from "../../lib/permissions";
import { btnSecondary, dashboardPage } from "../../theme/classNames";

function formatAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function AuditLogPage() {
  const { t } = useTranslation();
  const canView = usePermission("users.manage");
  const [page, setPage] = useState(1);
  const [entityType, setEntityType] = useState("");
  const [action, setAction] = useState("");

  const logsQuery = useQuery({
    queryKey: ["audit-logs", page, entityType, action],
    queryFn: () =>
      fetchAuditLogs({
        page,
        limit: 25,
        entityType: entityType || undefined,
        action: action || undefined,
      }).then((r) => r.data),
    enabled: canView,
  });

  const data = logsQuery.data;
  const items = data?.items ?? [];

  if (!canView) {
    return (
      <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <p className="text-ink-muted">You do not have access to view activity logs.</p>
        </div>
      </div>
    );
  }

  return (
    <OrgContextGate>
    <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
      <div className={dashboardPage}>
        <header className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.auditLog.title")}</h1>
          <p className="mt-1 text-sm text-ink-muted">{t("pages.auditLog.subtitle")}</p>
        </header>

        <div className="fm-settings-roles__toolbar mb-5 flex flex-wrap gap-2">
          <select
            className="fm-settings-roles__filter-select"
            value={entityType}
            onChange={(e) => {
              setEntityType(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by entity"
          >
            <option value="">All entities</option>
            <option value="user">User</option>
            <option value="role">Role</option>
          </select>
          <select
            className="fm-settings-roles__filter-select"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by action"
          >
            <option value="">All actions</option>
            <option value="user.created">User created</option>
            <option value="user.updated">User updated</option>
            <option value="user.deactivated">User deactivated</option>
            <option value="role.created">Role created</option>
            <option value="role.updated">Role updated</option>
            <option value="role.deleted">Role deleted</option>
            <option value="role.permissions_updated">Permissions updated</option>
          </select>
        </div>

        <div className="fm-settings-roles__table-shell overflow-x-auto">
          {logsQuery.isLoading ? (
            <div className="space-y-3 p-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="fm-settings-roles__skeleton h-12" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-ink-muted">No activity recorded yet.</div>
          ) : (
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">When</th>
                  <th className="px-5 py-3.5">Actor</th>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100/90 hover:bg-slate-50/80">
                    <td className="px-5 py-4 text-ink-muted">{formatDate(item.createdAt)}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink">{item.actorName || "System"}</p>
                      {item.actorEmail && <p className="text-xs text-ink-muted">{item.actorEmail}</p>}
                    </td>
                    <td className="px-5 py-4 capitalize text-ink">{formatAction(item.action)}</td>
                    <td className="px-5 py-4 text-ink-muted">
                      {item.entityType}
                      {item.entityId ? ` · ${item.entityId.slice(0, 8)}…` : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data && data.total > 0 && (
            <footer className="flex flex-col gap-3 border-t border-border/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink-muted">
                Page {data.page} of {data.totalPages} · {data.total} events
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  type="button"
                  className={btnSecondary}
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          )}
        </div>
      </div>
    </div>
    </OrgContextGate>
  );
}
