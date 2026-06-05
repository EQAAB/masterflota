import { Router } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../db/pool";
import { writeAuditLog } from "../../lib/auditLog";
import { generateStrongPassword } from "../../lib/generateStrongPassword";
import { authenticateJWT, requirePermission, requireSuperAdmin } from "../../middleware/auth";

const router = Router();

router.use(authenticateJWT);
router.use(requireSuperAdmin);

router.get("/", requirePermission("organizations.view"), async (_req, res) => {
  const client = await pool.connect();
  try {
    const { rows } = await client.query<{
      id: string;
      name: string;
      email: string | null;
      phone: string | null;
      created_at: string;
    }>(
      `SELECT id::text, name, email, phone, created_at::text
       FROM organizations
       ORDER BY created_at DESC`,
    );
    return res.json(
      rows.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        phone: o.phone,
        createdAt: o.created_at,
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List organizations error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.post("/", requirePermission("organizations.create"), async (req, res) => {
  const {
    name,
    email,
    phone,
    adminEmail,
    adminPassword,
    adminFirstName,
    adminLastName,
  } = req.body as {
    name?: string;
    email?: string;
    phone?: string;
    adminEmail?: string;
    adminPassword?: string;
    adminFirstName?: string;
    adminLastName?: string;
  };

  if (!name?.trim()) {
    return res.status(400).json({ message: "Organization name is required" });
  }
  if (!adminEmail?.trim()) {
    return res.status(400).json({ message: "Admin email is required" });
  }
  const passwordGenerated = !adminPassword?.trim();
  const plainPassword = passwordGenerated ? generateStrongPassword() : adminPassword!.trim();
  if (plainPassword.length < 8) {
    return res.status(400).json({ message: "Admin password must be at least 8 characters long" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const adminEmailLower = adminEmail.toLowerCase();
    const existingUser = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [adminEmailLower],
    );
    if (existingUser.rows[0]) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "A user with this email already exists" });
    }

    const adminRole = await client.query<{ id: string }>(
      `SELECT id::text FROM roles WHERE name = 'admin' LIMIT 1`,
    );
    const adminRoleId = adminRole.rows[0]?.id;
    if (!adminRoleId) {
      await client.query("ROLLBACK");
      return res.status(500).json({ message: "Admin role is not configured" });
    }

    const orgEmail = email?.trim() ? email.toLowerCase() : adminEmailLower;
    const orgResult = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING id::text`,
      [name.trim(), orgEmail, phone?.trim() || null],
    );

    const organizationId = orgResult.rows[0].id;
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    const firstName = adminFirstName?.trim() || "Admin";
    const lastName = adminLastName?.trim() || name.trim();

    const userResult = await client.query<{ id: string; email: string }>(
      `INSERT INTO users (
          organization_id, email, password_hash, first_name, last_name, phone, role_id, is_active
        ) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::uuid, true)
        RETURNING id::text, email`,
      [
        organizationId,
        adminEmailLower,
        passwordHash,
        firstName,
        lastName,
        phone?.trim() || null,
        adminRoleId,
      ],
    );

    await client.query("COMMIT");

    const admin = userResult.rows[0];
    await writeAuditLog({
      orgId: null,
      userId: req.user?.sub ?? null,
      action: "create",
      entityType: "organization",
      entityId: organizationId,
      newValue: { name: name.trim(), adminEmail: admin.email },
      req,
    });

    return res.status(201).json({
      organization: {
        id: organizationId,
        name: name.trim(),
        email: orgEmail,
        phone: phone?.trim() || null,
      },
      admin: {
        id: admin.id,
        email: admin.email,
        firstName,
        lastName,
      },
      ...(passwordGenerated ? { temporaryPassword: plainPassword } : {}),
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Create organization error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

export const organizationRoutes = router;
