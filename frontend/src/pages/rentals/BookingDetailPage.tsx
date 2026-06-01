import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  cancelRentalBooking,
  confirmRentalBooking,
  createRentalPayment,
  downloadRentalContract,
  getRentalBooking,
  pickupRentalBooking,
  returnRentalBooking,
  type RentalPayment,
} from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { bookingStatusClass, formatBookingStatus } from "../../components/rentals/rentalStatus";
import { btnPrimary, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mileageOut, setMileageOut] = useState("");
  const [mileageIn, setMileageIn] = useState("");
  const [damageNotes, setDamageNotes] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [payType, setPayType] = useState<RentalPayment["payment_type"]>("rent");
  const [contractLoading, setContractLoading] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["rentals", "booking", id],
    queryFn: () => getRentalBooking(id!).then((r) => r.data),
    enabled: !!id,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ["rentals"] });
  };

  const confirmMut = useMutation({
    mutationFn: () => confirmRentalBooking(id!),
    onSuccess: invalidate,
  });
  const cancelMut = useMutation({
    mutationFn: () => cancelRentalBooking(id!, "Cancelled by user"),
    onSuccess: () => {
      invalidate();
      navigate("/rentals/bookings");
    },
  });
  const pickupMut = useMutation({
    mutationFn: () => pickupRentalBooking(id!, mileageOut ? Number(mileageOut) : undefined),
    onSuccess: invalidate,
  });
  const returnMut = useMutation({
    mutationFn: () =>
      returnRentalBooking(id!, {
        mileageIn: mileageIn ? Number(mileageIn) : undefined,
        damageNotes: damageNotes || undefined,
        damageReported: !!damageNotes,
      }),
    onSuccess: invalidate,
  });
  const payMut = useMutation({
    mutationFn: () =>
      createRentalPayment(id!, {
        amount: Number(payAmount),
        paymentType: payType,
        status: "paid",
      }),
    onSuccess: () => {
      setPayAmount("");
      invalidate();
    },
  });

  const b = bookingQuery.data;
  if (bookingQuery.isLoading) return <p className="p-8">Loading…</p>;
  if (!b) return <p className="p-8 text-rose-700">Booking not found.</p>;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title={b.booking_number}
        subtitle={`${b.customer_name} · ${b.license_plate}`}
        backTo="/rentals/bookings"
        backLabel="Bookings"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold text-ink">Details</h2>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
            >
              {formatBookingStatus(b.status)}
            </span>
          </div>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">Period</dt>
              <dd>
                {b.start_at.slice(0, 16)} – {b.end_at.slice(0, 16)}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Type</dt>
              <dd className="capitalize">{b.rental_type}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCurrency(Number(b.total_amount))}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Deposit</dt>
              <dd className="tabular-nums">{formatCurrency(Number(b.deposit_amount))}</dd>
            </div>
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            {b.status === "draft" && (
              <>
                <button type="button" className={btnPrimary} disabled={confirmMut.isPending} onClick={() => confirmMut.mutate()}>
                  Confirm
                </button>
                <Link to={`/rentals/bookings/${id}/edit`} className={btnSecondary}>
                  Edit
                </Link>
              </>
            )}
            {b.status === "confirmed" && (
              <div className="flex flex-wrap items-end gap-2">
                <label className="text-xs text-slate-500">
                  Mileage out
                  <input
                    type="number"
                    className="mt-1 block rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={mileageOut}
                    onChange={(e) => setMileageOut(e.target.value)}
                  />
                </label>
                <button type="button" className={btnPrimary} disabled={pickupMut.isPending} onClick={() => pickupMut.mutate()}>
                  Pickup
                </button>
              </div>
            )}
            {b.status === "active" && (
              <div className="w-full space-y-2">
                <label className="block text-xs text-slate-500">
                  Mileage in
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                    value={mileageIn}
                    onChange={(e) => setMileageIn(e.target.value)}
                  />
                </label>
                <textarea
                  placeholder="Damage notes (optional)"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  value={damageNotes}
                  onChange={(e) => setDamageNotes(e.target.value)}
                />
                <button type="button" className={btnPrimary} disabled={returnMut.isPending} onClick={() => returnMut.mutate()}>
                  Return vehicle
                </button>
              </div>
            )}
            {(b.status === "draft" || b.status === "confirmed") && (
              <button type="button" className={btnSecondary} disabled={cancelMut.isPending} onClick={() => cancelMut.mutate()}>
                Cancel booking
              </button>
            )}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-ink">Payments</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(b.payments ?? []).map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                <span className="capitalize">
                  {p.payment_type} · {p.status}
                </span>
                <span className="tabular-nums font-medium">{formatCurrency(Number(p.amount))}</span>
              </li>
            ))}
            {(b.payments ?? []).length === 0 && <li className="text-slate-500">No payments recorded.</li>}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={payType}
              onChange={(e) => setPayType(e.target.value)}
            >
              <option value="rent">Rent</option>
              <option value="deposit">Deposit</option>
              <option value="deposit_refund">Deposit refund</option>
              <option value="extra">Extra</option>
              <option value="damage">Damage</option>
            </select>
            <input
              type="number"
              placeholder="Amount"
              className="min-w-[120px] flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
            />
            <button
              type="button"
              className={btnPrimary}
              disabled={payMut.isPending || !payAmount}
              onClick={() => payMut.mutate()}
            >
              Record payment
            </button>
          </div>
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
            {contractLoading ? "Downloading…" : "Download contract"}
          </button>
        </article>
      </div>
    </div>
  );
}
