import React, { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { AppLayout } from "./components/layout/AppLayout";
import {
  DefaultAppRedirect,
  FleetRouteGuard,
  PlatformRouteGuard,
} from "./components/layout/PlatformRouteGuard";
import {
  PermissionRouteGuard,
  type PermissionRouteGuardProps,
} from "./components/layout/PermissionRouteGuard";
import { RoutePageFallback } from "./components/layout/RoutePageFallback";
import { lazyPage } from "./lib/lazyPage";
import {
  EARNINGS_OVERVIEW_PERMISSIONS,
  IMPORTS_VIEW_PERMISSIONS,
  PAYOUTS_VIEW_PERMISSIONS,
  RENTALS_VIEW_PERMISSIONS,
  ROLES_VIEW_PERMISSIONS,
} from "./lib/routePermissions";

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
const SubcontractorDetailPage = lazyPage(
  () => import("./pages/subcontractors/SubcontractorDetailPage"),
  "SubcontractorDetailPage",
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <AppLayout>{children}</AppLayout>;
}

function ProtectedFleetRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <FleetRouteGuard>{children}</FleetRouteGuard>
    </ProtectedRoute>
  );
}

function ProtectedPlatformRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <PlatformRouteGuard>{children}</PlatformRouteGuard>
    </ProtectedRoute>
  );
}

type RouteAccessOptions = Pick<
  PermissionRouteGuardProps,
  "permission" | "anyOf" | "allOf" | "redirectTo"
>;

function guardPage(page: React.ReactNode, access?: RouteAccessOptions) {
  if (!access || (!access.permission && !access.anyOf?.length && !access.allOf?.length)) {
    return page;
  }
  return <PermissionRouteGuard {...access}>{page}</PermissionRouteGuard>;
}

function fleetPage(
  Page: React.LazyExoticComponent<() => React.JSX.Element>,
  access?: RouteAccessOptions,
) {
  return (
    <ProtectedFleetRoute>{guardPage(withSuspense(<Page />), access)}</ProtectedFleetRoute>
  );
}

function platformPage(Page: React.LazyExoticComponent<() => React.JSX.Element>) {
  return (
    <ProtectedPlatformRoute>{withSuspense(<Page />)}</ProtectedPlatformRoute>
  );
}

