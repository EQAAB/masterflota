import type { RentalPaymentListItem } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";

export type PaymentsFilters = {
  q: string;
  status: string;
  paymentType: string;
  customerId: string;
  from: string;
  to: string;
  sort: "date" | "amount" | "customer";
};

export function todayDateInputValue(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function todayRentCollectedFilters(): Partial<PaymentsFilters> {
  const today = todayDateInputValue();
  return {
    from: today,
    to: today,
    status: "paid",
    paymentType: "rent",
  };
}

export function formatPaymentDateTime(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: "—", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }),
  };
}

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method?.trim()) return "—";
  const m = method.toLowerCase();
  if (m.includes("cash")) return "Cash";
  if (m.includes("card")) return "Card";
  if (m.includes("bank") || m.includes("transfer")) return "Bank transfer";
  if (m.includes("stripe")) return "Stripe";
  if (m.includes("paypal")) return "PayPal";
  return method;
}

export function filterAndSortPayments(rows: RentalPaymentListItem[], filters: PaymentsFilters): RentalPaymentListItem[] {
  let list = [...rows];
  const q = filters.q.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (r) =>
        r.booking_number.toLowerCase().includes(q) ||
        r.customer_name.toLowerCase().includes(q) ||
        (r.reference ?? "").toLowerCase().includes(q) ||
        (r.license_plate ?? "").toLowerCase().includes(q),
    );
  }
  if (filters.customerId) {
    list = list.filter((r) => r.customer_id === filters.customerId);
  }

  list.sort((a, b) => {
    if (filters.sort === "amount") return Number(b.amount) - Number(a.amount);
    if (filters.sort === "customer") return a.customer_name.localeCompare(b.customer_name);
    const ta = new Date(a.paid_at ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.paid_at ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });

  return list;
}

export function customerOptions(rows: RentalPaymentListItem[]): Array<{ id: string; name: string }> {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (r.customer_id) map.set(r.customer_id, r.customer_name);
  }
  return [...map.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function exportPaymentsCsv(rows: RentalPaymentListItem[]) {
  const headers = [
    "Booking",
    "Customer",
    "Vehicle",
    "Type",
    "Amount",
    "Method",
    "Date",
    "Status",
  ];
  const data = rows.map((r) => {
    const dt = formatPaymentDateTime(r.paid_at ?? r.created_at);
    return [
      r.booking_number,
      r.customer_name,
      r.license_plate ?? "",
      r.payment_type,
      formatCurrency(Number(r.amount)),
      paymentMethodLabel(r.method),
      dt.date,
      r.status,
    ];
  });
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [headers, ...data].map((row) => row.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rental-payments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
