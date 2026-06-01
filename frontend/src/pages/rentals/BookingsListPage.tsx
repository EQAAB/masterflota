import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRentalBookings } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { bookingStatusClass, formatBookingStatus } from "../../components/rentals/rentalStatus";
import { formatCurrency } from "../../utils/currency";

export function BookingsListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["rentals", "bookings"],
    queryFn: () => getRentalBookings().then((r) => r.data),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title="Bookings"
        subtitle="Manage rental contracts and pickup/return workflow."
        backTo="/rentals"
        backLabel="Dashboard"
        actionTo="/rentals/bookings/new"
        actionLabel="New booking"
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        {isError && <p className="p-6 text-sm text-rose-700">Failed to load bookings.</p>}
        {!isLoading && !isError && (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Vehicle</th>
                <th className="px-4 py-3">Period</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((b) => (
                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <Link to={`/rentals/bookings/${b.id}`} className="font-medium text-brand hover:underline">
                      {b.booking_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{b.customer_name}</td>
                  <td className="px-4 py-3">
                    {b.license_plate} · {b.make} {b.model}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {b.start_at.slice(0, 10)} – {b.end_at.slice(0, 10)}
                  </td>
                  <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(b.total_amount))}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
                    >
                      {formatBookingStatus(b.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!isLoading && (data ?? []).length === 0 && (
          <p className="p-8 text-center text-sm text-slate-500">No bookings yet.</p>
        )}
      </div>
    </div>
  );
}
