import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AppLayout } from "./components/layout/AppLayout";
import {
  DefaultAppRedirect,
  FleetRouteGuard,
  PlatformRouteGuard,
} from "./components/layout/PlatformRouteGuard";
import { LoginPage } from "./pages/auth/LoginPage";
import { DriversListPage } from "./pages/drivers/DriversListPage";
import { AddDriverPage } from "./pages/drivers/AddDriverPage";
import { EditDriverPage } from "./pages/drivers/EditDriverPage";
import { DriverDetailPage } from "./pages/drivers/DriverDetailPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { PlatformDashboardPage } from "./pages/platform/PlatformDashboardPage";
import { OrganizationsPage } from "./pages/settings/OrganizationsPage";
import { VehiclesListPage } from "./pages/vehicles/VehiclesListPage";
import { AddVehiclePage } from "./pages/vehicles/AddVehiclePage";
import { EditVehiclePage } from "./pages/vehicles/EditVehiclePage";
import { VehicleDetailPage } from "./pages/vehicles/VehicleDetailPage";
import { VehicleDocumentsPage } from "./pages/vehicles/VehicleDocumentsPage";
import { EarningsOverviewPage } from "./pages/earnings/EarningsOverviewPage";
import { EarningsImportPage } from "./pages/earnings/EarningsImportPage";
import { EarningsPayoutsPage } from "./pages/earnings/EarningsPayoutsPage";
import { CombinedPayoutDetailsPage } from "./pages/earnings/CombinedPayoutDetailsPage";
import { PayoutDetailsLayoutComparisonPage } from "./pages/design/PayoutDetailsLayoutComparisonPage";
import { EarningsReportsPage } from "./pages/earnings/EarningsReportsPage";
import { SubcontractorSettlementsPage } from "./pages/earnings/SubcontractorSettlementsPage";
import { SubcontractorSettlementDetailPage } from "./pages/earnings/SubcontractorSettlementDetailPage";
import { SubcontractorsListPage } from "./pages/subcontractors/SubcontractorsListPage";
import { SubcontractorFormPage } from "./pages/subcontractors/SubcontractorFormPage";
import { RentalDashboardPage } from "./pages/rentals/RentalDashboardPage";
import { BookingsListPage } from "./pages/rentals/BookingsListPage";
import { BookingDetailPage } from "./pages/rentals/BookingDetailPage";
import { BookingFormPage } from "./pages/rentals/BookingFormPage";
import { RentalCalendarPage } from "./pages/rentals/RentalCalendarPage";
import { CustomersListPage } from "./pages/rentals/CustomersListPage";
import { CustomerFormPage } from "./pages/rentals/CustomerFormPage";
import { VehicleAvailabilityPage } from "./pages/rentals/VehicleAvailabilityPage";
import { PricingPage } from "./pages/rentals/PricingPage";
import { PaymentsPage } from "./pages/rentals/PaymentsPage";
import { UsersPage } from "./pages/settings/UsersPage";
import { RolesPage } from "./pages/settings/RolesPage";
import { AuditLogPage } from "./pages/settings/AuditLogPage";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

function ProtectedFleetRoute({ children }: { children: React.ReactElement }) {
  return (
    <ProtectedRoute>
      <FleetRouteGuard>{children}</FleetRouteGuard>
    </ProtectedRoute>
  );
}

function ProtectedPlatformRoute({ children }: { children: React.ReactElement }) {
  return (
    <ProtectedRoute>
      <PlatformRouteGuard>{children}</PlatformRouteGuard>
    </ProtectedRoute>
  );
}

