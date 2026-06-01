import type { RentalCustomer, RentalQuote } from "../../../api/rentals";
import type { VehicleListItem } from "../../../api/vehicles";
import { formatCurrency } from "../../../utils/currency";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import { EXTRA_SERVICES } from "./bookingFormConstants";
import type { DisplayTotals } from "./bookingFormUtils";

type BookingSummarySidebarProps = {
  customer: RentalCustomer | null;
  vehicle: VehicleListItem | null;
  quote: RentalQuote | null;
  quoteLoading: boolean;
  totals: DisplayTotals | null;
  selectedExtras: string[];
  isEdit: boolean;
};

export function BookingSummarySidebar({
  customer,
  vehicle,
  quote,
  quoteLoading,
  totals,
  selectedExtras,
  isEdit,
}: BookingSummarySidebarProps) {
  const customerVerified = !!customer && (!!customer.email || !!customer.phone);

  return (
    <aside className="space-y-4">
      <div className="fm-rental-booking-form__summary">
        <h2 className="text-lg font-semibold text-ink">Booking summary</h2>

        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-ink-muted">Customer</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {customer ? customer.legal_name : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Vehicle</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {vehicle ? `${vehicle.license_plate} · ${vehicle.make} ${vehicle.model}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-ink-muted">Rental duration</dt>
            <dd className="mt-0.5 font-medium text-ink">
              {totals ? `${totals.days} days` : quoteLoading ? "…" : "—"}
            </dd>
          </div>
        </dl>

        {quote?.conflict && (
          <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-800 ring-1 ring-rose-200/60">
            {quote.conflict.message}
          </p>
        )}

        {totals && (
          <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink-muted">
                {totals.unitLabel}
                {totals.unitLabel === "Daily price" ? ` × ${totals.days} days` : ""}
              </span>
              <span className="tabular-nums font-medium">{formatCurrency(totals.unitRate)}</span>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-muted">Subtotal</span>
              <span className="tabular-nums font-medium">{formatCurrency(totals.subtotal)}</span>
            </div>
            {selectedExtras.length > 0 &&
              EXTRA_SERVICES.filter((e) => selectedExtras.includes(e.id)).map((e) => (
                <div key={e.id} className="flex justify-between gap-2">
                  <span className="text-ink-muted">{e.label}</span>
                  <span className="tabular-nums">{formatCurrency(e.amount)}</span>
                </div>
              ))}
            {totals.discount > 0 && (
              <div className="flex justify-between gap-2 text-emerald-700">
                <span>Discount</span>
                <span className="tabular-nums">−{formatCurrency(totals.discount)}</span>
              </div>
            )}
            <div className="flex justify-between gap-2">
              <span className="text-ink-muted">Deposit</span>
              <span className="tabular-nums font-medium">{formatCurrency(totals.deposit)}</span>
            </div>
            <div className="flex justify-between gap-2 border-t border-slate-100 pt-3">
              <span className="font-semibold text-ink">Total rent</span>
              <span className="fm-rental-booking-form__summary-total">
                {formatCurrency(totals.grandTotal)}
              </span>
            </div>
          </div>
        )}

        {!totals && !quoteLoading && (
          <p className="mt-4 text-sm text-ink-muted">
            Select vehicle and dates to see pricing.
          </p>
        )}
      </div>

      {vehicle && (
        <div className="fm-rental-booking-form__summary">
          <h3 className="text-sm font-semibold text-ink">Vehicle preview</h3>
          <div className="mt-3 flex gap-3">
            <div className="fm-rental-booking-form__thumb h-14 w-16">
              <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 17h8M6 11l1-4h10l1 4M5 17h14v2H5v-2z"
                />
              </svg>
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-mono font-bold">{vehicle.license_plate}</p>
              <p className="text-ink-muted">
                {vehicle.make} {vehicle.model}
              </p>
              {vehicle.transmission && (
                <p className="mt-1 text-xs text-ink-muted capitalize">{vehicle.transmission}</p>
              )}
              {vehicle.fuel_type && (
                <p className="text-xs text-ink-muted capitalize">{vehicle.fuel_type}</p>
              )}
              {quote && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    quote.available ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {quote.available ? "Available" : "Unavailable"}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="fm-rental-booking-form__summary">
        <h3 className="text-sm font-semibold text-ink">Status</h3>
        <ul className="mt-3 flex flex-wrap gap-2">
          <li>
            <span
              className={`fm-rental-booking-form__status-pill ${
                quote?.available
                  ? "fm-rental-booking-form__status-pill--ok"
                  : quote && !quote.available
                    ? "fm-rental-booking-form__status-pill--warn"
                    : "fm-rental-booking-form__status-pill--neutral"
              }`}
            >
              {quote?.available ? "Vehicle available" : quote ? "Vehicle conflict" : "Vehicle pending"}
            </span>
          </li>
          <li>
            <span
              className={`fm-rental-booking-form__status-pill ${
                customerVerified
                  ? "fm-rental-booking-form__status-pill--ok"
                  : "fm-rental-booking-form__status-pill--neutral"
              }`}
            >
              {customerVerified ? "Customer verified" : "Customer pending"}
            </span>
          </li>
          <li>
            <span className="fm-rental-booking-form__status-pill fm-rental-booking-form__status-pill--warn">
              {isEdit ? "Deposit pending" : "Deposit on create"}
            </span>
          </li>
        </ul>
        {customer && (
          <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
            <div className="fm-rental-booking-form__avatar !h-9 !w-9 text-xs">
              {initialsFromName(customer.legal_name)}
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-medium text-ink">{customer.legal_name}</p>
              {customer.phone && <p className="text-ink-muted">{customer.phone}</p>}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
