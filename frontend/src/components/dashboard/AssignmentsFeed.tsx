import { Link } from "react-router-dom";
import type { RecentAssignmentItem } from "../../api/dashboard";
import { formatCurrency } from "../../utils/currency";
import { DashboardChartCard } from "./DashboardChartCard";
import { EmptyState } from "../theme/EmptyState";
import { ActivityEmptyIllustration } from "./illustrations/ActivityEmptyIllustration";

export interface AssignmentsFeedProps {
  items: RecentAssignmentItem[];
  isLoading?: boolean;
  isError?: boolean;
}

export function AssignmentsFeed({ items, isLoading, isError }: AssignmentsFeedProps) {
  return (
    <DashboardChartCard title="Recent assignments" minHeight={320}>
      {isLoading && <p className="text-sm text-ink-muted py-8 text-center">Loading…</p>}
      {!isLoading && isError && (
        <p className="text-sm text-danger py-8 text-center">Failed to load assignments. Try refreshing.</p>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <EmptyState
          title="No assignment history yet"
          description="Vehicle assignments will show up here when drivers are linked to fleet vehicles."
          illustration={<ActivityEmptyIllustration />}
          className="border-0 bg-transparent py-6"
        />
      )}
      {!isLoading && !isError && items.length > 0 && (
        <ul className="space-y-3">
          {items.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border/60 bg-surface-elevated/50 px-4 py-3 transition-all duration-200 hover:border-brand/20 hover:shadow-card"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">
                    <Link to={`/drivers/${a.driver_id}`} className="text-brand hover:underline">
                      {a.driver_name || "Driver"}
                    </Link>
                    <span className="mx-1.5 text-ink-muted">→</span>
                    <Link to={`/vehicles/${a.vehicle_id}`} className="text-brand hover:underline">
                      {a.vehicle_name?.trim() || a.license_plate || "Vehicle"}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-ink-muted">
                    Assigned {a.assigned_at.split("T")[0]}
                    {a.is_active ? (
                      <span className="ml-2 inline-flex rounded-full bg-brand-mint px-2 py-0.5 text-xs font-medium text-brand-dark">
                        Active
                      </span>
                    ) : a.unassigned_at ? (
                      <span className="ml-1">· Returned {a.unassigned_at.split("T")[0]}</span>
                    ) : null}
                  </p>
                </div>
                {a.weekly_rent_at_time != null && (
                  <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-xs font-medium tabular-nums text-ink-muted ring-1 ring-border">
                    {formatCurrency(Number(a.weekly_rent_at_time))}/wk
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardChartCard>
  );
}
