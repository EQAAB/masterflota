import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRentalPayments } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { formatCurrency } from "../../utils/currency";

export function PaymentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "payments"],
    queryFn: () => getRentalPayments().then((r) => r.data),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader title="Payments" subtitle="Rental revenue transactions (not driver payouts)." backTo="/rentals" />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading && <p className="p-6 text-sm">Loading…</p>}
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  <Link to={`/rentals/bookings/${p.booking_id}`} className="text-brand hover:underline">
                    {p.booking_number}
                  </Link>
                </td>
                <td className="px-4 py-3">{p.customer_name}</td>
                <td className="px-4 py-3 capitalize">{p.payment_type}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(p.amount))}</td>
                <td className="px-4 py-3 capitalize">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
