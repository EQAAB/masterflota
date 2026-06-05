import { query } from "../../db/pool";

export type UserPermissionContext = {
  roleId: string;
  roleName: string;
  permissions: string[];
};

export function hasAnyPermission(userPermissions: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  const set = new Set(userPermissions);
  return required.some((p) => set.has(p));
}

export function hasAllPermissions(userPermissions: string[], required: string[]): boolean {
  if (required.length === 0) return true;
  const set = new Set(userPermissions);
  return required.every((p) => set.has(p));
}

export async function loadUserPermissions(userId: string): Promise<UserPermissionContext | null> {
  const { rows } = await query<{
    role_id: string;
    role_name: string;
    permission_name: string | null;
  }>(
    `SELECT u.role_id::text AS role_id,
            r.name AS role_name,
            p.name AS permission_name
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE u.id = $1::uuid`,
    [userId],
  );
  if (rows.length === 0) return null;
  const roleId = rows[0].role_id;
  const roleName = rows[0].role_name;
  const permissions = [
    ...new Set(rows.map((row) => row.permission_name).filter((n): n is string => !!n)),
  ].sort();
  return { roleId, roleName, permissions };
}
