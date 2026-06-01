import { Link } from "react-router-dom";
import { btnPrimary } from "../../../theme/classNames";

export function AvailabilityEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-white px-6 py-16 text-center shadow-card">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink">No vehicles available</h2>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Add vehicles or create bookings to manage rental availability.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/vehicles" className={btnPrimary}>
          Manage fleet
        </Link>
        <Link to="/rentals/bookings/new" className="text-sm font-medium text-brand hover:underline">
          New booking
        </Link>
      </div>
    </div>
  );
}
