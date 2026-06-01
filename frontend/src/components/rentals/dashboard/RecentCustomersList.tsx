import { Link } from "react-router-dom";
import type { RentalDashboardCustomerRow } from "../../../api/rentals";
import { RentalDashboardCard } from "./RentalDashboardCard";
import { initialsFromName } from "./rentalDashboardUtils";

type RecentCustomersListProps = {
  customers?: RentalDashboardCustomerRow[];
  loading?: boolean;
  className?: string;
};

export function RecentCustomersList({ customers = [], loading, className }: RecentCustomersListProps) {
  return (
    <RentalDashboardCard title="Recent customers" viewAllTo="/rentals/customers" className={className}>
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="fm-rental-dashboard__skeleton h-14" />
          ))}
        </div>
      )}
      {!loading && customers.length === 0 && (
        <p className="py-6 text-center text-sm text-ink-muted">No customers yet.</p>
      )}
      {!loading && customers.length > 0 && (
        <ul className="space-y-1">
          {customers.map((c) => (
            <li key={c.id}>
              <Link to={`/rentals/customers/${c.id}/edit`} className="fm-rental-dashboard__row group">
                <span className="fm-rental-dashboard__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
                  {initialsFromName(c.legal_name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink group-hover:text-brand">
                    {c.legal_name}
                  </span>
                  <span className="block text-xs capitalize text-ink-muted">
                    {c.customer_type} · {c.booking_count} booking{c.booking_count === 1 ? "" : "s"}
                  </span>
                </span>
                {c.has_active_booking && (
                  <span className="shrink-0 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-semibold text-sky-800 ring-1 ring-sky-200/60">
                    Active rental
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </RentalDashboardCard>
  );
}
