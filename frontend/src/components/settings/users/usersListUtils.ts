import type { OrgUser } from "../../../api/users";
import type { RoleItem } from "../../../api/roles";
import i18n from "../../../i18n";
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
  if (normalized === "admin" || normalized === "administrator") return i18n.t("pages.users.adminLabel");
  if (normalized === "super_admin" || normalized === "superadmin") return i18n.t("pages.users.superAdminLabel");
  const labeled = roleLabel(normalized);
  return labeled !== normalized.replace(/_/g, " ") ? labeled : role.name;
}

export type RoleSummary = {
  superAdmin: number;
  admin: number;
  active: number;
  inactive: number;
};

export function roleBadgeLabel(role: string): string {
  if (role === "super_admin") return i18n.t("pages.users.superAdminLabel");
  if (role === "admin") return i18n.t("pages.users.adminLabel");
  return roleLabel(role);
}

export function roleBadgeVariant(role: string): "super_admin" | "admin" | "default" {
  if (role === "super_admin") return "super_admin";
  if (role === "admin") return "admin";
  return "default";
}

export function computeRoleSummary(users: OrgUser[]): RoleSummary {
  let superAdmin = 0;
  let admin = 0;
  let active = 0;
  let inactive = 0;
  for (const u of users) {
    if (u.role === "super_admin") superAdmin += 1;
    else if (u.role === "admin") admin += 1;
    if (u.isActive) active += 1;
    else inactive += 1;
  }
  return { superAdmin, admin, active, inactive };
}

export function formatAuditAction(action: string): string {
  return action.replace(/\./g, " · ").replace(/_/g, " ");
}

export function formatRelativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return i18n.t("pages.users.justNow");
    if (mins < 60) return i18n.t("pages.users.minsAgo", { mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return i18n.t("pages.users.hoursAgo", { hours });
    const days = Math.floor(hours / 24);
    if (days < 7) return i18n.t("pages.users.daysAgo", { days });
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
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
