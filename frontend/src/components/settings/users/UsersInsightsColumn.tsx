import { useTranslation } from "react-i18next";
import type { OrgUser } from "../../../api/users";
import type { AuditLogItem } from "../../../api/audit";
import { computeRoleSummary, formatAuditAction, formatRelativeTime } from "./usersListUtils";

type UsersInsightsColumnProps = {
  users: OrgUser[];
  activity?: AuditLogItem[];
  activityLoading?: boolean;
};

function useSummaryItems() {
  const { t } = useTranslation();
  return [
  {
    key: "superAdmin",
    label: t("pages.users.superAdminLabel"),
    iconClass: "fm-settings-users__summary-kpi-icon--super",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    key: "admin",
    label: t("pages.users.adminLabel"),
    iconClass: "fm-settings-users__summary-kpi-icon--admin",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    key: "active",
    label: t("status.active"),
    iconClass: "fm-settings-users__summary-kpi-icon--active",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "inactive",
    label: t("status.inactive"),
    iconClass: "fm-settings-users__summary-kpi-icon--inactive",
    icon: (
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  ] as const;
}

export function UsersInsightsColumn({ users, activity, activityLoading }: UsersInsightsColumnProps) {
  const { t } = useTranslation();
  const SUMMARY_ITEMS = useSummaryItems();
  const summary = computeRoleSummary(users);
  const events = activity ?? [];

  return (
    <aside className="fm-settings-users__insights space-y-3">
      <section className="fm-settings-users__insight-card">
        <h2 className="text-sm font-semibold text-ink">{t("pages.users.roleSummaryTitle")}</h2>
        <p className="mt-0.5 text-xs text-ink-muted">{t("pages.users.roleSummarySubtitle")}</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {SUMMARY_ITEMS.map((item) => (
            <div key={item.key} className="fm-settings-users__summary-kpi">
              <span className={`fm-settings-users__summary-kpi-icon ${item.iconClass}`} aria-hidden>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-xl font-bold leading-none tabular-nums text-ink">{summary[item.key]}</p>
                <p className="mt-1 text-[11px] text-ink-muted">{item.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="fm-settings-users__insight-card fm-settings-users__insight-card--activity">
        <h2 className="text-sm font-semibold text-ink">{t("pages.users.recentActivityTitle")}</h2>
        <p className="mt-0.5 text-xs text-ink-muted">{t("pages.users.recentActivitySubtitle")}</p>

        {activityLoading ? (
          <div className="mt-4 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="fm-settings-users__skeleton h-12" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="fm-settings-users__insight-empty">
            <svg
              className="fm-settings-users__insight-empty-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-sm font-medium text-ink">{t("pages.users.noRecentActivityTitle")}</p>
            <p className="mt-1 text-xs text-ink-muted">{t("pages.users.noRecentActivityDesc")}</p>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {events.slice(0, 5).map((event) => (
              <li key={event.id} className="fm-settings-users__activity-item">
                <p className="text-sm font-medium capitalize text-ink">{formatAuditAction(event.action)}</p>
                <p className="mt-0.5 text-xs text-ink-muted">
                  {event.actorName || event.actorEmail || t("pages.users.systemFallback")}
                  <span className="mx-1.5 text-slate-300">·</span>
                  {formatRelativeTime(event.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
