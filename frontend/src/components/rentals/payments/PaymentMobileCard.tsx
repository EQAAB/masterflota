import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalPaymentListItem } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import {
  amountToneClass,
  paymentStatusClass,
  paymentStatusLabel,
  paymentTypeClass,
  paymentTypeLabel,
} from "../rentalStatus";
import { formatPaymentDateTime, paymentMethodLabel } from "./paymentsListUtils";

type PaymentMobileCardProps = {
  row: RentalPaymentListItem;
  onExpand: () => void;
  onActionMenuToggle: (id: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function PaymentMobileCard({
  row,
  onExpand,
  onActionMenuToggle,
  isMenuOpen,
}: PaymentMobileCardProps) {
  const { t } = useTranslation();
  const dt = formatPaymentDateTime(row.paid_at ?? row.created_at);
  const amountClass = amountToneClass(row.status, row.payment_type);

  return (
    <article className="fm-rental-payments__mobile-card" onClick={onExpand} role="button" tabIndex={0}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 gap-3">
          <span className="fm-rental-payments__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
            {initialsFromName(row.customer_name)}
          </span>
          <div className="min-w-0">
            <Link
              to={`/rentals/bookings/${row.booking_id}`}
              className="font-semibold text-brand"
              onClick={(e) => e.stopPropagation()}
            >
              {row.booking_number}
            </Link>
            <p className="truncate text-sm font-medium text-ink">{row.customer_name}</p>
            <p className={`mt-1 text-lg ${amountClass}`}>{formatCurrency(Number(row.amount))}</p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          aria-label={t("pages.payments.rowActionsAriaLabel")}
          aria-expanded={isMenuOpen}
          onClick={(e) => {
            e.stopPropagation();
            onActionMenuToggle(row.id, e.currentTarget);
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
        <span className={paymentTypeClass(row.payment_type)}>{paymentTypeLabel(row.payment_type)}</span>
        <span className={paymentStatusClass(row.status)}>{paymentStatusLabel(row.status)}</span>
        <span className="fm-rental-payments__method-chip">{paymentMethodLabel(row.method)}</span>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {dt.date}
        {dt.time ? ` · ${dt.time}` : ""}
        {row.license_plate ? ` · ${row.license_plate}` : ""}
      </p>
    </article>
  );
}
