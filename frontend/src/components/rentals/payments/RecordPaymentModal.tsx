import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { RentalPaymentListItem } from "../../../api/rentals";
import { createRentalPayment, getRentalBookings, updateRentalPayment } from "../../../api/rentals";
import { btnPrimary, btnSecondary } from "../../../theme/classNames";
import {
  coerceRentalPaymentMethodForSelect,
  DEFAULT_RENTAL_PAYMENT_METHOD,
  RENTAL_PAYMENT_METHODS,
  type RentalPaymentMethod,
} from "./rentalPaymentMethods";

type RecordPaymentModalProps = {
  open: boolean;
  editing: RentalPaymentListItem | null;
  onClose: () => void;
};

export function RecordPaymentModal({ open, editing, onClose }: RecordPaymentModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [bookingId, setBookingId] = useState("");
  const [paymentType, setPaymentType] = useState("rent");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<RentalPaymentMethod>(DEFAULT_RENTAL_PAYMENT_METHOD);
  const [status, setStatus] = useState("paid");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const bookingsQuery = useQuery({
    queryKey: ["rentals", "bookings", "payment-modal"],
    queryFn: () =>
      getRentalBookings({ status: undefined }).then((r) =>
        r.data.filter((b) => b.status !== "cancelled"),
      ),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setBookingId(editing.booking_id);
      setPaymentType(editing.payment_type);
      setAmount(String(editing.amount));
      setMethod(coerceRentalPaymentMethodForSelect(editing.method));
      setStatus(editing.status);
      setReference(editing.reference ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setBookingId("");
      setPaymentType("rent");
      setAmount("");
      setMethod(DEFAULT_RENTAL_PAYMENT_METHOD);
      setStatus("paid");
      setReference("");
      setNotes("");
    }
    setError(null);
  }, [open, editing]);

  const mutation = useMutation({
    mutationFn: async () => {
      const body = {
        paymentType,
        amount: Number(amount),
        method: method || null,
        status,
        reference: reference.trim() || null,
        notes: notes.trim() || null,
        paidAt: status === "paid" ? new Date().toISOString() : null,
      };
      if (editing) {
        return updateRentalPayment(editing.id, body);
      }
      if (!bookingId) throw new Error(t("pages.payments.selectBookingError"));
      return createRentalPayment(bookingId, body);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["rentals", "payments"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "payments", "summary"] });
      void queryClient.invalidateQueries({ queryKey: ["rentals", "payments", "activity"] });
      onClose();
    },
    onError: (err: unknown) => {
      const msg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : err instanceof Error
            ? err.message
            : null;
      setError(msg ?? t("pages.payments.failedToSave"));
    },
  });

  if (!open) return null;

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
      >
        <h2 className="text-lg font-semibold text-ink">
          {editing ? t("pages.payments.editPayment") : t("pages.payments.recordPayment")}
        </h2>

        <div className="mt-4 space-y-3">
          {!editing ? (
            <label className="block text-sm font-medium text-ink">
              {t("pages.payments.bookingLabel")}
              <select
                className="fm-rental-payments__filter-select mt-1 w-full"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              >
                <option value="">{t("pages.payments.selectBooking")}</option>
                {(bookingsQuery.data ?? []).map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.booking_number} — {b.customer_name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="text-sm text-slate-600">
              {t("pages.payments.bookingColonLabel")} <span className="font-semibold">{editing.booking_number}</span>
            </p>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium text-ink">
              {t("pages.payments.typeSelectLabel")}
              <select
                className="fm-rental-payments__filter-select mt-1 w-full"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <option value="rent">{t("rentalStatus.paymentType.rent")}</option>
                <option value="deposit">{t("rentalStatus.paymentType.deposit")}</option>
                <option value="deposit_refund">{t("rentalStatus.paymentType.deposit_refund")}</option>
                <option value="extra">{t("rentalStatus.paymentType.extra")}</option>
                <option value="damage">{t("rentalStatus.paymentType.damage")}</option>
              </select>
            </label>
            <label className="block text-sm font-medium text-ink">
              {t("pages.payments.statusSelectLabel")}
              <select
                className="fm-rental-payments__filter-select mt-1 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="paid">{t("rentalStatus.payment.paid")}</option>
                <option value="pending">{t("rentalStatus.payment.pending")}</option>
                <option value="failed">{t("rentalStatus.payment.failed")}</option>
                <option value="refunded">{t("rentalStatus.payment.refunded")}</option>
              </select>
            </label>
          </div>

          <label className="block text-sm font-medium text-ink">
            {t("pages.payments.amountLabel")}
            <input
              type="number"
              min="0"
              step="0.01"
              className="fm-rental-payments__filter-select mt-1 w-full"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            {t("pages.payments.paymentMethodLabel")}
            <select
              className="fm-rental-payments__filter-select mt-1 w-full"
              value={method}
              onChange={(e) => setMethod(e.target.value as RentalPaymentMethod)}
            >
              {RENTAL_PAYMENT_METHODS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-ink">
            {t("pages.payments.referenceFieldLabel")}
            <input
              className="fm-rental-payments__filter-select mt-1 w-full"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>

          <label className="block text-sm font-medium text-ink">
            {t("pages.payments.notesFieldLabel")}
            <textarea
              className="fm-rental-payments__filter-select mt-1 w-full min-h-[72px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>
        </div>

        {error ? (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" className={btnSecondary} onClick={onClose} disabled={mutation.isPending}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className={btnPrimary}
            disabled={mutation.isPending || (!editing && !bookingId) || !amount}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t("common.saving") : editing ? t("pages.payments.saveChanges") : t("pages.payments.recordPayment")}
          </button>
        </div>
      </div>
    </>
  );
}
