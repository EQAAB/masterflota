import { Link } from "react-router-dom";
import type { RentalDashboardFleet } from "../../../api/rentals";
import { RentalDashboardCard } from "./RentalDashboardCard";

type FleetAvailabilityOverviewProps = {
  fleet?: RentalDashboardFleet;
  activeBookings?: number;
  loading?: boolean;
  className?: string;
};

export function FleetAvailabilityOverview({
  fleet,
  activeBookings = 0,
  loading,
  className,
}: FleetAvailabilityOverviewProps) {
  const total = fleet?.total ?? 0;
  const available = fleet?.available ?? 0;
  const rented = fleet?.rented ?? 0;
  const maintenance = fleet?.maintenance ?? 0;
  const occupancyPct = total > 0 ? Math.round((activeBookings / total) * 100) : 0;

  const segments = [
    { label: "Available", count: available, color: "bg-emerald-500", pct: total ? (available / total) * 100 : 0 },
    { label: "Rented", count: rented, color: "bg-sky-500", pct: total ? (rented / total) * 100 : 0 },
    { label: "Maintenance", count: maintenance, color: "bg-amber-500", pct: total ? (maintenance / total) * 100 : 0 },
  ];

  return (
    <RentalDashboardCard title="Fleet availability" viewAllTo="/rentals/availability" className={className}>
      {loading ? (
        <div className="fm-rental-dashboard__skeleton h-40" />
      ) : (
        <>
          <div className="mb-4 flex items-end justify-between gap-2">
            <div>
              <p className="text-3xl font-bold tabular-nums text-ink">{occupancyPct}%</p>
              <p className="text-xs text-ink-muted">Rental occupancy (active / fleet)</p>
            </div>
            <p className="text-sm font-medium text-ink-muted">{total} vehicles</p>
          </div>
          <div className="fm-rental-dashboard__fleet-bar mb-4 flex">
            {segments.map((s) =>
              s.pct > 0 ? (
                <div
                  key={s.label}
                  className={`fm-rental-dashboard__fleet-bar-fill ${s.color}`}
                  style={{ width: `${s.pct}%` }}
                  title={`${s.label}: ${s.count}`}
                />
              ) : null,
            )}
          </div>
          <ul className="space-y-2">
            {segments.map((s) => (
              <li key={s.label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-muted">
                  <span className={`h-2 w-2 rounded-full ${s.color}`} />
                  {s.label}
                </span>
                <span className="font-semibold tabular-nums text-ink">{s.count}</span>
              </li>
            ))}
          </ul>
          <Link to="/vehicles" className="mt-4 block text-xs font-medium text-brand hover:underline">
            Manage fleet vehicles →
          </Link>
        </>
      )}
    </RentalDashboardCard>
  );
}