function settingsPage(
  Page: React.LazyExoticComponent<() => React.JSX.Element>,
  access?: RouteAccessOptions,
) {
  return <ProtectedRoute>{guardPage(withSuspense(<Page />), access)}</ProtectedRoute>;
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
      element: fleetPage(DashboardPage, { permission: "dashboard.view" }),
    },
    {
      path: "/drivers",
      element: fleetPage(DriversListPage, { permission: "drivers.view" }),
    },
    {
      path: "/drivers/new",
      element: fleetPage(AddDriverPage, { permission: "drivers.create", redirectTo: "/drivers" }),
    },
    {
      path: "/drivers/:id/edit",
      element: fleetPage(EditDriverPage, { permission: "drivers.edit", redirectTo: "/drivers" }),
    },
    {
      path: "/drivers/:id",
      element: fleetPage(DriverDetailPage, { permission: "drivers.view" }),
    },
    {
      path: "/vehicles",
      element: fleetPage(VehiclesListPage, { permission: "vehicles.view" }),
    },
    {
      path: "/vehicles/new",
      element: fleetPage(AddVehiclePage, { permission: "vehicles.create", redirectTo: "/vehicles" }),
    },
    {
      path: "/vehicles/:id/edit",
      element: fleetPage(EditVehiclePage, { permission: "vehicles.edit", redirectTo: "/vehicles" }),
    },
    {
      path: "/earnings",
      element: fleetPage(EarningsOverviewPage, { anyOf: EARNINGS_OVERVIEW_PERMISSIONS }),
    },
    {
      path: "/earnings/import",
      element: fleetPage(EarningsImportPage, { anyOf: IMPORTS_VIEW_PERMISSIONS, redirectTo: "/earnings" }),
    },
    {
      path: "/design/payout-details-comparison",
      element: fleetPage(PayoutDetailsLayoutComparisonPage, { anyOf: PAYOUTS_VIEW_PERMISSIONS }),
    },
    {
      path: "/earnings/payouts/:driverId",
      element: fleetPage(CombinedPayoutDetailsPage, { anyOf: PAYOUTS_VIEW_PERMISSIONS, redirectTo: "/earnings/payouts" }),
    },
    {
      path: "/earnings/payouts",
      element: fleetPage(EarningsPayoutsPage, { anyOf: PAYOUTS_VIEW_PERMISSIONS }),
    },
    {
      path: "/earnings/reports",
      element: fleetPage(EarningsReportsPage, { permission: "reports.view", redirectTo: "/earnings" }),
    },
    {
      path: "/earnings/loans/:loanId",
      element: fleetPage(DriverLoanDetailPage, { permission: "drivers.view", redirectTo: "/earnings/loans" }),
    },
    {
      path: "/earnings/loans",
      element: fleetPage(DriverLoansReportPage, { permission: "drivers.view" }),
    },
    {
      path: "/earnings/subcontractors/settlements",
      element: fleetPage(SubcontractorSettlementsPage, {
        permission: "subcontractors.settle",
        redirectTo: "/earnings",
      }),
    },
    {
      path: "/earnings/subcontractors/settlements/:id",
      element: fleetPage(SubcontractorSettlementDetailPage, {
        permission: "subcontractors.settle",
        redirectTo: "/earnings/subcontractors/settlements",
      }),
    },
    {
      path: "/subcontractors",
      element: fleetPage(SubcontractorsListPage, { permission: "subcontractors.view" }),
    },
    {
      path: "/subcontractors/new",
      element: fleetPage(SubcontractorFormPage, {
        permission: "subcontractors.create",
        redirectTo: "/subcontractors",
      }),
    },
    {
      path: "/subcontractors/:id/edit",
      element: fleetPage(SubcontractorFormPage, {
        permission: "subcontractors.edit",
        redirectTo: "/subcontractors",
      }),
    },
    {
      path: "/subcontractors/:id",
      element: fleetPage(SubcontractorDetailPage, { permission: "subcontractors.view" }),
    },
    {
      path: "/rentals",
      element: fleetPage(RentalDashboardPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/bookings/new",
      element: fleetPage(BookingFormPage, { permission: "rentals.manage", redirectTo: "/rentals/bookings" }),
    },
    {
      path: "/rentals/bookings/:id/edit",
      element: fleetPage(BookingFormPage, { permission: "rentals.manage", redirectTo: "/rentals/bookings" }),
    },
    {
      path: "/rentals/bookings/:id",
      element: fleetPage(BookingDetailPage, { anyOf: RENTALS_VIEW_PERMISSIONS, redirectTo: "/rentals" }),
    },
    {
      path: "/rentals/bookings",
      element: fleetPage(BookingsListPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/calendar",
      element: fleetPage(RentalCalendarPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/customers/new",
      element: fleetPage(CustomerFormPage, { permission: "rentals.manage", redirectTo: "/rentals/customers" }),
    },
    {
      path: "/rentals/customers/:id/edit",
      element: fleetPage(CustomerFormPage, { permission: "rentals.manage", redirectTo: "/rentals/customers" }),
    },
    {
      path: "/rentals/customers",
      element: fleetPage(CustomersListPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/availability",
      element: fleetPage(VehicleAvailabilityPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/pricing",
      element: fleetPage(PricingPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/rentals/payments",
      element: fleetPage(PaymentsPage, { anyOf: RENTALS_VIEW_PERMISSIONS }),
    },
    {
      path: "/vehicles/:id",
      element: fleetPage(VehicleDetailPage, { permission: "vehicles.view" }),
    },
    {
      path: "/vehicles/:id/documents",
      element: fleetPage(VehicleDocumentsPage, { permission: "vehicles.view", redirectTo: "/vehicles" }),
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
      element: settingsPage(UsersPage, { permission: "users.manage", redirectTo: "/dashboard" }),
    },
    {
      path: "/settings/roles",
      element: settingsPage(RolesPage, { anyOf: ROLES_VIEW_PERMISSIONS, redirectTo: "/dashboard" }),
    },
    {
      path: "/settings/audit",
      element: settingsPage(AuditLogPage, { permission: "users.manage", redirectTo: "/dashboard" }),
    },
    {
      path: "/settings/login-events",
      element: settingsPage(LoginEventsPage, { permission: "users.manage", redirectTo: "/dashboard" }),
    },
    { path: "*", element: <DefaultAppRedirect /> },
  ],
  { basename: "/fleet" },
);
