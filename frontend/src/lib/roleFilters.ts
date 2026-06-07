import type { RoleItem } from "../api/roles";
import type { AuthUser } from "../store/authStore";
import { isPlatformSuperAdmin } from "./platform";

export function assignableOrgRoles(roles: RoleItem[], user: AuthUser | null): RoleItem[] {
  if (isPlatformSuperAdmin(user)) return roles;
  return roles.filter((r) => r.name !== "super_admin");
}
