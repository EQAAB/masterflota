import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalBooking } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import {
  bookingStatusClass,
  bookingStatusDisplayLabel,
  rentPaymentStateClass,
  rentPaymentStateLabel,
} from "../rentalStatus";
import { formatShortDateRange } from "../dashboard/rentalDashboardUtils";
import { formatRelativeCreated, getCurrentWeeklyPeriod, rentalDayCount } from "./bookingsListUtils";
import type { BookingsDensity } from "./bookingsListUtils";

type BookingTableRowProps = {
  booking: RentalBooking;
  density: BookingsDensity;
  onActionMenuToggle: (bookingId: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function BookingTableRow({
  booking: b,
  density,
  onActionMenuToggle,
  isMenuOpen,
}: BookingTableRowProps) {
  const { t } = useTranslation();
  const days = rentalDayCount(b.start_at, b.end_at);
  const contact = b.customer_phone || b.customer_email || t("common.emDash");
  const currentWeek = getCurrentWeeklyPeriod(b);

  return (
    <tr
      className={`fm-rental-bookings__row ${density === "compact" ? "fm-rental-bookings__row--compact" : ""}`}
    >
      <td>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-mint/60 text-brand-dark">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          <div className="min-w-0">
            <Link
              to={`/rentals/bookings/${b.id}`}
              className="font-semibold text-brand hover:underline"
            >
              {b.booking_number}
            </Link>
            <p className="mt-0.5 text-xs text-slate-500">{formatRelativeCreated(b.created_at)}</p>
          </div>
        </div>
      </td>
      <td>
        <div className="flex items-center gap-2.5">
          <span className="fm-rental-bookings__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
            {initialsFromName(b.customer_name ?? "?")}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">{b.customer_name}</p>
            <p className="truncate text-xs text-slate-500">{contact}</p>
          </div>
        </div>
      </td>
      <td>
        <span className="fm-rental-bookings__plate-badge">{b.license_plate}</span>
        <p className="mt-1 text-xs text-slate-600">
          {[b.make, b.model].filter(Boolean).join(" ") || t("common.emDash")}
        </p>
      </td>
      <td>
        <div className="flex items-start gap-2">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-ink">{formatShortDateRange(b.start_at, b.end_at)}</p>
            <p className="text-xs text-slate-500">
              {t("pages.bookings.dayCount", { count: days })}
            </p>
            {currentWeek && (
              <p className="mt-0.5 text-xs font-medium text-brand-dark">
                {t("pages.bookings.thisWeekPeriod", {
                  range: formatShortDateRange(currentWeek.startIso, currentWeek.endIso),
                })}
              </p>
            )}
          </div>
        </div>
      </td>
      <td>
        <p className="text-base font-bold tabular-nums text-ink">{formatCurrency(Number(b.total_amount))}</p>
        <p className={`text-xs font-medium ${rentPaymentStateClass(b.rent_payment_state)}`}>
          {rentPaymentStateLabel(b.rent_payment_state)}
        </p>
      </td>
      <td>
        <span
          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
        >
          {bookingStatusDisplayLabel(b.status)}
        </span>
      </td>
      <td className="text-right">
        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-ink"
          aria-label={t("pages.bookings.rowActionsAriaLabel")}
          aria-expanded={isMenuOpen}
          onClick={(e) => onActionMenuToggle(b.id, e.currentTarget)}
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
