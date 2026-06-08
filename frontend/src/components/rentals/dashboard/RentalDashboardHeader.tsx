import { Link } from "react-router-dom";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary } from "../../../theme/classNames";

export function RentalDashboardHeader() {
  const canManage = useCanManageRentals();
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Rental Dashboard</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Manage external vehicle rentals, customers, bookings, payments, and availability.
        </p>
      </div>
      {canManage && (
        <Link to="/rentals/bookings/new" className={`${btnPrimary} fm-rental-dashboard__cta shrink-0`}>
          New booking
        </Link>
      )}
    </header>
  );
}
