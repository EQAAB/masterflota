import type { ReactNode } from "react";
import { useAuthStore } from "../store/authStore";

export function hasPermission(permissions: string[] | undefined, name: string): boolean {
  return !!permissions?.includes(name);
}

export function hasAnyPermission(permissions: string[] | undefined, names: string[]): boolean {
  if (!permissions?.length) return false;
  return names.some((n) => permissions.includes(n));
}

export function useUserPermissions(): string[] {
  return useAuthStore((s) => s.user?.permissions ?? []);
}

export function usePermission(name: string): boolean {
  const permissions = useUserPermissions();
  return hasPermission(permissions, name);
}

export function useAnyPermission(...names: string[]): boolean {
  const permissions = useUserPermissions();
  return hasAnyPermission(permissions, names);
}

export function useAllPermissions(...names: string[]): boolean {
  const permissions = useUserPermissions();
  if (!permissions.length) return false;
  return names.every((n) => permissions.includes(n));
}

export function Can({
  permission,
  anyOf,
  children,
  fallback = null,
}: {
  permission?: string;
  anyOf?: string[];
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const permissions = useUserPermissions();
  const allowed = permission
    ? hasPermission(permissions, permission)
    : anyOf
      ? hasAnyPermission(permissions, anyOf)
      : false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}

/** Earnings / finance module (import, payouts, reports, settlements). */
export function useCanAccessFinance(): boolean {
  return useAnyPermission("payouts.view", "imports.view", "imports.create", "reports.view");
}
