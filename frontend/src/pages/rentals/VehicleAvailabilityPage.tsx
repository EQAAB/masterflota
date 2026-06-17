import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getRentalAvailability, getRentalAvailabilitySummary } from "../../api/rentals";
import { AvailabilityCalendarView } from "../../components/rentals/availability/AvailabilityCalendarView";
import { AvailabilityKpiRow } from "../../components/rentals/availability/AvailabilityKpiRow";
import {
  AvailabilityPageHeader,
  type AvailabilityViewMode,
} from "../../components/rentals/availability/AvailabilityPageHeader";
import { AvailabilitySidePanel } from "../../components/rentals/availability/AvailabilitySidePanel";
import { AvailabilityToolbar } from "../../components/rentals/availability/AvailabilityToolbar";
import { AvailabilityVehicleList } from "../../components/rentals/availability/AvailabilityVehicleList";
import { BlockDatesModal } from "../../components/rentals/availability/BlockDatesModal";
import { QuickWeeklyRentalModal } from "../../components/rentals/QuickWeeklyRentalModal";
import {
  defaultRange,
  filterAndSortVehicles,
  vehicleTypeOptions,
  type AvailabilityFilters,
} from "../../components/rentals/availability/availabilityListUtils";
import { useCanManageRentals } from "../../lib/rentalsPermissions";
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

export function VehicleAvailabilityPage() {
  const canManage = useCanManageRentals();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const initialRange = useMemo(() => defaultRange(30), []);
  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [view, setView] = useState<AvailabilityViewMode>("list");
  const [focusVehicleId, setFocusVehicleId] = useState<string | undefined>();
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockVehicleId, setBlockVehicleId] = useState<string | undefined>();

  const [filters, setFilters] = useState<AvailabilityFilters>({
    q: "",
    status: "",
    vehicleType: "",
    rentalStatus: "",
    sort: "plate",
  });

  const debouncedQ = useDebounce(filters.q, 300);

  const availQuery = useQuery({
    queryKey: ["rentals", "availability", from, to, debouncedQ],
    queryFn: () =>
      getRentalAvailability({ from, to, vehicleQ: debouncedQ.trim() || undefined }).then((r) => r.data),
  });

  const summaryQuery = useQuery({
    queryKey: ["rentals", "availability", "summary", from, to],
    queryFn: () => getRentalAvailabilitySummary({ from, to }).then((r) => r.data),
  });

  const vehicles = availQuery.data?.vehicles ?? [];
  const bookings = availQuery.data?.bookings ?? [];
  const blocks = availQuery.data?.availability ?? [];

  const filteredVehicles = useMemo(
    () =>
      filterAndSortVehicles(
        vehicles,
        bookings,
        blocks,
        from,
        to,
        { ...filters, q: debouncedQ },
      ),
    [vehicles, bookings, blocks, from, to, filters, debouncedQ],
  );

  const types = useMemo(() => vehicleTypeOptions(vehicles), [vehicles]);

  const openBlockModal = (vehicleId?: string) => {
    setBlockVehicleId(vehicleId);
    setBlockModalOpen(true);
  };

  const handleViewCalendar = (vehicleId: string) => {
    setFocusVehicleId(vehicleId);
    setView("calendar");
  };

  return (
    <div className="fm-rental-availability flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <AvailabilityPageHeader
          from={from}
          to={to}
          onFromChange={setFrom}
          onToChange={setTo}
          view={view}
          onViewChange={(v) => {
            setView(v);
            if (v === "list") setFocusVehicleId(undefined);
          }}
          onBlockDates={() => openBlockModal()}
          onQuickWeekly={canManage ? () => openQuickWeeklyRental({}) : undefined}
          canManage={canManage}
        />

        <AvailabilityKpiRow summary={summaryQuery.data} loading={summaryQuery.isLoading} />

        <div className="xl:grid xl:grid-cols-[1fr_280px] xl:gap-6">
          <div>
            <AvailabilityToolbar
              filters={filters}
              onChange={(patch) => setFilters((f) => ({ ...f, ...patch }))}
              vehicleTypes={types}
              resultCount={filteredVehicles.length}
            />

            {availQuery.isError && (
              <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Failed to load availability. Check your connection and try again.
              </p>
            )}

            {view === "list" ? (
              <AvailabilityVehicleList
                vehicles={filteredVehicles}
                bookings={bookings}
                blocks={blocks}
                from={from}
                to={to}
                loading={availQuery.isLoading}
                canManage={canManage}
                onBlockDates={openBlockModal}
                onViewCalendar={handleViewCalendar}
                onQuickWeekly={(vehicleId) => openQuickWeeklyRental({ vehicleId })}
              />
            ) : (
              <AvailabilityCalendarView
                vehicles={filteredVehicles}
                bookings={bookings}
                blocks={blocks}
                from={from}
                to={to}
                loading={availQuery.isLoading}
                focusVehicleId={focusVehicleId}
              />
            )}
          </div>

          <AvailabilitySidePanel
            bookings={bookings}
            vehicles={vehicles}
            className="mt-6 hidden xl:block"
          />
        </div>
      </div>

      <BlockDatesModal
        open={blockModalOpen}
        vehicles={vehicles}
        initialVehicleId={blockVehicleId}
        defaultFrom={from}
        defaultTo={to}
        onClose={() => {
          setBlockModalOpen(false);
          setBlockVehicleId(undefined);
        }}
      />
      <QuickWeeklyRentalModal
        open={quickWeeklyModal.open}
        onClose={closeQuickWeeklyRental}
        initialCustomerId={quickWeeklyModal.customerId}
        initialVehicleId={quickWeeklyModal.vehicleId}
        initialStartAt={quickWeeklyModal.startAt}
        onSuccess={closeQuickWeeklyRental}
      />
    </div>
  );
}
