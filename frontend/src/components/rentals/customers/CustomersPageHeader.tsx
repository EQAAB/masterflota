import { Link } from "react-router-dom";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";

export function CustomersPageHeader() {
  return (
    <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <Link
          to="/rentals"
          className={`${btnSecondary} !mb-3 !inline-flex !min-h-0 !px-3 !py-1.5 !text-xs`}
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">Rental customers</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-muted">
          Companies and individuals who rent your fleet — bookings, revenue, and contact details in one place.
        </p>
      </div>
      <Link to="/rentals/customers/new" className={`${btnPrimary} fm-rental-customers__header-cta shrink-0`}>
        Add customer
      </Link>
    </header>
  );
}
