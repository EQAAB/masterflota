import type { UsersKpis } from "./usersListUtils";

type UsersKpiRowProps = {
  kpis?: UsersKpis;
  loading?: boolean;
};

const KPI_CONFIG = [
  { key: "total", label: "Total Users", field: "total" as const },
  { key: "active", label: "Active Users", field: "active" as const },
  { key: "inactive", label: "Inactive Users", field: "inactive" as const },
  { key: "admin", label: "Admin Users", field: "admin" as const },
];

export function UsersKpiRow({ kpis, loading }: UsersKpiRowProps) {
  if (loading) {
    return (
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="fm-settings-users__skeleton fm-settings-users__kpi min-h-[96px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {KPI_CONFIG.map((card) => (
        <article key={card.key} className="fm-settings-users__kpi">
          <div className="flex items-center gap-3">
            <span className="fm-settings-users__kpi-icon" aria-hidden>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.75}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
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
