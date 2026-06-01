import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRentalCustomers } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";

export function CustomersListPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "customers"],
    queryFn: () => getRentalCustomers().then((r) => r.data),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title="Rental customers"
        subtitle="Companies and individuals who rent vehicles."
        backTo="/rentals"
        actionTo="/rentals/customers/new"
        actionLabel="Add customer"
      />
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {isLoading && <p className="p-6 text-sm text-slate-500">Loading…</p>}
        <table className="w-full text-sm">
          <thead className="border-b bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Contact</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((c) => (
              <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                <td className="px-4 py-3">
                  <Link to={`/rentals/customers/${c.id}/edit`} className="font-medium text-brand hover:underline">
                    {c.legal_name}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{c.customer_type}</td>
                <td className="px-4 py-3 text-slate-600">{c.email || c.phone || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
