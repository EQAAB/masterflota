import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getVehicles } from "../../api/vehicles";
import {
  createRentalBooking,
  getRentalBooking,
  getRentalCustomers,
  quoteRental,
  updateRentalBooking,
} from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { btnPrimary, btnSecondary } from "../../theme/classNames";
import { formatCurrency } from "../../utils/currency";

export function BookingFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [customerId, setCustomerId] = useState("");
  const [vehicleId, setVehicleId] = useState(searchParams.get("vehicleId") ?? "");
  const [rentalType, setRentalType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [quote, setQuote] = useState<{ subtotal: number; deposit: number; total: number } | null>(null);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const customersQuery = useQuery({
    queryKey: ["rentals", "customers"],
    queryFn: () => getRentalCustomers().then((r) => r.data),
  });
  const vehiclesQuery = useQuery({
    queryKey: ["vehicles", "list-rental"],
    queryFn: () => getVehicles({ limit: 200 }).then((r) => r.data.data),
  });
  const existingQuery = useQuery({
    queryKey: ["rentals", "booking", id],
    queryFn: () => getRentalBooking(id!).then((r) => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    const b = existingQuery.data;
    if (!b) return;
    setCustomerId(b.customer_id);
    setVehicleId(b.vehicle_id);
    setRentalType(b.rental_type);
    setStartAt(b.start_at.slice(0, 16));
    setEndAt(b.end_at.slice(0, 16));
  }, [existingQuery.data]);

  useEffect(() => {
    if (!vehicleId || !startAt || !endAt) {
      setQuote(null);
      return;
    }
    const t = setTimeout(() => {
      quoteRental({
        vehicleId,
        rentalType,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      })
        .then((r) => {
          if (r.data.conflict) {
            setQuoteError(r.data.conflict.message);
            setQuote(null);
          } else {
            setQuoteError(null);
            setQuote({ subtotal: r.data.subtotal, deposit: r.data.deposit, total: r.data.total });
          }
        })
        .catch(() => setQuoteError("Could not get quote"));
    }, 400);
    return () => clearTimeout(t);
  }, [vehicleId, rentalType, startAt, endAt]);

  const saveMut = useMutation({
    mutationFn: async () => {
      const body = {
        customerId,
        vehicleId,
        rentalType,
        startAt: new Date(startAt).toISOString(),
        endAt: new Date(endAt).toISOString(),
      };
      if (isEdit) return updateRentalBooking(id!, body).then((r) => r.data);
      return createRentalBooking(body).then((r) => r.data);
    },
    onSuccess: (b) => navigate(`/rentals/bookings/${b.id}`),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader
        title={isEdit ? "Edit booking" : "New booking"}
        backTo={isEdit ? `/rentals/bookings/${id}` : "/rentals/bookings"}
        backLabel={isEdit ? "Booking" : "Bookings"}
      />

      <form
        className="max-w-xl space-y-4 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm"
        onSubmit={(e) => {
          e.preventDefault();
          saveMut.mutate();
        }}
      >
        <label className="block text-sm">
          <span className="font-medium text-ink">Customer</span>
          <select
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
          >
            <option value="">Select customer</option>
            {(customersQuery.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.legal_name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink">Vehicle</span>
          <select
            required
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={vehicleId}
            onChange={(e) => setVehicleId(e.target.value)}
          >
            <option value="">Select vehicle</option>
            {(vehiclesQuery.data ?? []).map((v) => (
              <option key={v.id} value={v.id}>
                {v.license_plate} — {v.make} {v.model}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="font-medium text-ink">Rental type</span>
          <select
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
            value={rentalType}
            onChange={(e) => setRentalType(e.target.value as typeof rentalType)}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium text-ink">Start</span>
            <input
              type="datetime-local"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-ink">End</span>
            <input
              type="datetime-local"
              required
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
            />
          </label>
        </div>

        {quoteError && <p className="text-sm text-rose-700">{quoteError}</p>}
        {quote && (
          <div className="rounded-xl bg-violet-50/80 p-4 text-sm ring-1 ring-violet-200/50">
            <p>
              Subtotal: <strong>{formatCurrency(quote.subtotal)}</strong>
            </p>
            <p>
              Deposit: <strong>{formatCurrency(quote.deposit)}</strong>
            </p>
            <p>
              Total: <strong>{formatCurrency(quote.total)}</strong>
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button type="submit" className={btnPrimary} disabled={saveMut.isPending}>
            {isEdit ? "Save" : "Create draft"}
          </button>
          <button type="button" className={btnSecondary} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </form>

      {!isEdit && (customersQuery.data ?? []).length === 0 && (
        <p className="mt-4 text-sm text-slate-600">
          <a href="/rentals/customers/new" className="text-brand hover:underline">
            Add a customer
          </a>{" "}
          first.
        </p>
      )}
    </div>
  );
}
