import { Link } from "react-router-dom";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import { btnPrimary } from "../../../theme/classNames";

export function CustomersEmptyState() {
  const canManage = useCanManageRentals();
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">No customers yet</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Add companies or individuals who rent from your fleet. Their bookings and revenue will show up here.
      </p>
      {canManage && (
        <Link to="/rentals/customers/new" className={`${btnPrimary} mt-6`}>
          Add customer
        </Link>
      )}
    </div>
  );
}
