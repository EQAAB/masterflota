import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getOverdueRentals, getRentalDashboard } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { formatCurrency } from "../../utils/currency";
import { btnSecondary } from "../../theme/classNames";

export function RentalDashboardPage() {
  const dashQuery = useQuery({
    queryKey: ["rentals", "dashboard"],
    queryFn: () => getRentalDashboard().then((r) => r.data),
  });
  const overdueQuery = useQuery({
    queryKey: ["rentals", "overdue"],
    queryFn: () => getOverdueRentals().then((r) => r.data),
  });

  const d = dashQuery.data;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title="Rental Dashboard"
        subtitle="External vehicle rentals — separate from driver payroll rent."
        actionTo="/rentals/bookings/new"
        actionLabel="New booking"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active rentals", value: d?.active_bookings ?? "—" },
          { label: "Confirmed upcoming", value: d?.confirmed_bookings ?? "—" },
          { label: "Customers", value: d?.active_customers ?? "—" },
          { label: "Revenue (MTD)", value: d ? formatCurrency(Number(d.mtd_revenue)) : "—" },
        ].map((card) => (
          <article key={card.label} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-ink tabular-nums">{card.value}</p>
          </article>
        ))}
      </div>

      {(d?.overdue_bookings ?? 0) > 0 && (
        <section className="mt-6 rounded-2xl border border-rose-200/80 bg-rose-50/50 p-5">
          <h2 className="text-base font-semibold text-rose-900">Overdue returns</h2>
          <p className="mt-1 text-sm text-rose-800">{d?.overdue_bookings} active booking(s) past return date.</p>
          <ul className="mt-4 space-y-2">
            {(overdueQuery.data ?? []).slice(0, 5).map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-2 rounded-xl bg-white/80 px-3 py-2 text-sm">
                <span>
                  {b.booking_number} · {b.license_plate}
                </span>
                <Link to={`/rentals/bookings/${b.id}`} className="text-brand font-medium hover:underline">
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/rentals/bookings" className={btnSecondary}>
          Bookings
        </Link>
        <Link to="/rentals/calendar" className={btnSecondary}>
          Calendar
        </Link>
        <Link to="/rentals/customers" className={btnSecondary}>
          Customers
        </Link>
        <Link to="/rentals/payments" className={btnSecondary}>
          Payments
        </Link>
      </div>
    </div>
  );
}
