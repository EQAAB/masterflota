import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getRentalAvailability, getRentalDashboard } from "../../api/rentals";
import type { RentalAvailabilityBooking, RentalBooking } from "../../api/rentals";
import { QuickWeeklyRentalModal } from "../../components/rentals/QuickWeeklyRentalModal";
import { BookingsKpiRow } from "../../components/rentals/bookings/BookingsKpiRow";
import { BookingCalendarDrawer } from "../../components/rentals/calendar/BookingCalendarDrawer";
import { CalendarFilterBar } from "../../components/rentals/calendar/CalendarFilterBar";
import { CalendarLegend } from "../../components/rentals/calendar/CalendarLegend";
import { CalendarListView } from "../../components/rentals/calendar/CalendarListView";
import { CalendarMonthGrid } from "../../components/rentals/calendar/CalendarMonthGrid";
import { CalendarNav } from "../../components/rentals/calendar/CalendarNav";
import { CalendarPageHeader } from "../../components/rentals/calendar/CalendarPageHeader";
import { CalendarSidePanel } from "../../components/rentals/calendar/CalendarSidePanel";
import { CalendarWeekGrid } from "../../components/rentals/calendar/CalendarWeekGrid";
import type { CalendarFilters, CalendarViewMode } from "../../components/rentals/calendar/calendarUtils";
import { monthRange, weekRange } from "../../components/rentals/calendar/calendarUtils";
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

function useMediaListDefault(): boolean {
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const fn = () => setIsNarrow(mq.matches);
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);
  return isNarrow;
}

export function RentalCalendarPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const isNarrow = useMediaListDefault();
  const [view, setView] = useState<CalendarViewMode>(() => (isNarrow ? "list" : "month"));
  const [cursorDate, setCursorDate] = useState(() => new Date());
  const [selectedBooking, setSelectedBooking] = useState<RentalAvailabilityBooking | null>(null);
  const [filters, setFilters] = useState<CalendarFilters>({
    q: "",
    status: "",
    vehicleId: "",
    customerId: "",
    from: "",
    to: "",
  });

  const debouncedQ = useDebounce(filters.q, 300);

  useEffect(() => {
    if (isNarrow && view === "month") setView("list");
  }, [isNarrow]);

  const range = useMemo(() => {
    if (filters.from && filters.to) return { from: filters.from, to: filters.to };
    return view === "week" ? weekRange(cursorDate) : monthRange(cursorDate);
  }, [view, cursorDate, filters.from, filters.to]);

  const queryParams = useMemo(
    () => ({
      from: range.from,
      to: range.to,
      vehicleId: filters.vehicleId || undefined,
      customerId: filters.customerId || undefined,
      status: filters.status || undefined,
      q: debouncedQ.trim() || undefined,
    }),
    [range, filters.vehicleId, filters.customerId, filters.status, debouncedQ],
  );

  const calendarQuery = useQuery({
    queryKey: ["rentals", "calendar", queryParams],
    queryFn: () => getRentalAvailability(queryParams).then((r) => r.data),
  });

  const dashboardQuery = useQuery({
    queryKey: ["rentals", "dashboard"],
    queryFn: () => getRentalDashboard().then((r) => r.data),
  });

  const bookings = calendarQuery.data?.bookings ?? [];
  const loading = calendarQuery.isLoading;

  const handlePrev = () => {
    if (view === "week") {
      setCursorDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
    } else {
      setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (view === "week") {
      setCursorDate((d) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7));
    } else {
      setCursorDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
    }
  };

  const effectiveView = isNarrow && view === "month" ? "list" : view;

  return (
    <div className="fm-rental-calendar flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <CalendarPageHeader view={view} onViewChange={setView} />

        <BookingsKpiRow
          dashboard={dashboardQuery.data}
          bookings={bookings as RentalBooking[]}
          loading={loading && dashboardQuery.isLoading}
        />

        <CalendarLegend />

        <CalendarFilterBar filters={filters} onChange={(p) => setFilters((f) => ({ ...f, ...p }))} />

        {calendarQuery.isError && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {t("pages.rentalCalendar.failedToLoad")}
          </p>
        )}

        <CalendarNav
          cursorDate={cursorDate}
          view={effectiveView}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={() => setCursorDate(new Date())}
          onViewChange={setView}
        />

        <div className="grid gap-5 xl:grid-cols-12">
          <div className="xl:col-span-9">
            {effectiveView === "month" && (
              <CalendarMonthGrid
                cursorDate={cursorDate}
                bookings={bookings}
                loading={loading}
                onSelectBooking={setSelectedBooking}
                onQuickBook={(startAt) => openQuickWeeklyRental({ startAt })}
              />
            )}
            {effectiveView === "week" && (
              <CalendarWeekGrid
                cursorDate={cursorDate}
                bookings={bookings}
                loading={loading}
                onSelectBooking={setSelectedBooking}
              />
            )}
            {effectiveView === "list" && (
              <CalendarListView bookings={bookings} loading={loading} onSelectBooking={setSelectedBooking} />
            )}
          </div>
          <div className="hidden xl:col-span-3 xl:block">
            <CalendarSidePanel bookings={bookings} dashboard={dashboardQuery.data} />
          </div>
        </div>

        <div className="mt-6 xl:hidden">
          <CalendarSidePanel bookings={bookings} dashboard={dashboardQuery.data} />
        </div>
      </div>

      <BookingCalendarDrawer booking={selectedBooking} onClose={() => setSelectedBooking(null)} />
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
