import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { quickWeeklyRental, quoteRental, type RentalQuote } from "../../api/rentals";
import { CustomerSelectField } from "./booking-form/CustomerSelectField";
import { VehicleSelectField } from "./booking-form/VehicleSelectField";
import { combineDateAndTime, weeklyReturnDateFromPickup } from "./booking-form/bookingFormUtils";
import { btnPrimary, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";
import {
  DEFAULT_RENTAL_PAYMENT_METHOD,
  RENTAL_PAYMENT_METHODS,
  type RentalPaymentMethod,
} from "./payments/rentalPaymentMethods";

type QuickWeeklyRentalModalProps = {
  open: boolean;
  onClose: () => void;
  initialCustomerId?: string;
  initialVehicleId?: string;
  initialStartAt?: string;
  onSuccess?: (bookingId: string) => void;
};

function todayDateStr(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function QuickWeeklyRentalModal({
  open,
  onClose,
  initialCustomerId,
  initialVehicleId,
  initialStartAt,
  onSuccess,
}: QuickWeeklyRentalModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [pickupDate, setPickupDate] = useState(todayDateStr());
  const [pickupTime, setPickupTime] = useState("10:00");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<RentalPaymentMethod>(DEFAULT_RENTAL_PAYMENT_METHOD);
  const [recordPayment, setRecordPayment] = useState(true);
  const [skipPickup, setSkipPickup] = useState(false);
  const [mileageOut, setMileageOut] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<RentalQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const returnDate = useMemo(() => weeklyReturnDateFromPickup(pickupDate), [pickupDate]);
  const startIso = useMemo(
    () => combineDateAndTime(pickupDate, pickupTime),
    [pickupDate, pickupTime],
  );
  const endIso = useMemo(() => combineDateAndTime(returnDate, pickupTime), [returnDate, pickupTime]);

  useEffect(() => {
    if (!open) return;
    setCustomerId(initialCustomerId ?? "");
    setVehicleId(initialVehicleId ?? "");
    if (initialStartAt) {
      const d = initialStartAt.slice(0, 10);
      setPickupDate(d);
      if (initialStartAt.includes("T")) {
        setPickupTime(initialStartAt.slice(11, 16) || "10:00");
      }
    } else {
      setPickupDate(todayDateStr());
      setPickupTime("10:00");
    }
    setRecordPayment(true);
    setPaymentMethod(DEFAULT_RENTAL_PAYMENT_METHOD);
    setSkipPickup(false);
    setMileageOut("");
    setError(null);
  }, [open, initialCustomerId, initialVehicleId, initialStartAt]);

  useEffect(() => {
    if (!open || !vehicleId || !startIso || !endIso) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }
    setQuoteLoading(true);
    const timer = setTimeout(() => {
      quoteRental({ vehicleId, rentalType: "weekly", startAt: startIso, endAt: endIso })
        .then((r) => {
          setQuote(r.data);
          setPaymentAmount(String(r.data.subtotal ?? ""));
        })
        .catch(() => setQuote(null))
        .finally(() => setQuoteLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [open, vehicleId, startIso, endIso]);

  const mutation = useMutation({
    mutationFn: () =>
      quickWeeklyRental({
        customerId,
        vehicleId,
        startAt: startIso!,
        endAt: endIso!,
        paymentAmount: recordPayment ? Number(paymentAmount) || undefined : undefined,
        recordPayment,
        paymentMethod: recordPayment ? paymentMethod : undefined,
        mileageOut: mileageOut ? Number(mileageOut) : undefined,
        skipPickup,
      }),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ["rentals"] });
      void queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      onSuccess?.(res.data.id);
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setError(msg ?? t("pages.bookingForm.failedToStartWeekly"));
    },
  });

  if (!open) return null;

  const canSubmit =
    !!customerId && !!vehicleId && !!startIso && !!endIso && quote?.available !== false;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[200] bg-black/20 backdrop-blur-[1px]"
        aria-label={t("common.close")}
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 z-[201] max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border/80 bg-white p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-weekly-title"
      >
        <h2 id="quick-weekly-title" className="text-lg font-semibold text-ink">
          {t("pages.availability.quickWeekly")}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {t("pages.bookingForm.quickWeeklyDesc")}
        </p>

        <div className="mt-5 space-y-4">
          <CustomerSelectField
            value={customerId}
            onChange={setCustomerId}
            serverSearch
          />

          <VehicleSelectField
            value={vehicleId}
            onChange={setVehicleId}
            serverSearch
            quote={quote}
            quoteLoading={quoteLoading}
          />

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-ink">{t("pages.bookingForm.startLabel")}</span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-ink">{t("pages.bookingForm.endLabel")}</span>
              <input
                type="date"
                readOnly
                className="mt-1 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                value={returnDate}
              />
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-medium text-ink">{t("pages.bookingForm.weeklyRentLabel")}</span>
            <input
              type="number"
              min={0}
              step="0.01"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              disabled={!recordPayment}
            />
            {quote && (
              <span className="mt-1 block text-xs text-slate-500">
                {t("pages.bookingForm.quotedLabel", { amount: formatCurrency(quote.subtotal) })}
                {quote.conflict ? ` — ${quote.conflict.message}` : ""}
              </span>
            )}
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={recordPayment}
              onChange={(e) => setRecordPayment(e.target.checked)}
            />
            {t("pages.bookingForm.recordPaymentNow")}
          </label>

          {recordPayment && (
            <label className="block text-sm">
              <span className="font-medium text-ink">{t("pages.payments.paymentMethodLabel")}</span>
              <select
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as RentalPaymentMethod)}
              >
                {RENTAL_PAYMENT_METHODS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={skipPickup} onChange={(e) => setSkipPickup(e.target.checked)} />
            {t("pages.bookingForm.skipPickupLabel")}
          </label>

          <label className="block text-sm">
            <span className="font-medium text-ink">{t("pages.bookingForm.mileageOutOptional")}</span>
            <input
              type="number"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2"
              value={mileageOut}
              onChange={(e) => setMileageOut(e.target.value)}
            />
          </label>

          {error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <Link to="/rentals/bookings/new" className="text-sm font-medium text-brand hover:underline">
            {t("pages.availability.advancedBooking")}
          </Link>
          <div className="flex gap-2">
            <button type="button" className={btnSecondary} onClick={onClose} disabled={mutation.isPending}>
              {t("common.cancel")}
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={!canSubmit || mutation.isPending}
              onClick={() => mutation.mutate()}
            >
              {mutation.isPending ? t("pages.bookingForm.startingButton") : t("pages.bookingForm.startWeeklyRental")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
