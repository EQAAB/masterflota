import React, { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AppLayout } from "./components/layout/AppLayout";
import {
  DefaultAppRedirect,
  FleetRouteGuard,
  PlatformRouteGuard,
} from "./components/layout/PlatformRouteGuard";
import { RentalsManageRouteGuard } from "./components/layout/RentalsManageRouteGuard";
import { RoutePageFallback } from "./components/layout/RoutePageFallback";
import { lazyPage } from "./lib/lazyPage";

const LoginPage = lazyPage(() => import("./pages/auth/LoginPage"), "LoginPage");
const DriversListPage = lazyPage(() => import("./pages/drivers/DriversListPage"), "DriversListPage");
const AddDriverPage = lazyPage(() => import("./pages/drivers/AddDriverPage"), "AddDriverPage");
const EditDriverPage = lazyPage(() => import("./pages/drivers/EditDriverPage"), "EditDriverPage");
const DriverDetailPage = lazyPage(() => import("./pages/drivers/DriverDetailPage"), "DriverDetailPage");
const DashboardPage = lazyPage(() => import("./pages/dashboard/DashboardPage"), "DashboardPage");
const PlatformDashboardPage = lazyPage(
  () => import("./pages/platform/PlatformDashboardPage"),
  "PlatformDashboardPage",
);
const OrganizationsPage = lazyPage(() => import("./pages/settings/OrganizationsPage"), "OrganizationsPage");
const VehiclesListPage = lazyPage(() => import("./pages/vehicles/VehiclesListPage"), "VehiclesListPage");
const AddVehiclePage = lazyPage(() => import("./pages/vehicles/AddVehiclePage"), "AddVehiclePage");
const EditVehiclePage = lazyPage(() => import("./pages/vehicles/EditVehiclePage"), "EditVehiclePage");
const VehicleDetailPage = lazyPage(() => import("./pages/vehicles/VehicleDetailPage"), "VehicleDetailPage");
const VehicleDocumentsPage = lazyPage(
  () => import("./pages/vehicles/VehicleDocumentsPage"),
  "VehicleDocumentsPage",
);
const EarningsOverviewPage = lazyPage(
  () => import("./pages/earnings/EarningsOverviewPage"),
  "EarningsOverviewPage",
);
const EarningsImportPage = lazyPage(() => import("./pages/earnings/EarningsImportPage"), "EarningsImportPage");
const EarningsPayoutsPage = lazyPage(() => import("./pages/earnings/EarningsPayoutsPage"), "EarningsPayoutsPage");
const CombinedPayoutDetailsPage = lazyPage(
  () => import("./pages/earnings/CombinedPayoutDetailsPage"),
  "CombinedPayoutDetailsPage",
);
const PayoutDetailsLayoutComparisonPage = lazyPage(
  () => import("./pages/design/PayoutDetailsLayoutComparisonPage"),
  "PayoutDetailsLayoutComparisonPage",
);
const EarningsReportsPage = lazyPage(() => import("./pages/earnings/EarningsReportsPage"), "EarningsReportsPage");
const SubcontractorSettlementsPage = lazyPage(
  () => import("./pages/earnings/SubcontractorSettlementsPage"),
  "SubcontractorSettlementsPage",
);
const SubcontractorSettlementDetailPage = lazyPage(
  () => import("./pages/earnings/SubcontractorSettlementDetailPage"),
  "SubcontractorSettlementDetailPage",
);
const DriverLoansReportPage = lazyPage(
  () => import("./pages/earnings/DriverLoansReportPage"),
  "DriverLoansReportPage",
);
const DriverLoanDetailPage = lazyPage(
  () => import("./pages/earnings/DriverLoanDetailPage"),
  "DriverLoanDetailPage",
);
const SubcontractorsListPage = lazyPage(
  () => import("./pages/subcontractors/SubcontractorsListPage"),
  "SubcontractorsListPage",
);
const SubcontractorFormPage = lazyPage(
  () => import("./pages/subcontractors/SubcontractorFormPage"),
  "SubcontractorFormPage",
);
const RentalDashboardPage = lazyPage(() => import("./pages/rentals/RentalDashboardPage"), "RentalDashboardPage");
const BookingsListPage = lazyPage(() => import("./pages/rentals/BookingsListPage"), "BookingsListPage");
const BookingDetailPage = lazyPage(() => import("./pages/rentals/BookingDetailPage"), "BookingDetailPage");
const BookingFormPage = lazyPage(() => import("./pages/rentals/BookingFormPage"), "BookingFormPage");
const RentalCalendarPage = lazyPage(() => import("./pages/rentals/RentalCalendarPage"), "RentalCalendarPage");
const CustomersListPage = lazyPage(() => import("./pages/rentals/CustomersListPage"), "CustomersListPage");
const CustomerFormPage = lazyPage(() => import("./pages/rentals/CustomerFormPage"), "CustomerFormPage");
const VehicleAvailabilityPage = lazyPage(
  () => import("./pages/rentals/VehicleAvailabilityPage"),
  "VehicleAvailabilityPage",
);
const PricingPage = lazyPage(() => import("./pages/rentals/PricingPage"), "PricingPage");
const PaymentsPage = lazyPage(() => import("./pages/rentals/PaymentsPage"), "PaymentsPage");
const UsersPage = lazyPage(() => import("./pages/settings/UsersPage"), "UsersPage");
const RolesPage = lazyPage(() => import("./pages/settings/RolesPage"), "RolesPage");
const AuditLogPage = lazyPage(() => import("./pages/settings/AuditLogPage"), "AuditLogPage");
const LoginEventsPage = lazyPage(() => import("./pages/settings/LoginEventsPage"), "LoginEventsPage");

