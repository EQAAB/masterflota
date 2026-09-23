import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import {
  cancelRentalBooking,
  confirmRentalBooking,
  createRentalPayment,
  downloadRentalContract,
  getRentalBooking,
  pickupRentalBooking,
  renewWeeklyBooking,
  returnRentalBooking,
  type RentalPayment,
} from "../../api/rentals";
import { formatBookingDateTime } from "../../components/rentals/booking-form/bookingFormUtils";
import { WEEKLY_RENTAL_RENEWAL_DAYS } from "../../components/rentals/booking-form/bookingFormConstants";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { useCanManageRentals } from "../../lib/rentalsPermissions";
import { formatPaymentDateTime } from "../../components/rentals/payments/paymentsListUtils";
import {
  DEFAULT_RENTAL_PAYMENT_METHOD,
  rentalPaymentMethodLabel,
  RENTAL_PAYMENT_METHODS,
  type RentalPaymentMethod,
} from "../../components/rentals/payments/rentalPaymentMethods";
import {
  bookingStatusClass,
  formatBookingStatus,
  paymentStatusLabel,
  paymentTypeLabel,
  rentPaymentStateClass,
  rentPaymentStateLabel,
} from "../../components/rentals/rentalStatus";
import { btnPrimary, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";

export function BookingDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mileageOut, setMileageOut] = useState("");
  const [mileageIn, setMileageIn] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<RentalPayment["payment_type"]>("rent");
  const [payMethod, setPayMethod] = useState<RentalPaymentMethod>(DEFAULT_RENTAL_PAYMENT_METHOD);
  const [renewAmount, setRenewAmount] = useState("");
  const [renewMethod, setRenewMethod] = useState<RentalPaymentMethod>(DEFAULT_RENTAL_PAYMENT_METHOD);
  const [contractLoading, setContractLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const canManage = useCanManageRentals();

  const bookingQuery = useQuery({
    queryKey: ["rentals", "booking", id],
    queryFn: () => getRentalBooking(id!).then((r) => r.data),
    enabled: !!id,
  });

  const b = bookingQuery.data;
  const weeklyRate = useMemo(() => {
    const snap = b?.pricing_snapshot as { weekly_rate?: number } | undefined;
    return Number(snap?.weekly_rate ?? 0);
  }, [b?.pricing_snapshot]);

  const renewExtension = useMemo(() => {
    if (!b?.end_at) return null;
    const to = new Date(b.end_at);
    to.setDate(to.getDate() + WEEKLY_RENTAL_RENEWAL_DAYS);
    return {
      fromDate: formatBookingDateTime(b.end_at),
      toDate: formatBookingDateTime(to.toISOString()),
    };
  }, [b?.end_at]);

  const paymentSummary = useMemo(() => {
    const payments = b?.payments ?? [];
    const paidRent = payments
      .filter((p) => p.payment_type === "rent" && p.status === "paid")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const total = Number(b?.total_amount ?? 0);
    let rentState: "paid" | "partial" | "unpaid" = "unpaid";
    if (total > 0 && paidRent >= total) rentState = "paid";
    else if (paidRent > 0) rentState = "partial";

    const latestPaid = [...payments]
      .filter((p) => p.status === "paid")
      .sort(
        (a, c) =>
          new Date(c.paid_at ?? c.created_at ?? 0).getTime() -
          new Date(a.paid_at ?? a.created_at ?? 0).getTime(),
      )[0];

    const latestPaidAt = latestPaid
      ? formatPaymentDateTime(latestPaid.paid_at ?? latestPaid.created_at)
      : null;

    return { rentState, latestPaidAt };
  }, [b?.payments, b?.total_amount]);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["rentals"] });
  };

  const confirmMut = useMutation({
    mutationFn: () => confirmRentalBooking(id!),
    onSuccess: invalidate,
    onError: (err: unknown) => {
      setActionError(extractError(err) ?? t("pages.bookingDetail.confirmFailedDefault"));
    },
  });
  const cancelMut = useMutation({
    mutationFn: () => cancelRentalBooking(id!, "Cancelled by user"),
    onSuccess: () => {
      invalidate();
      navigate("/rentals/bookings");
    },
    onError: (err: unknown) => setActionError(extractError(err) ?? t("pages.bookingDetail.cancelFailedDefault")),
  });
  const pickupMut = useMutation({
    mutationFn: () => pickupRentalBooking(id!, mileageOut ? Number(mileageOut) : undefined),
    onSuccess: invalidate,
    onError: (err: unknown) => setActionError(extractError(err) ?? t("pages.bookingDetail.pickupFailedDefault")),
  });
  const returnMut = useMutation({
    mutationFn: () =>
      returnRentalBooking(id!, {
        mileageIn: mileageIn ? Number(mileageIn) : undefined,
        damageNotes: damageNotes || undefined,
        damageReported: !!damageNotes,
      }),
    onSuccess: invalidate,
    onError: (err: unknown) => setActionError(extractError(err) ?? t("pages.bookingDetail.returnFailedDefault")),
  });
  const payMut = useMutation({
    mutationFn: () =>
      createRentalPayment(id!, {
        amount: Number(payAmount),
        paymentType: payType,
        status: "paid",
        method: payMethod,
      }),
    onSuccess: () => {
      setPayAmount("");
      invalidate();
    },
    onError: (err: unknown) => setActionError(extractError(err) ?? t("pages.bookingDetail.paymentFailedDefault")),
  });
  const renewMut = useMutation({
    mutationFn: () =>
      renewWeeklyBooking(id!, {
        paymentAmount: Number(renewAmount) || undefined,
        recordPayment: true,
        paymentMethod: renewMethod,
      }),
    onSuccess: () => {
      setActionError(null);
      invalidate();
    },
    onError: (err: unknown) => setActionError(extractError(err) ?? t("pages.bookingDetail.renewFailedDefault")),
  });

  if (bookingQuery.isLoading) return <p className="p-8">{t("common.loading")}</p>;
  if (!b) return <p className="p-8 text-rose-700">{t("pages.bookingDetail.notFound")}</p>;

  const showRenew =
    canManage && b.rental_type === "weekly" && (b.status === "active" || b.status === "confirmed");

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title={b.booking_number}
        subtitle={`${b.customer_name} · ${b.license_plate}`}
        backTo="/rentals/bookings"
        backLabel={t("nav.bookings")}
      />

      {actionError && (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{actionError}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">{t("pages.bookingDetail.detailsTitle")}</h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
            >
              {formatBookingStatus(b.status)}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.bookingDetail.periodLabel")}</dt>
              <dd>
                {formatBookingDateTime(b.start_at)} – {formatBookingDateTime(b.end_at)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.bookingDetail.typeLabel")}</dt>
              <dd className="capitalize">{b.rental_type}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>{t("pages.bookingDetail.totalLabel")}</dt>
              <dd className="tabular-nums">{formatCurrency(Number(b.total_amount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.bookingDetail.depositLabel")}</dt>
              <dd className="tabular-nums">{formatCurrency(Number(b.deposit_amount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">{t("pages.bookingDetail.rentPaymentLabel")}</dt>
              <dd className={`font-medium ${rentPaymentStateClass(paymentSummary.rentState)}`}>
                {rentPaymentStateLabel(paymentSummary.rentState)}
              </dd>
            </div>
            {paymentSummary.latestPaidAt && (
              <div className="flex justify-between">
                <dt className="text-slate-500">{t("pages.bookingDetail.lastPaymentLabel")}</dt>
                <dd>
                  {paymentSummary.latestPaidAt.date}
                  {paymentSummary.latestPaidAt.time ? ` · ${paymentSummary.latestPaidAt.time}` : ""}
                </dd>
              </div>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {canManage && b.status === "draft" && (
              <>
                <button type="button" className={btnPrimary} disabled={confirmMut.isPending} onClick={() => confirmMut.mutate()}>
                  {t("pages.bookingDetail.confirm")}
                </button>
                <Link to={`/rentals/bookings/${id}/edit`} className={btnSecondary}>
                  {t("common.edit")}
                </Link>
              </>
            )}
            {canManage && b.status === "confirmed" && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs text-slate-500">
                  {t("pages.bookingDetail.mileageOut")}
                  <input
                    type="number"
                    className="mt-1 block rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={mileageOut}
                    onChange={(e) => setMileageOut(e.target.value)}
                  />
                </label>
                <button type="button" className={btnPrimary} disabled={pickupMut.isPending} onClick={() => pickupMut.mutate()}>
                  {t("pages.bookingDetail.pickup")}
                </button>
              </div>
            )}
            {canManage && b.status === "active" && (
              <div className="w-full space-y-2">
                <label className="block text-xs text-slate-500">
                  {t("pages.bookingDetail.mileageIn")}
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={mileageIn}
                    onChange={(e) => setMileageIn(e.target.value)}
                  />
                </label>
                <textarea
                  placeholder={t("pages.bookingDetail.damageNotesPlaceholder")}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                />
                <button type="button" className={btnPrimary} disabled={returnMut.isPending} onClick={() => returnMut.mutate()}>
                  {t("pages.bookingDetail.returnVehicle")}
                </button>
              </div>
            )}
            {canManage && (b.status === "draft" || b.status === "confirmed") && (
              <button type="button" className={btnSecondary} disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}>
                {t("pages.bookings.cancelBookingAction")}
              </button>
            )}
          </div>
        </article>

        <div className="space-y-6">
          {showRenew && (
            <article className="rounded-2xl border border-brand/20 bg-brand-mint/10 p-5 shadow-sm">
              <h2 className="font-semibold text-ink">{t("pages.bookings.renew1WeekAction")}</h2>
              <p className="mt-1 text-sm text-slate-600">
                {renewExtension && (
                  <Trans
                    i18nKey="pages.bookingDetail.extendsRentalTo"
                    values={{ fromDate: renewExtension.fromDate, toDate: renewExtension.toDate }}
                    components={{ b: <strong /> }}
                  />
                )}
              </p>
              <label className="mt-4 block text-sm">
                <span className="font-medium text-ink">{t("pages.bookingDetail.paymentAmount")}</span>
                <input
                  type="number"
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={renewAmount || (weeklyRate > 0 ? String(weeklyRate) : "")}
                  onChange={(e) => setRenewAmount(e.target.value)}
                />
              </label>
              <label className="mt-3 block text-sm">
                <span className="font-medium text-ink">{t("pages.bookingDetail.paymentMethod")}</span>
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={renewMethod}
                  onChange={(e) => setRenewMethod(e.target.value as RentalPaymentMethod)}
                >
                  {RENTAL_PAYMENT_METHODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className={`${btnPrimary} mt-4`}
                disabled={renewMut.isPending || b.status !== "active"}
                onClick={() => renewMut.mutate()}
                title={b.status !== "active" ? t("pages.bookingDetail.pickupRequiredTitle") : undefined}
              >
                {renewMut.isPending ? t("pages.bookingDetail.renewing") : t("pages.bookingDetail.renewAndRecordPayment")}
              </button>
              {b.status !== "active" && (
                <p className="mt-2 text-xs text-slate-500">{t("pages.bookingDetail.completePickupHint")}</p>
              )}
            </article>
          )}

          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-ink">{t("pages.bookingDetail.paymentsTitle")}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(b.payments ?? []).map((p) => {
                const dt = formatPaymentDateTime(p.paid_at ?? p.created_at);
                return (
                  <li
                    key={p.id}
                    className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {paymentTypeLabel(p.payment_type)} · {paymentStatusLabel(p.status)}
                        {p.method ? ` · ${rentalPaymentMethodLabel(p.method)}` : ""}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {dt.date}
                        {dt.time ? ` · ${dt.time}` : ""}
                      </p>
                      {p.notes ? <p className="mt-0.5 text-xs text-slate-500">{p.notes}</p> : null}
                    </div>
                    <span className="shrink-0 tabular-nums font-medium">
                      {formatCurrency(Number(p.amount))}
                    </span>
                  </li>
                );
              })}
              {(b.payments ?? []).length === 0 && <li className="text-slate-500">{t("pages.bookingDetail.noPaymentsRecorded")}</li>}
            </ul>
            {canManage && (
              <div className="mt-4 flex flex-wrap gap-2">
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={payType}
                  onChange={(e) => setPayType(e.target.value as RentalPayment["payment_type"])}
                >
                  <option value="rent">{t("rentalStatus.paymentType.rent")}</option>
                  <option value="deposit">{t("rentalStatus.paymentType.deposit")}</option>
                  <option value="deposit_refund">{t("rentalStatus.paymentType.deposit_refund")}</option>
                  <option value="extra">{t("rentalStatus.paymentType.extra")}</option>
                  <option value="damage">{t("rentalStatus.paymentType.damage")}</option>
                </select>
                <input
                  type="number"
                  placeholder={t("pages.bookingDetail.amountPlaceholder")}
                  className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                />
                <select
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as RentalPaymentMethod)}
                >
                  {RENTAL_PAYMENT_METHODS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className={btnPrimary}
                  disabled={payMut.isPending || !payAmount}
                  onClick={() => payMut.mutate()}
                >
                  {t("pages.bookingDetail.recordPayment")}
                </button>
              </div>
            )}
            <button
              type="button"
              className={`${btnSecondary} mt-4 inline-flex`}
              disabled={contractLoading}
              onClick={async () => {
                setContractLoading(true);
                try {
                  await downloadRentalContract(id!);
                } finally {
                  setContractLoading(false);
                }
              }}
            >
              {contractLoading ? t("pages.bookingDetail.downloading") : t("pages.bookingDetail.downloadContract")}
            </button>
          </article>
        </div>
      </div>
    </div>
  );
}

function extractError(err: unknown): string | null {
  if (err && typeof err === "object" && "response" in err) {
    const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message;
    return typeof msg === "string" ? msg : null;
  }
  return err instanceof Error ? err.message : null;
}
