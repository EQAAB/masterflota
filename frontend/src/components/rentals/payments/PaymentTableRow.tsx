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
import { PaymentExpandPanel } from "./PaymentExpandPanel";
import { formatPaymentDateTime, paymentMethodLabel } from "./paymentsListUtils";

type PaymentTableRowProps = {
  row: RentalPaymentListItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onActionMenuToggle: (id: string, el: HTMLElement) => void;
  isMenuOpen: boolean;
};

export function PaymentTableRow({
  row,
  expanded,
  onToggleExpand,
  onActionMenuToggle,
  isMenuOpen,
}: PaymentTableRowProps) {
  const { t } = useTranslation();
  const dt = formatPaymentDateTime(row.paid_at ?? row.created_at);
  const amountClass = amountToneClass(row.status, row.payment_type);

  return (
    <>
      <tr
        className={`fm-rental-payments__row cursor-pointer ${expanded ? "fm-rental-payments__row--expanded" : ""}`}
        onClick={onToggleExpand}
      >
        <td>
          <Link
            to={`/rentals/bookings/${row.booking_id}`}
            className="font-semibold text-brand hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {row.booking_number}
          </Link>
          <p className="text-xs text-slate-500">{t("pages.payments.rentalContract")}</p>
        </td>
        <td>
          <div className="flex items-center gap-2.5">
            <span className="fm-rental-payments__avatar bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
              {initialsFromName(row.customer_name)}
            </span>
            <div className="min-w-0">
              <p className="truncate font-medium text-ink">{row.customer_name}</p>
              {row.customer_email ? (
                <p className="truncate text-xs text-slate-500">{row.customer_email}</p>
              ) : null}
            </div>
          </div>
        </td>
        <td>
          {row.license_plate ? (
            <>
              <span className="fm-rental-payments__plate-badge">{row.license_plate}</span>
              <p className="mt-1 text-xs text-slate-600">
                {[row.make, row.model].filter(Boolean).join(" ")}
              </p>
            </>
          ) : (
            <span className="text-slate-400">{t("common.emDash")}</span>
          )}
        </td>
        <td>
          <span className={paymentTypeClass(row.payment_type)}>{paymentTypeLabel(row.payment_type)}</span>
        </td>
        <td>
          <p className={`text-lg ${amountClass}`}>{formatCurrency(Number(row.amount))}</p>
        </td>
        <td>
          <span className="fm-rental-payments__method-chip">{paymentMethodLabel(row.method)}</span>
        </td>
        <td>
          <p className="text-sm font-medium text-ink">{dt.date}</p>
          {dt.time ? <p className="text-xs text-slate-500">{dt.time}</p> : null}
        </td>
        <td>
          <span className={paymentStatusClass(row.status)}>{paymentStatusLabel(row.status)}</span>
        </td>
        <td className="text-right" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label={t("pages.payments.rowActionsAriaLabel")}
            aria-expanded={isMenuOpen}
            onClick={(e) => onActionMenuToggle(row.id, e.currentTarget)}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </td>
      </tr>
      {expanded ? (
        <tr>
          <td colSpan={9} className="!p-0">
            <PaymentExpandPanel row={row} />
          </td>
        </tr>
      ) : null}
    </>
  );
}
