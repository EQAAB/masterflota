import { Router } from "express";
import bcrypt from "bcrypt";
import { pool, query } from "../../db/pool";
import { writeAuditLog } from "../../lib/auditLog";
import { generateStrongPassword } from "../../lib/generateStrongPassword";
import { assertRoleAssignableByCaller, RoleAssignmentError } from "../../lib/roleGuards";
import { revokeAllUserSessions } from "../../lib/userSession";
import { authenticateJWT, requirePermission } from "../../middleware/auth";
import { attachOrgContext, requireOrgId } from "../../middleware/orgContext";

const router = Router();

router.use(authenticateJWT);
router.use(attachOrgContext);
router.use(requirePermission("users.manage"));

type UserListRow = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: string;
  role_name: string;
  is_active: boolean;
  created_at: string;
};

type UserSnapshot = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: string;
  is_active: boolean;
};

router.get("/", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query<UserListRow>(
      `SELECT u.id::text, u.email, u.first_name, u.last_name, u.phone,
              u.role_id::text, r.name AS role_name, u.is_active, u.created_at::text
       FROM users u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.organization_id = $1::uuid
       ORDER BY u.created_at DESC`,
      [orgId],
    );
    return res.json(
      rows.map((u) => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        phone: u.phone,
        roleId: u.role_id,
        role: u.role_name,
        isActive: u.is_active,
        createdAt: u.created_at,
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List users error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/", async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const { email, password, firstName, lastName, phone, roleId } = req.body as {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    roleId?: string;
  };
  if (!email || !firstName || !lastName || !roleId) {
    return res.status(400).json({ message: "email, firstName, lastName, and roleId are required" });
  }
  const passwordGenerated = !password?.trim();
  const plainPassword = passwordGenerated ? generateStrongPassword() : password!.trim();
  if (plainPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }
  try {
    const roleCheck = await query<{ id: string }>(
      `SELECT id::text FROM roles WHERE id = $1::uuid`,
      [roleId],
    );
    if (!roleCheck.rows[0]) {
      return res.status(400).json({ message: "Invalid role" });
    }
    try {
      await assertRoleAssignableByCaller(roleId, req.user!);
    } catch (err) {
      if (err instanceof RoleAssignmentError) {
        return res.status(err.statusCode).json({ message: err.message });
      }
      throw err;
    }
    const emailLower = email.toLowerCase();
    const existing = await query<{ id: string }>(
      `SELECT id::text FROM users WHERE email = $1 LIMIT 1`,
      [emailLower],
    );
    if (existing.rows[0]) {
      return res.status(409).json({ message: "A user with this email already exists" });
    }
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const { rows } = await query<{ id: string }>(
      `INSERT INTO users (
          organization_id, email, password_hash, first_name, last_name, phone, role_id, is_active
        ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, true)
        RETURNING id::text`,
      [orgId, emailLower, passwordHash, firstName, lastName, phone ?? null, roleId],
    );
    const newId = rows[0]?.id;
    if (newId) {
      await writeAuditLog({
        orgId,
        userId: req.user?.sub ?? null,
        action: "user.created",
        entityType: "user",
        entityId: newId,
        newValue: { email: emailLower, firstName, lastName, roleId, phone: phone ?? null },
        req,
      });
    }
    return res.status(201).json({
      id: newId,
      ...(passwordGenerated ? { temporaryPassword: plainPassword } : {}),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Create user error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.patch("/:id", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  const { roleId, isActive, firstName, lastName, phone } = req.body as {
    roleId?: string;
    isActive?: boolean;
    firstName?: string;
    lastName?: string;
    phone?: string | null;
  };
  if (roleId === undefined && isActive === undefined && firstName === undefined && lastName === undefined && phone === undefined) {
    return res.status(400).json({ message: "No fields to update" });
  }
  if (userId === req.user?.sub && isActive === false) {
    return res.status(400).json({ message: "Cannot deactivate your own account" });
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const beforeRes = await client.query<UserSnapshot>(
      `SELECT id::text, email, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid AND organization_id = $2::uuid FOR UPDATE`,
      [userId, orgId],
    );
    const before = beforeRes.rows[0];
    if (!before) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "User not found" });
    }
    if (roleId) {
      const roleCheck = await client.query(`SELECT id FROM roles WHERE id = $1::uuid`, [roleId]);
      if (!roleCheck.rows[0]) {
        await client.query("ROLLBACK");
        return res.status(400).json({ message: "Invalid role" });
      }
      try {
        await assertRoleAssignableByCaller(roleId, req.user!);
      } catch (err) {
        await client.query("ROLLBACK");
        if (err instanceof RoleAssignmentError) {
          return res.status(err.statusCode).json({ message: err.message });
        }
        throw err;
      }
    }
    await client.query(
      `UPDATE users SET
          role_id = COALESCE($3::uuid, role_id),
          is_active = COALESCE($4, is_active),
          first_name = COALESCE($5, first_name),
          last_name = COALESCE($6, last_name),
          phone = COALESCE($7, phone),
          updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [userId, orgId, roleId ?? null, isActive ?? null, firstName ?? null, lastName ?? null, phone ?? null],
    );
    const afterRes = await client.query<UserSnapshot>(
      `SELECT id::text, email, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid`,
      [userId],
    );
    await client.query("COMMIT");

    const after = afterRes.rows[0];
    if (roleId && before.role_id !== after?.role_id) {
      await revokeAllUserSessions(userId);
    }
    if (isActive === false) {
      await revokeAllUserSessions(userId);
    }
    await writeAuditLog({
      orgId,
      userId: req.user?.sub ?? null,
      action: "user.updated",
      entityType: "user",
      entityId: userId,
      oldValue: before,
      newValue: after,
      req,
    });

    return res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Update user error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.post("/:id/reset-password", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const targetUserId = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }

  const { password } = req.body as { password?: string };
  const passwordGenerated = !password?.trim();
  const plainPassword = passwordGenerated ? generateStrongPassword() : password!.trim();
  if (plainPassword.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  try {
    const beforeRes = await query<UserSnapshot>(
      `SELECT id::text, email, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [targetUserId, orgId],
    );
    const before = beforeRes.rows[0];
    if (!before) {
      return res.status(404).json({ message: "User not found" });
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1::uuid`, [
      targetUserId,
      passwordHash,
    ]);
    await revokeAllUserSessions(targetUserId);

    await writeAuditLog({
      orgId,
      userId: req.user?.sub ?? null,
      action: "user.password_reset",
      entityType: "user",
      entityId: targetUserId,
      oldValue: { email: before.email },
      newValue: { passwordReset: true },
      req,
    });

    return res.json({
      ok: true,
      ...(passwordGenerated ? { temporaryPassword: plainPassword } : {}),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Reset user password error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/:id", async (req, res) => {
  const orgId = req.effectiveOrgId;
  const userId = String(req.params.id ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  if (userId === req.user?.sub) {
    return res.status(400).json({ message: "Cannot deactivate your own account" });
  }
  try {
    const beforeRes = await query<UserSnapshot>(
      `SELECT id::text, email, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [userId, orgId],
    );
    const before = beforeRes.rows[0];
    const { rows } = await query<{ id: string }>(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING id::text`,
      [userId, orgId],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }
    await revokeAllUserSessions(userId);
    await writeAuditLog({
      orgId,
      userId: req.user?.sub ?? null,
      action: "user.deactivated",
      entityType: "user",
      entityId: userId,
      oldValue: before,
      newValue: { is_active: false },
      req,
    });
    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Deactivate user error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const userRoutes = router;
