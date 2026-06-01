import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getRentalAvailability } from "../../api/rentals";
import { RentalPageHeader } from "../../components/rentals/RentalPageHeader";
import { bookingStatusClass, formatBookingStatus } from "../../components/rentals/rentalStatus";

function monthRange(d: Date): { from: string; to: string } {
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

export function RentalCalendarPage() {
  const [month, setMonth] = useState(() => new Date());
  const range = useMemo(() => monthRange(month), [month]);

  const { data, isLoading } = useQuery({
    queryKey: ["rentals", "availability", range.from, range.to],
    queryFn: () => getRentalAvailability(range).then((r) => r.data),
  });

  return (
    <div className="flex min-h-full flex-1 flex-col bg-surface-elevated p-6 sm:p-8">
      <RentalPageHeader title="Booking calendar" subtitle="Upcoming and active rentals." backTo="/rentals" />

      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          Previous
        </button>
        <span className="text-sm font-semibold text-ink">
          {month.toLocaleString("en-GB", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm"
          onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          Next
        </button>
      </div>

      {isLoading && <p className="text-sm text-slate-500">Loading…</p>}

      <div className="space-y-3">
        {(data?.bookings ?? []).map((b) => (
          <Link
            key={b.id}
            to={`/rentals/bookings/${b.id}`}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm hover:border-brand/30"
          >
            <div>
              <p className="font-semibold text-ink">{b.booking_number}</p>
              <p className="text-sm text-slate-600">
                {b.customer_name} · {b.license_plate}
              </p>
              <p className="text-xs text-slate-500">
                {b.start_at.slice(0, 10)} – {b.end_at.slice(0, 10)}
              </p>
            </div>
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${bookingStatusClass(b.status)}`}
            >
              {formatBookingStatus(b.status)}
            </span>
          </Link>
        ))}
        {(data?.bookings ?? []).length === 0 && !isLoading && (
          <p className="text-sm text-slate-500">No bookings in this period.</p>
        )}
      </div>
    </div>
  );
}
