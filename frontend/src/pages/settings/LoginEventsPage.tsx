import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import i18n from "../../i18n";
import { fetchLoginEvents, fetchLoginEventsSummary } from "../../api/loginEvents";
import { OrgContextGate } from "../../components/layout/OrgContextGate";
import { usePermission } from "../../lib/permissions";
import { btnSecondary, dashboardPage } from "../../theme/classNames";

function eventLabel(eventType: string): string {
  switch (eventType) {
    case "login.success":
      return i18n.t("pages.loginActivity.eventLoginSuccess");
    case "login.failed":
      return i18n.t("pages.loginActivity.eventLoginFailed");
    case "logout.success":
      return i18n.t("pages.loginActivity.eventLogout");
    case "session.revoked":
      return i18n.t("pages.loginActivity.eventSessionRevoked");
    default:
      return eventType;
  }
}

function failureLabel(reason: string): string {
  switch (reason) {
    case "invalid_credentials":
      return i18n.t("pages.loginActivity.failureInvalidPassword");
    case "inactive_user":
      return i18n.t("pages.loginActivity.failureInactiveAccount");
    case "unknown_email":
      return i18n.t("pages.loginActivity.failureUnknownEmail");
    default:
      return reason;
  }
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function truncateUserAgent(ua: string | null, max = 48): string {
  if (!ua) return "—";
  return ua.length > max ? `${ua.slice(0, max)}…` : ua;
}

function eventBadgeClass(eventType: string): string {
  if (eventType === "login.success") return "bg-emerald-50 text-emerald-800 ring-emerald-200/80";
  if (eventType === "login.failed") return "bg-rose-50 text-rose-800 ring-rose-200/80";
  if (eventType === "logout.success") return "bg-slate-100 text-slate-700 ring-slate-200/80";
  return "bg-amber-50 text-amber-900 ring-amber-200/80";
}

type KpiCardProps = {
  label: string;
  value: number;
  warn?: boolean;
  loading?: boolean;
};

function KpiCard({ label, value, warn, loading }: KpiCardProps) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${
        warn && value > 0
          ? "border-rose-200 bg-rose-50/80"
          : "border-border/60 bg-white"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${warn && value > 0 ? "text-rose-800" : "text-ink"}`}>
        {loading ? "…" : value.toLocaleString()}
      </p>
    </div>
  );
}

export function LoginEventsPage() {
  const { t } = useTranslation();
  const canView = usePermission("users.manage");
  const [page, setPage] = useState(1);
  const [eventType, setEventType] = useState("");
  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [ip, setIp] = useState("");
  const [debouncedIp, setDebouncedIp] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedEmail(email.trim()), 300);
    return () => window.clearTimeout(id);
  }, [email]);

  useEffect(() => {
    const id = window.setTimeout(() => setDebouncedIp(ip.trim()), 300);
    return () => window.clearTimeout(id);
  }, [ip]);

  const summaryQuery = useQuery({
    queryKey: ["login-events", "summary"],
    queryFn: () => fetchLoginEventsSummary(24).then((r) => r.data),
    enabled: canView,
  });

  const eventsQuery = useQuery({
    queryKey: [
      "login-events",
      page,
      eventType,
      debouncedEmail,
      debouncedIp,
      from,
      to,
      suspiciousOnly,
    ],
    queryFn: () =>
      fetchLoginEvents({
        page,
        limit: 25,
        eventType: eventType || undefined,
        email: debouncedEmail || undefined,
        ip: debouncedIp || undefined,
        from: from || undefined,
        to: to || undefined,
        suspiciousOnly,
        suspiciousHours: 24,
      }).then((r) => r.data),
    enabled: canView,
  });

  const summary = summaryQuery.data;
  const data = eventsQuery.data;
  const items = data?.items ?? [];

  if (!canView) {
    return (
      <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <p className="text-ink-muted">{t("pages.loginActivity.noAccessLoginActivity")}</p>
        </div>
      </div>
    );
  }

  return (
    <OrgContextGate>
      <div className="fm-settings-roles flex min-h-full flex-1 flex-col">
        <div className={dashboardPage}>
          <header className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-ink">{t("pages.loginActivity.title")}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {t("pages.loginActivity.subtitle")}
            </p>
          </header>

          {summary?.recent_failed_spike && (
            <div
              className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
              role="status"
            >
              {t("pages.loginActivity.failedSpikeWarning")}
            </div>
          )}

          <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label={t("pages.loginActivity.kpiSuccessfulLogins")}
              value={summary?.success_count ?? 0}
              loading={summaryQuery.isLoading}
            />
            <KpiCard
              label={t("pages.loginActivity.kpiFailedLogins")}
              value={summary?.failed_count ?? 0}
              warn
              loading={summaryQuery.isLoading}
            />
            <KpiCard
              label={t("pages.loginActivity.kpiSuspiciousIps")}
              value={summary?.suspicious_ips.length ?? 0}
              warn
              loading={summaryQuery.isLoading}
            />
            <KpiCard
              label={t("pages.loginActivity.kpiSuspiciousEmails")}
              value={summary?.suspicious_emails.length ?? 0}
              warn
              loading={summaryQuery.isLoading}
            />
          </div>

          {(summary?.suspicious_ips.length ?? 0) > 0 || (summary?.suspicious_emails.length ?? 0) > 0 ? (
            <div className="mb-5 rounded-2xl border border-border/60 bg-slate-50/50 px-4 py-3 text-sm">
              <p className="mb-2 font-medium text-ink">{t("pages.loginActivity.monitoringAlertsTitle")}</p>
              <div className="flex flex-wrap gap-2">
                {summary?.suspicious_ips.map((s) => (
                  <span
                    key={s.ipAddress}
                    className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-medium text-rose-800"
                  >
                    {s.ipAddress} ({s.attemptCount})
                  </span>
                ))}
                {summary?.suspicious_emails.map((s) => (
                  <span
                    key={s.email}
                    className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900"
                  >
                    {s.email} ({s.attemptCount})
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="fm-settings-roles__toolbar mb-5 flex flex-wrap gap-2">
            <select
              className="fm-settings-roles__filter-select"
              value={eventType}
              onChange={(e) => {
                setEventType(e.target.value);
                setPage(1);
              }}
              aria-label={t("pages.loginActivity.filterByEventTypeAria")}
            >
              <option value="">{t("pages.loginActivity.allEventsOption")}</option>
              <option value="login.success">{t("pages.loginActivity.eventLoginSuccess")}</option>
              <option value="login.failed">{t("pages.loginActivity.eventLoginFailed")}</option>
              <option value="logout.success">{t("pages.loginActivity.eventLogout")}</option>
              <option value="session.revoked">{t("pages.loginActivity.eventSessionRevoked")}</option>
            </select>
            <input
              type="search"
              className="fm-settings-roles__filter-select min-w-[10rem]"
              placeholder={t("pages.loginActivity.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setPage(1);
              }}
              aria-label={t("pages.loginActivity.filterByEmailAria")}
            />
            <input
              type="search"
              className="fm-settings-roles__filter-select min-w-[8rem]"
              placeholder={t("pages.loginActivity.ipPlaceholder")}
              value={ip}
              onChange={(e) => {
                setIp(e.target.value);
                setPage(1);
              }}
              aria-label={t("pages.loginActivity.filterByIpAria")}
            />
            <input
              type="datetime-local"
              className="fm-settings-roles__filter-select"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
              aria-label={t("pages.loginActivity.fromDateAria")}
            />
            <input
              type="datetime-local"
              className="fm-settings-roles__filter-select"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
              aria-label={t("pages.loginActivity.toDateAria")}
            />
            <label className="flex items-center gap-2 rounded-xl border border-border/60 bg-white px-3 py-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={suspiciousOnly}
                onChange={(e) => {
                  setSuspiciousOnly(e.target.checked);
                  setPage(1);
                }}
              />
              {t("pages.loginActivity.suspiciousOnlyLabel")}
            </label>
          </div>

          <div className="fm-settings-roles__table-shell overflow-x-auto">
            {eventsQuery.isLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="fm-settings-roles__skeleton h-12" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="px-6 py-14 text-center text-sm text-ink-muted">
                {t("pages.loginActivity.noLoginEventsRecorded")}
              </div>
            ) : (
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200/90 bg-slate-50/90 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-3.5">{t("pages.auditLog.colWhen")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colUserEmail")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colEvent")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colIp")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colLocation")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colDevice")}</th>
                    <th className="px-5 py-3.5">{t("pages.loginActivity.colDetails")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100/90 hover:bg-slate-50/80">
                      <td className="px-5 py-4 text-ink-muted">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-ink">{item.userName || item.emailAttempted}</p>
                        {item.userEmail && item.userEmail !== item.emailAttempted && (
                          <p className="text-xs text-ink-muted">{item.emailAttempted}</p>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${eventBadgeClass(item.eventType)}`}
                        >
                          {eventLabel(item.eventType)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-ink-muted">
                        {item.ipAddress || "—"}
                      </td>
                      <td className="px-5 py-4 text-ink-muted">{item.location || "—"}</td>
                      <td className="px-5 py-4 text-xs text-ink-muted" title={item.userAgent ?? undefined}>
                        {truncateUserAgent(item.userAgent)}
                      </td>
                      <td className="px-5 py-4 text-ink-muted">
                        {item.failureReason
                          ? failureLabel(item.failureReason)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {data && data.total > 0 && (
              <footer className="flex flex-col gap-3 border-t border-border/60 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-ink-muted">
                  {t("pages.auditLog.pageOfTotal", { page: data.page, totalPages: data.totalPages, total: data.total })}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t("pages.auditLog.previousButton")}
                  </button>
                  <button
                    type="button"
                    className={btnSecondary}
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t("pagination.next")}
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
