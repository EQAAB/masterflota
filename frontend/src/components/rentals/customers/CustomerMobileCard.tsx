import type { RentalCustomer } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { Link } from "react-router-dom";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import {
  customerStatusBadgeClass,
  customerStatusLabel,
  customerTypeBadgeClass,
} from "../rentalStatus";
import { customerRevenue, formatCustomerSince } from "./customersListUtils";
import {
  customerHasActiveVehicle,
  formatCustomerVehicleExtra,
  formatCustomerVehicleLabel,
  formatCustomerVehiclePlate,
  getCustomerVehicleLinkId,
} from "../../../utils/customerVehicleDisplay";

type CustomerMobileCardProps = {
  customer: RentalCustomer;
  onOpen: () => void;
  onActionMenuToggle: (customerId: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function CustomerMobileCard({
  customer: c,
  onOpen,
  onActionMenuToggle,
  isMenuOpen,
}: CustomerMobileCardProps) {
  const active = c.active_bookings ?? 0;
  const since = formatCustomerSince(c.created_at);
  const vehicleLabel = formatCustomerVehicleLabel(c);
  const vehiclePlate = formatCustomerVehiclePlate(c);
  const vehicleExtra = formatCustomerVehicleExtra(c);
  const vehicleId = getCustomerVehicleLinkId(c);
  const hasVehicle = customerHasActiveVehicle(c);

  return (
    <article className="fm-rental-customers__mobile-card" onClick={onOpen} role="button" tabIndex={0}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="fm-rental-customers__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
            {initialsFromName(c.legal_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{c.legal_name}</p>
            {since ? <p className="text-xs text-slate-500">Since {since}</p> : null}
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label="Actions"
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            onActionMenuToggle(c.id, e.currentTarget);
          }}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <circle cx="12" cy="5" r="1.5" />
            <circle cx="12" cy="12" r="1.5" />
            <circle cx="12" cy="19" r="1.5" />
          </svg>
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={customerTypeBadgeClass(c.customer_type)}>
          {c.customer_type === "company" ? "Company" : "Individual"}
        </span>
        <span className={customerStatusBadgeClass(c.is_active, active)}>
          {customerStatusLabel(c.is_active, active)}
        </span>
      </div>

      {hasVehicle && vehicleLabel && (
        <div className="mt-2 text-sm" onClick={(e) => e.stopPropagation()}>
          {vehicleId ? (
            <Link to={`/vehicles/${vehicleId}`} className="text-ink hover:text-brand">
              <span className="font-medium">{vehicleLabel}</span>
              {vehiclePlate && <span className="ml-1 text-xs text-slate-500 tabular-nums">({vehiclePlate})</span>}
            </Link>
          ) : (
            <p className="text-ink">
              <span className="font-medium">{vehicleLabel}</span>
              {vehiclePlate && <span className="ml-1 text-xs text-slate-500 tabular-nums">({vehiclePlate})</span>}
            </p>
          )}
          {vehicleExtra && <p className="text-xs text-sky-700">{vehicleExtra}</p>}
        </div>
      )}

      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-slate-500">Active bookings</dt>
          <dd className="font-semibold tabular-nums">{active}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">Completed</dt>
          <dd className="font-semibold tabular-nums">{c.completed_rentals ?? 0}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-xs text-slate-500">Lifetime revenue</dt>
          <dd className="font-semibold tabular-nums">{formatCurrency(customerRevenue(c))}</dd>
        </div>
      </dl>

      {(c.email || c.phone) && (
        <p className="mt-3 truncate text-xs text-slate-600">
          {[c.email, c.phone].filter(Boolean).join(" · ")}
        </p>
      )}
    </article>
  );
}