/** Data router (required for `useBlocker`, e.g. unsaved import navigation guard). */
export const appRouter = createBrowserRouter(
  [
    { path: "login", element: <LoginPage /> },
    { path: "/register", element: <Navigate to="/login" replace /> },
    {
      path: "/platform",
      element: (
        <ProtectedPlatformRoute>
          <PlatformDashboardPage />
        </ProtectedPlatformRoute>
      ),
    },
    {
      path: "/dashboard",
      element: (
        <ProtectedFleetRoute>
          <DashboardPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/drivers",
      element: (
        <ProtectedFleetRoute>
          <DriversListPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/drivers/new",
      element: (
        <ProtectedFleetRoute>
          <AddDriverPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/drivers/:id/edit",
      element: (
        <ProtectedFleetRoute>
          <EditDriverPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/drivers/:id",
      element: (
        <ProtectedFleetRoute>
          <DriverDetailPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/vehicles",
      element: (
        <ProtectedFleetRoute>
          <VehiclesListPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/vehicles/new",
      element: (
        <ProtectedFleetRoute>
          <AddVehiclePage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/vehicles/:id/edit",
      element: (
        <ProtectedFleetRoute>
          <EditVehiclePage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings",
      element: (
        <ProtectedFleetRoute>
          <EarningsOverviewPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/import",
      element: (
        <ProtectedFleetRoute>
          <EarningsImportPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/design/payout-details-comparison",
      element: (
        <ProtectedFleetRoute>
          <PayoutDetailsLayoutComparisonPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/payouts/:driverId",
      element: (
        <ProtectedFleetRoute>
          <CombinedPayoutDetailsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/payouts",
      element: (
        <ProtectedFleetRoute>
          <EarningsPayoutsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/reports",
      element: (
        <ProtectedFleetRoute>
          <EarningsReportsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/subcontractors/settlements",
      element: (
        <ProtectedFleetRoute>
          <SubcontractorSettlementsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/earnings/subcontractors/settlements/:id",
      element: (
        <ProtectedFleetRoute>
          <SubcontractorSettlementDetailPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/subcontractors",
      element: (
        <ProtectedFleetRoute>
          <SubcontractorsListPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/subcontractors/new",
      element: (
        <ProtectedFleetRoute>
          <SubcontractorFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/subcontractors/:id/edit",
      element: (
        <ProtectedFleetRoute>
          <SubcontractorFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals",
      element: (
        <ProtectedFleetRoute>
          <RentalDashboardPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings/new",
      element: (
        <ProtectedFleetRoute>
          <BookingFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id/edit",
      element: (
        <ProtectedFleetRoute>
          <BookingFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id",
      element: (
        <ProtectedFleetRoute>
          <BookingDetailPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings",
      element: (
        <ProtectedFleetRoute>
          <BookingsListPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/calendar",
      element: (
        <ProtectedFleetRoute>
          <RentalCalendarPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/customers/new",
      element: (
        <ProtectedFleetRoute>
          <CustomerFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/customers/:id/edit",
      element: (
        <ProtectedFleetRoute>
          <CustomerFormPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/customers",
      element: (
        <ProtectedFleetRoute>
          <CustomersListPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/availability",
      element: (
        <ProtectedFleetRoute>
          <VehicleAvailabilityPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/pricing",
      element: (
        <ProtectedFleetRoute>
          <PricingPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/payments",
      element: (
        <ProtectedFleetRoute>
          <PaymentsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/vehicles/:id",
      element: (
        <ProtectedFleetRoute>
          <VehicleDetailPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/vehicles/:id/documents",
      element: (
        <ProtectedFleetRoute>
          <VehicleDocumentsPage />
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/settings/organizations",
      element: (
        <ProtectedRoute>
          <PlatformRouteGuard>
            <OrganizationsPage />
          </PlatformRouteGuard>
        </ProtectedRoute>
      ),
    },
    {
      path: "/settings/users",
      element: (
        <ProtectedRoute>
          <UsersPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/settings/roles",
      element: (
        <ProtectedRoute>
          <RolesPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/settings/audit",
      element: (
        <ProtectedRoute>
          <AuditLogPage />
        </ProtectedRoute>
      ),
    },
    { path: "*", element: <DefaultAppRedirect /> },
  ],
  { basename: "/fleet" },
);
