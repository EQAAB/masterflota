import { query } from "../db/pool";
import type { AuthPayload } from "../middleware/auth";
import { isPlatformSuperAdminUser } from "../middleware/auth";

export class RoleAssignmentError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
  }
}

export async function assertRoleAssignableByCaller(
  roleId: string,
  caller: AuthPayload,
): Promise<void> {
  const { rows } = await query<{ name: string }>(
    `SELECT name FROM roles WHERE id = $1::uuid`,
    [roleId],
  );
  const role = rows[0];
  if (!role) {
    throw new RoleAssignmentError("Invalid role", 400);
  }
  if (role.name === "super_admin" && !isPlatformSuperAdminUser(caller)) {
    throw new RoleAssignmentError("Cannot assign super admin role", 403);
  }
}
