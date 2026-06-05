import React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { DriversListPage } from "./pages/drivers/DriversListPage";
import { AddDriverPage } from "./pages/drivers/AddDriverPage";
import { EditDriverPage } from "./pages/drivers/EditDriverPage";
import { DriverDetailPage } from "./pages/drivers/DriverDetailPage";
import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { RegisterPage } from "./pages/register/Register";
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

/** Data router (required for `useBlocker`, e.g. unsaved import navigation guard). */
export const appRouter = createBrowserRouter(
  [
    { path: "login", element: <LoginPage /> },
    { path: "/register", element: <RegisterPage /> },
    {
      path: "/dashboard",
      element: (
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/drivers",
      element: (
        <ProtectedRoute>
          <DriversListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/drivers/new",
      element: (
        <ProtectedRoute>
          <AddDriverPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/drivers/:id/edit",
      element: (
        <ProtectedRoute>
          <EditDriverPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/drivers/:id",
      element: (
        <ProtectedRoute>
          <DriverDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vehicles",
      element: (
        <ProtectedRoute>
          <VehiclesListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vehicles/new",
      element: (
        <ProtectedRoute>
          <AddVehiclePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vehicles/:id/edit",
      element: (
        <ProtectedRoute>
          <EditVehiclePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings",
      element: (
        <ProtectedRoute>
          <EarningsOverviewPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/import",
      element: (
        <ProtectedRoute>
          <EarningsImportPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/design/payout-details-comparison",
      element: (
        <ProtectedRoute>
          <PayoutDetailsLayoutComparisonPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/payouts/:driverId",
      element: (
        <ProtectedRoute>
          <CombinedPayoutDetailsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/payouts",
      element: (
        <ProtectedRoute>
          <EarningsPayoutsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/reports",
      element: (
        <ProtectedRoute>
          <EarningsReportsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/subcontractors/settlements",
      element: (
        <ProtectedRoute>
          <SubcontractorSettlementsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/earnings/subcontractors/settlements/:id",
      element: (
        <ProtectedRoute>
          <SubcontractorSettlementDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/subcontractors",
      element: (
        <ProtectedRoute>
          <SubcontractorsListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/subcontractors/new",
      element: (
        <ProtectedRoute>
          <SubcontractorFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/subcontractors/:id/edit",
      element: (
        <ProtectedRoute>
          <SubcontractorFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals",
      element: (
        <ProtectedRoute>
          <RentalDashboardPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/bookings/new",
      element: (
        <ProtectedRoute>
          <BookingFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id/edit",
      element: (
        <ProtectedRoute>
          <BookingFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id",
      element: (
        <ProtectedRoute>
          <BookingDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/bookings",
      element: (
        <ProtectedRoute>
          <BookingsListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/calendar",
      element: (
        <ProtectedRoute>
          <RentalCalendarPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/customers/new",
      element: (
        <ProtectedRoute>
          <CustomerFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/customers/:id/edit",
      element: (
        <ProtectedRoute>
          <CustomerFormPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/customers",
      element: (
        <ProtectedRoute>
          <CustomersListPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/availability",
      element: (
        <ProtectedRoute>
          <VehicleAvailabilityPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/pricing",
      element: (
        <ProtectedRoute>
          <PricingPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/rentals/payments",
      element: (
        <ProtectedRoute>
          <PaymentsPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vehicles/:id",
      element: (
        <ProtectedRoute>
          <VehicleDetailPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/vehicles/:id/documents",
      element: (
        <ProtectedRoute>
          <VehicleDocumentsPage />
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
    { path: "*", element: <Navigate to="/dashboard" replace /> },
  ],
  { basename: "/fleet" },
);
