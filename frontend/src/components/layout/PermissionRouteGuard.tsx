import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  hasAllPermissions,
  hasAnyPermission,
  hasPermission,
  useUserPermissions,
} from "../../lib/permissions";

export type PermissionRouteGuardProps = {
  children: ReactNode;
  permission?: string;
  anyOf?: readonly string[];
  allOf?: readonly string[];
  redirectTo?: string;
};

export function PermissionRouteGuard({
  children,
  permission,
  anyOf,
  allOf,
  redirectTo = "/dashboard",
}: PermissionRouteGuardProps) {
  const permissions = useUserPermissions();

  const allowed = (() => {
    if (permission) return hasPermission(permissions, permission);
    if (anyOf?.length) return hasAnyPermission(permissions, [...anyOf]);
    if (allOf?.length) return hasAllPermissions(permissions, [...allOf]);
    return true;
  })();

  if (!allowed) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
