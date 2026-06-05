import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import { roleLabel } from "../../../lib/roleLabel";

export const ADMIN_ROLES = new Set(["admin", "super_admin"]);
export const USERS_PAGE_SIZE = 10;

export type UsersKpis = {
  total: number;
  active: number;
  admin: number;
  inactive: number;
};

export type UsersFilters = {
  q: string;
  roleId: string;
  status: "" | "active" | "inactive";
};

export function initialsFromUser(user: Pick<OrgUser, "firstName" | "lastName">): string {
  const a = user.firstName?.[0] ?? "";
  const b = user.lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export function fullName(user: Pick<OrgUser, "firstName" | "lastName">): string {
  return `${user.firstName} ${user.lastName}`.trim();
}

export function roleOptionLabel(role: RoleItem): string {
  const normalized = role.name.trim().toLowerCase().replace(/\s+/g, "_");
  if (normalized === "admin" || normalized === "administrator") return "Admin";
  if (normalized === "super_admin" || normalized === "superadmin") return "Super Admin";
  const labeled = roleLabel(normalized);
  return labeled !== normalized.replace(/_/g, " ") ? labeled : role.name;
}

export function computeUsersKpis(users: OrgUser[]): UsersKpis {
  let active = 0;
  let admin = 0;
  let inactive = 0;
  for (const u of users) {
    if (u.isActive) active += 1;
    else inactive += 1;
    if (ADMIN_ROLES.has(u.role)) admin += 1;
  }
  return { total: users.length, active, admin, inactive };
}

export function filterUsers(users: OrgUser[], filters: UsersFilters): OrgUser[] {
  const q = filters.q.trim().toLowerCase();
  return users.filter((u) => {
    if (filters.roleId && u.roleId !== filters.roleId) return false;
    if (filters.status === "active" && !u.isActive) return false;
    if (filters.status === "inactive" && u.isActive) return false;
    if (!q) return true;
    const statusText = u.isActive ? "active" : "inactive";
    const hay = `${u.firstName} ${u.lastName} ${u.email} ${roleLabel(u.role)} ${statusText}`.toLowerCase();
    return hay.includes(q);
  });
}

export function paginateUsers<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
