import type { AuthUser } from "../store/authStore";

export function isPlatformSuperAdmin(user: AuthUser | null): boolean {
  return user?.role === "super_admin" && user.organizationId == null;
}

export function isInOrgContext(user: AuthUser | null, activeOrgId: string | null): boolean {
  if (!user) return false;
  if (isPlatformSuperAdmin(user)) return activeOrgId != null;
  return user.organizationId != null;
}

export function isPlatformMode(user: AuthUser | null, activeOrgId: string | null): boolean {
  return isPlatformSuperAdmin(user) && activeOrgId == null;
}
