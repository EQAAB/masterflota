import type { Subcontractor } from "../../api/subcontractors";
import { formatKpiCount } from "../../utils/subcontractorDisplay";
import { KpiStatCard } from "../dashboard/KpiStatCard";

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 13h.01M15 13h.01"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"
      />
    </svg>
  );
}

function NetworkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6l2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6l2.1-2.1"
      />
    </svg>
  );
}

function UserOffIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.75}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14M4 4l16 16"
      />
    </svg>
  );
}

type SubcontractorsKpiCardsProps = {
  subcontractors: Subcontractor[] | undefined;
};

export function SubcontractorsKpiCards({ subcontractors }: SubcontractorsKpiCardsProps) {
  const rows = subcontractors ?? [];
  const totalDrivers = rows.reduce((sum, s) => sum + (s.driver_count ?? 0), 0);
  const activeCount = rows.filter((s) => s.status === "active").length;
  const inactiveCount = rows.filter((s) => s.status === "inactive").length;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiStatCard
        title="Total subcontractors"
        value={formatKpiCount(rows.length)}
        subtitle="Active partners"
        icon={<BuildingIcon className="h-5 w-5" />}
        iconClassName="bg-success/10 text-success"
      />
      <KpiStatCard
        title="Total drivers"
        value={formatKpiCount(totalDrivers)}
        subtitle="Across all subcontractors"
        icon={<UsersIcon className="h-5 w-5" />}
      />
      <KpiStatCard
        title="Active subcontractors"
        value={formatKpiCount(activeCount)}
        subtitle="Currently active"
        icon={<NetworkIcon className="h-5 w-5" />}
        iconClassName="bg-warning/10 text-warning"
      />
      <KpiStatCard
        title="Inactive subcontractors"
        value={formatKpiCount(inactiveCount)}
        subtitle="Not active"
        icon={<UserOffIcon className="h-5 w-5" />}
        iconClassName="bg-purple-100 text-purple-700"
      />
    </div>
  );
}
