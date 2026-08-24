import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useCanManageRentals } from "../../../lib/rentalsPermissions";
import type { RentalCustomer } from "../../../api/rentals";
import { getRentalBookings } from "../../../api/rentals";
import { QuickWeeklyRentalModal } from "../QuickWeeklyRentalModal";
import { useQuickWeeklyRentalModal } from "../../../hooks/useQuickWeeklyRentalModal";
import { formatCurrency } from "../../../utils/currency";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";
import { initialsFromName } from "../dashboard/rentalDashboardUtils";
import { formatShortDateRange } from "../dashboard/rentalDashboardUtils";
import { bookingStatusClass, bookingStatusDisplayLabel, customerTypeBadgeClass } from "../rentalStatus";
import { customerRevenue, formatCustomerSince } from "./customersListUtils";

type CustomerDetailDrawerProps = {
  customer: RentalCustomer | null;
  onClose: () => void;
};

export function CustomerDetailDrawer({ customer, onClose }: CustomerDetailDrawerProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const canManage = useCanManageRentals();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const bookingsQuery = useQuery({
    queryKey: ["rentals", "bookings", "customer-drawer", customer?.id],
    queryFn: () =>
      getRentalBookings({ customerId: customer!.id }).then((r) => r.data),
    enabled: !!customer?.id,
  });

  if (!customer) return null;

  const activeBookings = (bookingsQuery.data ?? []).filter((b) =>
    ["active", "confirmed"].includes(b.status),
  );
  const since = formatCustomerSince(customer.created_at);

  return (
    <>
      <button
        type="button"
        className="fm-rental-customers__drawer-backdrop"
        aria-label={t("pages.customers.closeDrawerAriaLabel")}
        onClick={onClose}
      />
      <aside className="fm-rental-customers__drawer" role="dialog" aria-modal="true" aria-label={t("pages.customers.customerProfileAriaLabel")}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-ink">{t("pages.customers.customerProfileTitle")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label={t("pages.customers.closeAriaLabel")}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex items-center gap-4">
            <span className="fm-rental-customers__avatar h-14 w-14 text-base bg-teal-50 text-teal-900 ring-1 ring-teal-200/50">
              {initialsFromName(customer.legal_name)}
            </span>
            <div>
              <p className="text-xl font-bold text-ink">{customer.legal_name}</p>
              {since ? <p className="text-sm text-slate-500">{t("pages.customers.customerSince", { date: since })}</p> : null}
              <span className={`mt-2 inline-flex ${customerTypeBadgeClass(customer.customer_type)}`}>
                {customer.customer_type === "company" ? t("pages.customers.typeCompany") : t("pages.customers.typeIndividual")}
              </span>
            </div>
          </div>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.customers.contactTitle")}</h3>
            <dl className="mt-2 space-y-1 text-sm">
              <div>
                <dt className="text-slate-500">{t("pages.customers.emailLabel")}</dt>
                <dd>{customer.email || t("common.emDash")}</dd>
              </div>
              <div>
                <dt className="text-slate-500">{t("pages.customers.phoneLabel")}</dt>
                <dd>{customer.phone || t("common.emDash")}</dd>
              </div>
              {customer.contact_name ? (
                <div>
                  <dt className="text-slate-500">{t("pages.customers.contactPersonLabel")}</dt>
                  <dd>{customer.contact_name}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="mt-6 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.customers.lifetimeRevenue")}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink">
              {formatCurrency(customerRevenue(customer))}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              <Trans i18nKey="pages.customers.completedRentals" count={customer.completed_rentals ?? 0} />
            </p>
          </section>

          <section className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.customers.activeRentalsTitle")}</h3>
            {bookingsQuery.isLoading ? (
              <div className="fm-rental-customers__skeleton mt-2 h-16" />
            ) : activeBookings.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">{t("pages.customers.noActiveBookings")}</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {activeBookings.map((b) => (
                  <li key={b.id}>
                    <Link
                      to={`/rentals/bookings/${b.id}`}
                      className="block rounded-xl border border-slate-100 bg-white px-3 py-2.5 text-sm transition-colors hover:border-brand/30"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-brand">{b.booking_number}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${bookingStatusClass(b.status)}`}
                        >
                          {bookingStatusDisplayLabel(b.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">
                        {formatShortDateRange(b.start_at, b.end_at)}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {customer.notes ? (
            <section className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">{t("pages.customers.notesTitle")}</h3>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{customer.notes}</p>
            </section>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-slate-200 p-5 sm:flex-row">
          {canManage && (
            <>
              <button
                type="button"
                className={`${btnPrimary} flex-1`}
                onClick={() => openQuickWeeklyRental({ customerId: customer.id })}
              >
                {t("pages.customers.quickWeeklyRental")}
              </button>
              <Link
                to={`/rentals/customers/${customer.id}/edit`}
                className={`${btnSecondary} flex-1 text-center`}
              >
                {t("pages.customers.editCustomer")}
              </Link>
            </>
          )}
          <Link
            to={`/rentals/bookings?customerId=${customer.id}`}
            className={`${btnSecondary} flex-1 text-center`}
          >
            {t("pages.customers.viewAllBookings")}
          </Link>
        </div>
      </aside>
      <QuickWeeklyRentalModal
        open={quickWeeklyModal.open}
        onClose={closeQuickWeeklyRental}
        initialCustomerId={quickWeeklyModal.customerId}
        initialVehicleId={quickWeeklyModal.vehicleId}
        initialStartAt={quickWeeklyModal.startAt}
        onSuccess={(bookingId) => {
          closeQuickWeeklyRental();
          navigate(`/rentals/bookings/${bookingId}`);
        }}
      />
    </>
  );
}
