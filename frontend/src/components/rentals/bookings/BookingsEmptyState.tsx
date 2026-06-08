import { Link } from "react-router-dom";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary } from "../../../theme/classNames";

export function BookingsEmptyState() {
  const canManage = useCanManageRentals();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-mint/80 text-brand-dark">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-ink">No bookings yet</h3>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Create your first rental booking to start managing pickups, returns, and payments.
      </p>
      {canManage && (
        <Link to="/rentals/bookings/new" className={`${btnPrimary} mt-6 fm-rental-bookings__header-cta`}>
          New booking
        </Link>
      )}
    </div>
  );
}
