import type { RentalCustomer } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import {
  customerStatusBadgeClass,
  customerStatusLabel,
  customerTypeBadgeClass,
} from "../rentalStatus";
import { customerRevenue, formatCustomerSince } from "./customersListUtils";

type CustomerTableRowProps = {
  customer: RentalCustomer;
  onRowClick: () => void;
  onActionMenuToggle: (customerId: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function CustomerTableRow({
  customer: c,
  onRowClick,
  onActionMenuToggle,
  isMenuOpen,
}: CustomerTableRowProps) {
  const active = c.active_bookings ?? 0;
  const completed = c.completed_rentals ?? 0;
  const since = formatCustomerSince(c.created_at);

  return (
    <tr className="fm-rental-customers__row" onClick={onRowClick}>
      <td onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3">
          <span className="fm-rental-customers__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
            {initialsFromName(c.legal_name)}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink">{c.legal_name}</p>
            {since ? <p className="text-xs text-slate-500">Customer since {since}</p> : null}
          </div>
        </div>
      </td>
      <td>
        <span className={customerTypeBadgeClass(c.customer_type)}>
          {c.customer_type === "company" ? "Company" : "Individual"}
        </span>
      </td>
      <td>
        <p className="text-sm text-ink">{c.email || "—"}</p>
        <p className="text-xs text-slate-500">{c.phone || ""}</p>
      </td>
      <td>
        <p className="font-semibold tabular-nums text-ink">{active}</p>
        <p className="text-xs text-slate-500">active now</p>
      </td>
      <td>
        <p className="font-semibold tabular-nums text-ink">{completed}</p>
        <p className="text-xs text-slate-500">completed</p>
      </td>
      <td>
        <p className="font-semibold tabular-nums text-ink">{formatCurrency(customerRevenue(c))}</p>
        <p className="text-xs text-slate-500">Lifetime revenue</p>
      </td>
      <td>
        <span className={customerStatusBadgeClass(c.is_active, active)}>
          {customerStatusLabel(c.is_active, active)}
        </span>
      </td>
      <td className="text-right" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          aria-label="Actions"
          aria-expanded={isMenuOpen}
          onClick={(e) => onActionMenuToggle(c.id, e.currentTarget)}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </td>
    </tr>
  );
}
