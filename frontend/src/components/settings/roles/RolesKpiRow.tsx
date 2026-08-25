import { useTranslation } from "react-i18next";
import type { RolesKpis } from "./rolesListUtils";

type RolesKpiRowProps = {
  kpis?: RolesKpis;
  loading?: boolean;
};

export function RolesKpiRow({ kpis, loading }: RolesKpiRowProps) {
  const { t } = useTranslation();
  const CARDS = [
    { key: "total", label: t("pages.roles.kpiTotalRoles"), field: "total" as const },
    { key: "system", label: t("pages.roles.kpiSystemRoles"), field: "system" as const },
    { key: "custom", label: t("pages.roles.kpiCustomRoles"), field: "custom" as const },
    { key: "permissions", label: t("pages.roles.kpiPermissions"), field: "permissionCount" as const },
  ];

  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-settings-roles__skeleton fm-settings-roles__kpi min-h-[96px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map((card) => (
        <article key={card.key} className="fm-settings-roles__kpi">
          <div className="flex items-center gap-3">
            <span className="fm-settings-roles__kpi-icon" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums tracking-tight text-ink">{kpis?.[card.field] ?? 0}</p>
              <p className="text-sm text-ink-muted">{card.label}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
