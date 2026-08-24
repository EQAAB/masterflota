import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { RentalPaymentListItem } from "../../../api/rentals";
import { formatCurrency } from "../../../utils/currency";
import { formatShortDateRange } from "../dashboard/rentalDashboardUtils";
import { paymentTypeLabel, paymentStatusLabel } from "../rentalStatus";

type PaymentExpandPanelProps = {
  row: RentalPaymentListItem;
};

export function PaymentExpandPanel({ row }: PaymentExpandPanelProps) {
  const { t } = useTranslation();
  const period =
    row.start_at && row.end_at ? formatShortDateRange(row.start_at, row.end_at) : t("common.emDash");

  return (
    <div className="fm-rental-payments__expand-panel">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.payments.customerLabel")}</h3>
          <p className="font-medium text-ink">{row.customer_name}</p>
          {row.customer_email ? <p className="text-sm text-slate-600">{row.customer_email}</p> : null}
          <p className="text-sm text-slate-600">
            {t("pages.payments.rentalPeriodLabel")} <span className="font-medium text-ink">{period}</span>
          </p>
          {row.license_plate ? (
            <p className="text-sm text-slate-600">
              {t("pages.payments.vehicleLabel")}{" "}
              <span className="font-mono font-semibold">{row.license_plate}</span>
              {[row.make, row.model].filter(Boolean).join(" ")}
            </p>
          ) : null}
          {row.booking_payment_state === "partial" ? (
            <p className="text-xs font-medium text-amber-700">{t("pages.payments.bookingRentPartial")}</p>
          ) : null}
          <Link to={`/rentals/bookings/${row.booking_id}`} className="text-sm font-medium text-brand hover:underline">
            {t("pages.payments.openBooking", { number: row.booking_number })}
          </Link>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.payments.paymentSummaryTitle")}</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.payments.typeLabel")}</dt>
              <dd className="font-medium">{paymentTypeLabel(row.payment_type)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.payments.thisPaymentLabel")}</dt>
              <dd className="font-bold tabular-nums">{formatCurrency(Number(row.amount))}</dd>
            </div>
            {row.booking_total != null ? (
              <div className="flex justify-between border-t border-slate-100 pt-2">
                <dt className="text-slate-500">{t("pages.payments.bookingTotalLabel")}</dt>
                <dd className="font-semibold tabular-nums">{formatCurrency(Number(row.booking_total))}</dd>
              </div>
            ) : null}
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.payments.statusLabel")}</dt>
              <dd>{paymentStatusLabel(row.status)}</dd>
            </div>
          </dl>
          {row.notes ? (
            <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
              <span className="font-medium text-ink">{t("pages.payments.notesLabel")}</span> {row.notes}
            </p>
          ) : null}
          {row.reference ? (
            <p className="mt-1 text-xs text-slate-500">{t("pages.payments.referenceLabel", { reference: row.reference })}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
