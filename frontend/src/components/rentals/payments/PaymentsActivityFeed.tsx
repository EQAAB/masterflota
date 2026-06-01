import { Link } from "react-router-dom";
import type { RentalPaymentsActivityItem } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { formatPaymentDateTime } from "./paymentsListUtils";

type PaymentsActivityFeedProps = {
  items?: RentalPaymentsActivityItem[];
  loading?: boolean;
};

export function PaymentsActivityFeed({ items, loading }: PaymentsActivityFeedProps) {
  if (loading) {
    return <div className="fm-rental-payments__skeleton fm-rental-payments__activity-card mb-6 h-32" />;
  }

  if (!items?.length) return null;

  return (
    <section className="fm-rental-payments__activity-card">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
        Recent payment activity
      </h2>
      <ul className="space-y-1">
        {items.map((item) => {
          const dt = formatPaymentDateTime(item.created_at);
          const statusClass =
            item.status === "paid"
              ? "fm-rental-payments__activity-item--paid"
              : item.status === "pending"
                ? "fm-rental-payments__activity-item--pending"
                : "";
          return (
            <li key={item.id} className={`fm-rental-payments__activity-item ${statusClass}`}>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{item.label}</p>
                <p className="text-xs text-slate-500">
                  {item.booking_number} · {item.customer_name}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold tabular-nums text-ink">
                  {formatCurrency(Number(item.amount))}
                </p>
                <p className="text-xs text-slate-500">{dt.date}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <Link to="/rentals/bookings" className="mt-3 inline-block text-xs font-medium text-brand hover:underline">
        View all bookings →
      </Link>
    </section>
  );
}
