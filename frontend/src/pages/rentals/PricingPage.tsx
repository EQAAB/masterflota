import { useQuery } from "@tanstack/react-query";
import { getRentalPricing } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { formatCurrency } from "../../utils/currency";

export function PricingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "pricing"],
    queryFn: () => getRentalPricing().then((r) => r.data),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title="Pricing"
        subtitle="Rate cards per vehicle. Seeded from vehicle daily/weekly/monthly rent fields."
        backTo="/rentals"
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading && <p className="p-6 text-sm">Loading…</p>}
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Vehicle</th>
              <th className="px-4 py-3">Daily</th>
              <th className="px-4 py-3">Weekly</th>
              <th className="px-4 py-3">Monthly</th>
              <th className="px-4 py-3">Deposit</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-4 py-3">
                  {p.license_plate ? `${p.license_plate} (${p.make} ${p.model})` : "Default / all vehicles"}
                </td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(p.daily_rate))}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(p.weekly_rate))}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(p.monthly_rate))}</td>
                <td className="px-4 py-3 tabular-nums">{formatCurrency(Number(p.deposit_default))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
