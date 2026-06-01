import type { RentalCustomer } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

export function formatCustomerSince(createdAt?: string): string {
  if (!createdAt) return "";
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

export function customerRevenue(c: RentalCustomer): number {
  return Number(c.lifetime_revenue ?? 0);
}

export function exportCustomersCsv(customers: RentalCustomer[]) {
  const headers = [
    "Name",
    "Type",
    "Email",
    "Phone",
    "Active bookings",
    "Completed rentals",
    "Lifetime revenue",
    "Status",
    "Customer since",
  ];
  const rows = customers.map((c) => {
    const active = c.active_bookings ?? 0;
    const status = !c.is_active ? "Inactive" : active > 0 ? "Active rental" : "Active account";
    return [
      c.legal_name,
      c.customer_type,
      c.email ?? "",
      c.phone ?? "",
      String(active),
      String(c.completed_rentals ?? 0),
      formatCurrency(customerRevenue(c)),
      status,
      formatCustomerSince(c.created_at),
    ];
  });
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rental-customers-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
