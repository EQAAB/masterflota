import { PermissionRouteGuard } from "./PermissionRouteGuard";

/** @deprecated Use PermissionRouteGuard with permission="rentals.manage" */
export function RentalsManageRouteGuard({ children }: { children: React.ReactElement }) {
  return (
    <PermissionRouteGuard permission="rentals.manage" redirectTo="/rentals">
      {children}
    </PermissionRouteGuard>
  );
}