function withSuspense(page: React.ReactNode) {
  return <Suspense fallback={<RoutePageFallback />}>{page}</Suspense>;
}

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

function fleetPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <ProtectedFleetRoute>{withSuspense(<Page />)}</ProtectedFleetRoute>
  );
}

function platformPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <ProtectedPlatformRoute>{withSuspense(<Page />)}</ProtectedPlatformRoute>
  );
}

function settingsPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return <ProtectedRoute>{withSuspense(<Page />)}</ProtectedRoute>;
}

/** Data router (required for `useBlocker`, e.g. unsaved import navigation guard). */
export const appRouter = createBrowserRouter(
  [
    { path: "login", element: withSuspense(<LoginPage />) },
    { path: "/register", element: <Navigate to="/login" replace /> },
    {
      path: "/platform",
      element: platformPage(PlatformDashboardPage),
    },
    {
      path: "/dashboard",
      element: fleetPage(DashboardPage),
    },
    {
      path: "/drivers",
      element: fleetPage(DriversListPage),
    },
    {
      path: "/drivers/new",
      element: fleetPage(AddDriverPage),
    },
    {
      path: "/drivers/:id/edit",
      element: fleetPage(EditDriverPage),
    },
    {
      path: "/drivers/:id",
      element: fleetPage(DriverDetailPage),
    },
    {
      path: "/vehicles",
      element: fleetPage(VehiclesListPage),
    },
    {
      path: "/vehicles/new",
      element: fleetPage(AddVehiclePage),
    },
    {
      path: "/vehicles/:id/edit",
      element: fleetPage(EditVehiclePage),
    },
    {
      path: "/earnings",
      element: fleetPage(EarningsOverviewPage),
    },
    {
      path: "/earnings/import",
      element: fleetPage(EarningsImportPage),
    },
    {
      path: "/design/payout-details-comparison",
      element: fleetPage(PayoutDetailsLayoutComparisonPage),
    },
    {
      path: "/earnings/payouts/:driverId",
      element: fleetPage(CombinedPayoutDetailsPage),
    },
    {
      path: "/earnings/payouts",
      element: fleetPage(EarningsPayoutsPage),
    },
    {
      path: "/earnings/reports",
      element: fleetPage(EarningsReportsPage),
    },
    {
      path: "/earnings/loans/:loanId",
      element: fleetPage(DriverLoanDetailPage),
    },
    {
      path: "/earnings/loans",
      element: fleetPage(DriverLoansReportPage),
    },
    {
      path: "/earnings/subcontractors/settlements",
      element: fleetPage(SubcontractorSettlementsPage),
    },
    {
      path: "/earnings/subcontractors/settlements/:id",
      element: fleetPage(SubcontractorSettlementDetailPage),
    },
    {
      path: "/subcontractors",
      element: fleetPage(SubcontractorsListPage),
    },
    {
      path: "/subcontractors/new",
      element: fleetPage(SubcontractorFormPage),
    },
    {
      path: "/subcontractors/:id/edit",
      element: fleetPage(SubcontractorFormPage),
    },
    {
      path: "/rentals",
      element: fleetPage(RentalDashboardPage),
    },
    {
      path: "/rentals/bookings/new",
      element: (
        <ProtectedFleetRoute>
          {withSuspense(
            <RentalsManageRouteGuard>
              <BookingFormPage />
            </RentalsManageRouteGuard>,
          )}
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id/edit",
      element: (
        <ProtectedFleetRoute>
          {withSuspense(
            <RentalsManageRouteGuard>
              <BookingFormPage />
            </RentalsManageRouteGuard>,
          )}
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/bookings/:id",
      element: fleetPage(BookingDetailPage),
    },
    {
      path: "/rentals/bookings",
      element: fleetPage(BookingsListPage),
    },
    {
      path: "/rentals/calendar",
      element: fleetPage(RentalCalendarPage),
    },
    {
      path: "/rentals/customers/new",
      element: (
        <ProtectedFleetRoute>
          {withSuspense(
            <RentalsManageRouteGuard>
              <CustomerFormPage />
            </RentalsManageRouteGuard>,
          )}
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/customers/:id/edit",
      element: (
        <ProtectedFleetRoute>
          {withSuspense(
            <RentalsManageRouteGuard>
              <CustomerFormPage />
            </RentalsManageRouteGuard>,
          )}
        </ProtectedFleetRoute>
      ),
    },
    {
      path: "/rentals/customers",
      element: fleetPage(CustomersListPage),
    },
    {
      path: "/rentals/availability",
      element: fleetPage(VehicleAvailabilityPage),
    },
    {
      path: "/rentals/pricing",
      element: fleetPage(PricingPage),
    },
    {
      path: "/rentals/payments",
      element: fleetPage(PaymentsPage),
    },
    {
      path: "/vehicles/:id",
      element: fleetPage(VehicleDetailPage),
    },
    {
      path: "/vehicles/:id/documents",
      element: fleetPage(VehicleDocumentsPage),
    },
    {
      path: "/settings/organizations",
      element: (
        <ProtectedRoute>
          <PlatformRouteGuard>{withSuspense(<OrganizationsPage />)}</PlatformRouteGuard>
        </ProtectedRoute>
      ),
    },
    {
      path: "/settings/users",
      element: settingsPage(UsersPage),
    },
    {
      path: "/settings/roles",
      element: settingsPage(RolesPage),
    },
    {
      path: "/settings/audit",
      element: settingsPage(AuditLogPage),
    },
    {
      path: "/settings/login-events",
      element: settingsPage(LoginEventsPage),
    },
    { path: "*", element: <DefaultAppRedirect /> },
  ],
  { basename: "/fleet" },
);
