import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { getOverdueRentals, getRentalDashboard } from "../../api/rentals";
import { QuickWeeklyRentalModal } from "../../components/rentals/QuickWeeklyRentalModal";
import { CalendarPreview } from "../../components/rentals/dashboard/CalendarPreview";
import { FleetAvailabilityOverview } from "../../components/rentals/dashboard/FleetAvailabilityOverview";
import { OverdueAlertBanner } from "../../components/rentals/dashboard/OverdueAlertBanner";
import { RecentBookingsList } from "../../components/rentals/dashboard/RecentBookingsList";
import { RecentCustomersList } from "../../components/rentals/dashboard/RecentCustomersList";
import { RentalDashboardHeader } from "../../components/rentals/dashboard/RentalDashboardHeader";
import { RentalKpiRow } from "../../components/rentals/dashboard/RentalKpiRow";
import { RentalQuickNavTabs } from "../../components/rentals/dashboard/RentalQuickNavTabs";
import { RentalRevenuePreview } from "../../components/rentals/dashboard/RentalRevenuePreview";
import { RentalsDueThisWeekList } from "../../components/rentals/dashboard/RentalsDueThisWeekList";
import { UpcomingPaymentsList } from "../../components/rentals/dashboard/UpcomingPaymentsList";
import { useQuickWeeklyRentalModal } from "../../hooks/useQuickWeeklyRentalModal";
import { dashboardPage } from "../../theme/classNames";

export function RentalDashboardPage() {
  const navigate = useNavigate();
  const { quickWeeklyModal, openQuickWeeklyRental, closeQuickWeeklyRental } = useQuickWeeklyRentalModal();
  const dashQuery = useQuery({
    queryKey: ["rentals", "dashboard"],
    queryFn: () => getRentalDashboard().then((r) => r.data),
  });
  const overdueQuery = useQuery({
    queryKey: ["rentals", "overdue"],
    queryFn: () => getOverdueRentals().then((r) => r.data),
    enabled: (dashQuery.data?.overdue_bookings ?? 0) > 0,
  });

  const loading = dashQuery.isLoading;
  const d = dashQuery.data;
  const calendarDays = (d?.calendar_days ?? []).map((day) =>
    typeof day === "string" ? day.slice(0, 10) : String(day).slice(0, 10),
  );

  return (
    <div className="fm-rental-dashboard flex min-h-full flex-1 flex-col bg-surface-elevated">
      <div className={dashboardPage}>
        <RentalDashboardHeader onQuickWeekly={() => openQuickWeeklyRental()} />

        <section className="mb-6">
          <RentalKpiRow data={d} loading={loading} />
        </section>

        <RentalQuickNavTabs />

        {!loading && (d?.overdue_bookings ?? 0) > 0 && (
          <OverdueAlertBanner count={d!.overdue_bookings} items={overdueQuery.data ?? []} />
        )}

        {dashQuery.isError && (
          <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Could not load dashboard data. Refresh the page or try again later.
          </p>
        )}

        <div className="fm-rental-dashboard__grid grid gap-5 lg:grid-cols-12">
          <RecentBookingsList
            className="lg:col-span-7"
            bookings={d?.recent_bookings}
            loading={loading}
          />
          <CalendarPreview className="lg:col-span-5" bookingDates={calendarDays} loading={loading} />

          <FleetAvailabilityOverview
            className="lg:col-span-4"
            fleet={d?.fleet}
            activeBookings={d?.active_bookings}
            loading={loading}
          />
          <RentalsDueThisWeekList
            className="lg:col-span-12"
            items={d?.due_this_week}
            loading={loading}
            onRenew={(bookingId) => navigate(`/rentals/bookings/${bookingId}`)}
          />
          <UpcomingPaymentsList
            className="lg:col-span-4"
            payments={d?.upcoming_payments}
            loading={loading}
          />
          <RecentCustomersList
            className="lg:col-span-4"
            customers={d?.recent_customers}
            loading={loading}
          />

          <RentalRevenuePreview className="lg:col-span-12" data={d} loading={loading} />
        </div>
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
