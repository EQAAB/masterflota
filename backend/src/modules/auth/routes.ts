import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool, query } from "../../db/pool";
import { env } from "../../config/env";
import { createUserSession, hashSessionToken, newSessionJti } from "../../lib/userSession";
import { authenticateJWT, type AuthPayload } from "../../middleware/auth";
import { loadUserPermissions } from "./permissions";

const router = Router();

interface UserRow {
  id: string;
  organization_id: string | null;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role_id: string;
  is_active: boolean;
}

function serializeUser(user: UserRow, ctx: { roleId: string; roleName: string; permissions: string[] }) {
  return {
    id: user.id,
    organizationId: user.organization_id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    phone: user.phone,
    roleId: ctx.roleId,
    role: ctx.roleName,
    permissions: ctx.permissions,
  };
}

async function buildAuthPayload(user: UserRow, jti: string): Promise<AuthPayload | null> {
  const ctx = await loadUserPermissions(user.id);
  if (!ctx) return null;
  return {
    sub: user.id,
    orgId: user.organization_id,
    roleId: ctx.roleId,
    role: ctx.roleName,
    permissions: ctx.permissions,
    jti,
  };
}

async function issueToken(user: UserRow, req: Parameters<typeof createUserSession>[2]) {
  const jti = newSessionJti();
  const payload = await buildAuthPayload(user, jti);
  if (!payload) return null;
  const token = jwt.sign(payload, env.jwtSecret, { expiresIn: "8h" });
  await createUserSession(user.id, jti, req);
  return { token, payload };
}

router.post("/register", async (req, res) => {
  const { organizationName, email, password, phone } = req.body as {
    organizationName?: string;
    email?: string;
    password?: string;
    phone?: string;
  };

  if (!organizationName || !email || !password) {
    return res.status(400).json({ message: "organizationName, email and password are required" });
  }
  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters long" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const emailLower = email.toLowerCase();
    const existingUser = await client.query<{ id: string }>(
      "SELECT id FROM users WHERE email = $1 LIMIT 1",
      [emailLower],
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

    const orgResult = await client.query<{ id: string }>(
      `INSERT INTO organizations (name, email, phone)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [organizationName, emailLower, phone ?? null],
    );

    const organizationId = orgResult.rows[0].id;
    const passwordHash = await bcrypt.hash(password, 10);

    const userResult = await client.query<UserRow>(
      `INSERT INTO users (
          organization_id, email, password_hash, first_name, last_name, phone, role_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, true)
        RETURNING *`,
      [organizationId, emailLower, passwordHash, organizationName, "Admin", phone ?? null, adminRoleId],
    );

    await client.query("COMMIT");

    const user = userResult.rows[0];
    const issued = await issueToken(user, req);
    if (!issued) {
      return res.status(500).json({ message: "Failed to load user permissions" });
    }

    return res.status(201).json({
      token: issued.token,
      user: serializeUser(user, {
        roleId: issued.payload.roleId,
        roleName: issued.payload.role,
        permissions: issued.payload.permissions,
      }),
    });
  } catch (err: unknown) {
    await client.query("ROLLBACK");
    // eslint-disable-next-line no-console
    console.error("Register error", err);
    return res.status(500).json({ message: "Internal server error" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const { rows } = await query<UserRow>(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [email.toLowerCase()],
    );
    const user = rows[0];

    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const issued = await issueToken(user, req);
    if (!issued) {
      return res.status(500).json({ message: "Failed to load user permissions" });
    }

    return res.json({
      token: issued.token,
      user: serializeUser(user, {
        roleId: issued.payload.roleId,
        roleName: issued.payload.role,
        permissions: issued.payload.permissions,
      }),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Login error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/me", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const { rows } = await query<UserRow>(
      `SELECT id, organization_id, email, password_hash, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid`,
      [userId],
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const ctx = await loadUserPermissions(userId);
    if (!ctx) {
      return res.status(500).json({ message: "Failed to load permissions" });
    }
    return res.json({
      user: serializeUser(user, ctx),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Auth me error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/sessions", authenticateJWT, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { rows } = await query<{
      id: string;
      ip_address: string | null;
      user_agent: string | null;
      expires_at: string;
      created_at: string;
      token: string;
    }>(
      `SELECT id::text, ip_address::text, user_agent, expires_at::text, created_at::text, token
       FROM user_sessions
       WHERE user_id = $1::uuid AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId],
    );
    const currentJti = req.user?.jti;
    const currentHash = currentJti ? hashSessionToken(currentJti) : null;
    return res.json(
      rows.map((s) => ({
        id: s.id,
        ipAddress: s.ip_address,
        userAgent: s.user_agent,
        expiresAt: s.expires_at,
        createdAt: s.created_at,
        isCurrent: currentHash !== null && s.token === currentHash,
      })),
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List sessions error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.delete("/sessions/:id", authenticateJWT, async (req, res) => {
  const userId = req.user?.sub;
  const sessionId = String(req.params.id ?? "");
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { rows } = await query<{ id: string }>(
      `DELETE FROM user_sessions
       WHERE id = $1::uuid AND user_id = $2::uuid
       RETURNING id::text`,
      [sessionId, userId],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Session not found" });
    }
    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Revoke session error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const authRoutes = router;
