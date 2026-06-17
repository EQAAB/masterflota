import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getRentalBookings, getRentalDashboard } from "../../api/rentals";
import { QuickWeeklyRentalModal } from "../../components/rentals/QuickWeeklyRentalModal";
import { BookingsKpiRow } from "../../components/rentals/bookings/BookingsKpiRow";
import { BookingsPageHeader } from "../../components/rentals/bookings/BookingsPageHeader";
import { BookingsTable } from "../../components/rentals/bookings/BookingsTable";
import { BookingsToolbar, type BookingsFilters } from "../../components/rentals/bookings/BookingsToolbar";
import {
  exportBookingsCsv,
  loadBookingsDensity,
  saveBookingsDensity,
  type BookingsDensity,
} from "../../components/rentals/bookings/bookingsListUtils";
import { useQuickWeeklyRentalModal } from "../../hooks/useQuickWeeklyRentalModal";
import { dashboardPage } from "../../theme/classNames";

function useDebounce<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export function BookingsListPage() {
  const navigate = useNavigate();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get("status") ?? "";
  const initialCustomerId = searchParams.get("customerId") ?? "";

  const [filters, setFilters] = useState<BookingsFilters>({
    q: "",
    status: initialStatus,
    from: "",
    to: "",
    vehicleId: "",
    customerId: initialCustomerId,
  });
  const [density, setDensity] = useState<BookingsDensity>(loadBookingsDensity);

  const debouncedQ = useDebounce(filters.q, 300);

  const queryParams = useMemo(
    () => ({
      status: filters.status || undefined,
      vehicleId: filters.vehicleId || undefined,
      customerId: filters.customerId || undefined,
      from: filters.from ? `${filters.from}T00:00:00.000Z` : undefined,
      to: filters.to ? `${filters.to}T23:59:59.999Z` : undefined,
      q: debouncedQ.trim() || undefined,
    }),
    [filters.status, filters.vehicleId, filters.customerId, filters.from, filters.to, debouncedQ],
  );

  const bookingsQuery = useQuery({
    queryKey: ["rentals", "bookings", queryParams],
    queryFn: () => getRentalBookings(queryParams).then((r) => r.data),
  });

  const dashboardQuery = useQuery({
    queryKey: ["rentals", "dashboard"],
    queryFn: () => getRentalDashboard().then((r) => r.data),
  });

  const bookings = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isLoading || dashboardQuery.isLoading;

  const patchFilters = (patch: Partial<BookingsFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
  };

  const handleDensityChange = (d: BookingsDensity) => {
    setDensity(d);
    saveBookingsDensity(d);
  };

  return (
    <div className="fm-rental-bookings flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <BookingsPageHeader onQuickWeekly={() => openQuickWeeklyRental()} />

        <BookingsKpiRow dashboard={dashboardQuery.data} bookings={bookings} loading={loading} />

        <BookingsToolbar
          filters={filters}
          onChange={patchFilters}
          density={density}
          onDensityChange={handleDensityChange}
          onExport={() => exportBookingsCsv(bookings)}
          resultCount={bookings.length}
        />

        {bookingsQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Failed to load bookings. Check your connection and try again.
          </p>
        )}

        <BookingsTable
          bookings={bookings}
          loading={bookingsQuery.isLoading}
          density={density}
          onRenewNavigate={(bookingId) => navigate(`/rentals/bookings/${bookingId}`)}
        />
      </div>
      <QuickWeeklyRentalModal
        open={quickWeeklyModal.open}
        onClose={closeQuickWeeklyRental}
        initialCustomerId={quickWeeklyModal.customerId}
        initialVehicleId={quickWeeklyModal.vehicleId}
        initialStartAt={quickWeeklyModal.startAt}
        onSuccess={(bookingId) => navigate(`/rentals/bookings/${bookingId}`)}
      />
    </div>
  );
}
