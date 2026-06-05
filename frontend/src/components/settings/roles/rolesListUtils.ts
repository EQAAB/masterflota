import type { RoleItem } from "../../../api/roles";
import type { PermissionItem } from "../../../api/roles";

export type RolesKpis = {
  total: number;
  system: number;
  custom: number;
  permissionCount: number;
};

export function computeRolesKpis(roles: RoleItem[], permissions: PermissionItem[]): RolesKpis {
  let system = 0;
  let custom = 0;
  for (const r of roles) {
    if (r.isSystemRole) system += 1;
    else custom += 1;
  }
  return {
    total: roles.length,
    system,
    custom,
    permissionCount: permissions.length,
  };
}

export function groupPermissionsByModule(permissions: PermissionItem[]): Map<string, PermissionItem[]> {
  const map = new Map<string, PermissionItem[]>();
  for (const p of permissions) {
    const list = map.get(p.module) ?? [];
    list.push(p);
    map.set(p.module, list);
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.name.localeCompare(b.name));
  }
  return map;
}
