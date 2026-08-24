import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { DashboardStats } from "../../api/dashboard";
import { useAuthStore } from "../../store/authStore";
import { roleLabel } from "../../lib/roleLabel";
import { btnSecondary } from "../../theme/classNames";
import i18n from "../../i18n";
import type { DashboardDatePreset } from "../../utils/dashboardDateRange";
import { formatCurrency } from "../../utils/currency";

const PRESETS: { id: DashboardDatePreset; key: "presetToday" | "presetWeek" | "presetMonth" }[] = [
  { id: "today", key: "presetToday" },
  { id: "week", key: "presetWeek" },
  { id: "month", key: "presetMonth" },
];

function initials(firstName?: string, lastName?: string): string {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export type DashboardAlertItem = {
  id: string;
  label: string;
  detail: string;
  to: string;
};

export type DashboardTopBarProps = {
  preset: DashboardDatePreset;
  customDate: string;
  onPresetChange: (preset: DashboardDatePreset) => void;
  onCustomDateChange: (date: string) => void;
  rangeLabel?: string;
  alerts?: DashboardAlertItem[];
};

export function DashboardTopBar({
  preset,
  customDate,
  onPresetChange,
  onCustomDateChange,
  rangeLabel,
  alerts = [],
}: DashboardTopBarProps) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setAlertsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const subtitle = user
    ? t("pages.dashboard.roleOverview", { role: roleLabel(user.role) })
    : t("pages.dashboard.fleetOverview");

  return (
    <header className="shrink-0 border-b border-border/60 bg-surface-card/90 px-4 py-5 backdrop-blur-md sm:px-6">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight text-ink">
            {user ? t("pages.dashboard.welcome", { name: user.firstName }) : t("pages.dashboard.welcomeGuest")}
          </h1>
          <p className="mt-0.5 text-sm text-ink-muted">{subtitle}</p>
          {rangeLabel && (
            <p className="mt-1 text-xs text-ink-muted">
              {t("pages.dashboard.topBar.periodFilterLabel")} <span className="font-medium text-ink">{rangeLabel}</span>
              <span className="text-ink-muted">{t("pages.dashboard.topBar.periodFilterSuffix")}</span>
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-surface-elevated p-1"
            role="group"
            aria-label={t("pages.dashboard.topBar.dateRangeAriaLabel")}
          >
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetChange(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  preset === p.id
                    ? "bg-brand text-white shadow-soft"
                    : "text-ink-muted hover:bg-white hover:text-ink"
                }`}
              >
                {t(`pages.dashboard.topBar.${p.key}`)}
              </button>
            ))}
            <input
              type="date"
              value={customDate}
              onChange={(e) => {
                onCustomDateChange(e.target.value);
                onPresetChange("custom");
              }}
              className="rounded-lg border-0 bg-transparent px-2 py-1.5 text-xs text-ink focus:ring-2 focus:ring-brand/20"
              aria-label={t("pages.dashboard.topBar.customDateAriaLabel")}
            />
          </div>

          <div className="relative" ref={alertsRef}>
            <button
              type="button"
              onClick={() => setAlertsOpen((o) => !o)}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-ink-muted shadow-sm transition-all hover:bg-surface hover:text-ink"
              aria-label={t("pages.dashboard.topBar.alertsAriaLabel")}
              aria-expanded={alertsOpen}
              aria-haspopup="menu"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              {alerts.length > 0 && (
                <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white ring-2 ring-white">
                  {alerts.length > 9 ? "9+" : alerts.length}
                </span>
              )}
            </button>
            {alertsOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-border bg-white p-2 shadow-card-hover"
                role="menu"
              >
                <p className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t("pages.dashboard.needsAttentionTitle")}
                </p>
                {alerts.length === 0 ? (
                  <p className="px-3 py-3 text-sm text-ink-muted">{t("pages.dashboard.topBar.noOpenAlerts")}</p>
                ) : (
                  <ul className="max-h-72 space-y-0.5 overflow-y-auto">
                    {alerts.map((a) => (
                      <li key={a.id}>
                        <Link
                          to={a.to}
                          role="menuitem"
                          onClick={() => setAlertsOpen(false)}
                          className="block rounded-lg px-3 py-2 hover:bg-surface"
                        >
                          <p className="text-sm font-medium text-ink">{a.label}</p>
                          <p className="text-xs text-ink-muted">{a.detail}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-xl border border-border bg-white py-1.5 pl-1.5 pr-3 shadow-sm transition-all hover:shadow-card"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-semibold text-white">
                {initials(user?.firstName, user?.lastName)}
              </span>
              {!menuOpen && (
                <span className="hidden text-sm font-medium text-ink sm:inline max-w-[120px] truncate">
                  {user?.firstName ?? t("profile.account")}
                </span>
              )}
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-border bg-white p-2 shadow-card-hover"
                role="menu"
              >
                <div className="border-b border-border px-3 pb-2 mb-2">
                  <p className="text-sm font-semibold text-ink truncate">
                    {user ? `${user.firstName} ${user.lastName}` : t("roles.user")}
                  </p>
                  <p className="text-xs text-ink-muted truncate">{user?.email}</p>
                  <p className="text-xs text-brand mt-0.5">{roleLabel(user?.role)}</p>
                </div>
                <Link
                  to="/drivers"
                  className="block rounded-lg px-3 py-2 text-sm text-ink hover:bg-surface"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("pages.dashboard.topBar.viewDrivers")}
                </Link>
                <button
                  type="button"
                  className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-danger hover:bg-danger/5"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                >
                  {t("auth.logOut")}
                </button>
              </div>
            )}
          </div>

          <Link to="/drivers" className={`${btnSecondary} hidden lg:inline-flex text-sm`}>
            {t("pages.dashboard.topBar.allDrivers")}
          </Link>
        </div>
      </div>
    </header>
  );
}

/** Build alert list from dashboard stats for the notifications menu. */
export function buildDashboardAlerts(stats: DashboardStats): DashboardAlertItem[] {
  const items: DashboardAlertItem[] = [];
  if (stats.overdueRentals != null && stats.overdueRentals > 0) {
    items.push({
      id: "overdue-rentals",
      label: i18n.t("pages.dashboard.kpiOverdueRentals"),
      detail: i18n.t("pages.dashboard.topBar.alertOverdueRentalsDetail", { count: stats.overdueRentals }),
      to: "/rentals/bookings",
    });
  }
  if (stats.outstandingLoans != null && stats.outstandingLoans > 0) {
    items.push({
      id: "loans",
      label: i18n.t("pages.dashboard.kpiOutstandingLoans"),
      detail: i18n.t("pages.dashboard.topBar.alertAmountDrivers", {
        amount: formatCurrency(stats.outstandingLoans ?? 0),
        count: stats.driversWithLoans ?? 0,
      }),
      to: "/earnings/loans",
    });
  }
  if (stats.outstandingDebt != null && stats.outstandingDebt > 0) {
    items.push({
      id: "debt",
      label: i18n.t("pages.dashboard.kpiPlatformDebt"),
      detail: i18n.t("pages.dashboard.topBar.alertAmountDrivers", {
        amount: formatCurrency(stats.outstandingDebt ?? 0),
        count: stats.driversWithDebt ?? 0,
      }),
      to: "/earnings/payouts",
    });
  }
  if (stats.pendingPayoutRows != null && stats.pendingPayoutRows > 0) {
    items.push({
      id: "pending-payouts",
      label: i18n.t("pages.dashboard.topBar.alertPendingPayoutsLabel"),
      detail: i18n.t("pages.dashboard.topBar.alertPendingPayoutsDetail", {
        count: stats.pendingPayoutRows,
        amount: formatCurrency(stats.pendingPayments ?? 0),
      }),
      to: "/earnings/payouts",
    });
  }
  if ((stats.expiredDocuments ?? 0) > 0) {
    items.push({
      id: "expired-docs",
      label: i18n.t("pages.dashboard.kpiExpiredDocuments"),
      detail: i18n.t("pages.dashboard.topBar.alertExpiredDocsDetail", { count: stats.expiredDocuments }),
      to: "/drivers",
    });
  }
  if ((stats.pendingDocuments ?? 0) > 0) {
    items.push({
      id: "pending-docs",
      label: i18n.t("pages.dashboard.kpiPendingDocuments"),
      detail: i18n.t("pages.dashboard.topBar.alertPendingDocsDetail", { count: stats.pendingDocuments }),
      to: "/drivers",
    });
  }
  return items;
}
