import { useTranslation } from "react-i18next";
import type { UsersKpis } from "./usersListUtils";

type UsersKpiRowProps = {
  kpis?: UsersKpis;
  loading?: boolean;
};

function useKpiConfig() {
  const { t } = useTranslation();
  return [
  {
    key: "total",
    label: t("pages.users.kpiTotalUsers"),
    helper: t("pages.users.kpiTotalUsersHelper"),
    field: "total" as const,
    iconClass: "fm-settings-users__kpi-icon--total",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    key: "active",
    label: t("pages.users.kpiActiveUsers"),
    helper: t("pages.users.kpiActiveUsersHelper"),
    field: "active" as const,
    iconClass: "fm-settings-users__kpi-icon--active",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    key: "inactive",
    label: t("pages.users.kpiInactiveUsers"),
    helper: t("pages.users.kpiInactiveUsersHelper"),
    field: "inactive" as const,
    iconClass: "fm-settings-users__kpi-icon--inactive",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    key: "admin",
    label: t("pages.users.kpiAdminUsers"),
    helper: t("pages.users.kpiAdminUsersHelper"),
    field: "admin" as const,
    iconClass: "fm-settings-users__kpi-icon--admin",
    icon: (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.75}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  ];
}

export function UsersKpiRow({ kpis, loading }: UsersKpiRowProps) {
  const KPI_CONFIG = useKpiConfig();
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-settings-users__skeleton fm-settings-users__kpi h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((card) => (
        <article key={card.key} className="fm-settings-users__kpi">
          <div className="flex items-start gap-3">
            <span className={`fm-settings-users__kpi-icon ${card.iconClass}`} aria-hidden>
              {card.icon}
            </span>
            <div className="min-w-0">
              <p className="text-[2rem] font-extrabold leading-none tabular-nums tracking-tight text-ink">
                {kpis?.[card.field] ?? 0}
              </p>
              <p className="mt-0.5 text-sm font-medium text-ink">{card.label}</p>
              <p className="mt-0.5 text-xs text-ink-muted">{card.helper}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
