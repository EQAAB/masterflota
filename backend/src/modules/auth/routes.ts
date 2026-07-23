import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query } from "../../db/pool";
import { env } from "../../config/env";
import { createUserSession, hashSessionToken, newSessionJti, revokeAllUserSessions, revokeUserSession } from "../../lib/userSession";
import { recordLoginEvent } from "../../lib/loginEvent";
import { authenticateJWT, type AuthPayload } from "../../middleware/auth";
import { loadUserPermissions } from "./permissions";
import { loginRateLimiter } from "../../middleware/rateLimit";

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
  const sessionId = await createUserSession(user.id, jti, req);
  return { token, payload, sessionId };
}

function loginEventUser(user: UserRow) {
  return {
    id: user.id,
    organization_id: user.organization_id,
    email: user.email,
  };
}

router.post("/register", (_req, res) => {
  return res.status(403).json({
    message: "Public registration is disabled. Contact your system administrator.",
  });
});

router.post("/login", loginRateLimiter, async (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = email.toLowerCase();

  try {
    const { rows } = await query<UserRow>(
      "SELECT * FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail],
    );
    const user = rows[0];

    if (!user) {
      await recordLoginEvent({
        eventType: "login.failed",
        email: normalizedEmail,
        failureReason: "unknown_email",
        req,
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.is_active) {
      await recordLoginEvent({
        eventType: "login.failed",
        email: normalizedEmail,
        user: loginEventUser(user),
        failureReason: "inactive_user",
        req,
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      await recordLoginEvent({
        eventType: "login.failed",
        email: normalizedEmail,
        user: loginEventUser(user),
        failureReason: "invalid_credentials",
        req,
      });
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const issued = await issueToken(user, req);
    if (!issued) {
      return res.status(500).json({ message: "Failed to load user permissions" });
    }

    await recordLoginEvent({
      eventType: "login.success",
      email: normalizedEmail,
      user: loginEventUser(user),
      req,
      sessionId: issued.sessionId,
    });

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

router.post("/change-password", authenticateJWT, async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { currentPassword, newPassword } = req.body as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters" });
  }

  try {
    const { rows } = await query<UserRow>(
      `SELECT id, organization_id, email, password_hash, first_name, last_name, phone, role_id::text, is_active
       FROM users WHERE id = $1::uuid`,
      [userId],
    );
    const user = rows[0];
    if (!user || !user.is_active) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const passwordOk = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordOk) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await query(`UPDATE users SET password_hash = $2, updated_at = NOW() WHERE id = $1::uuid`, [
      userId,
      passwordHash,
    ]);

    await revokeAllUserSessions(userId);

    return res.json({ message: "Password updated. Please sign in again." });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Change password error", err);
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
    const { rows: userRows } = await query<UserRow>(
      "SELECT id, organization_id, email FROM users WHERE id = $1::uuid LIMIT 1",
      [userId],
    );
    const actor = userRows[0];

    const { rows } = await query<{ id: string }>(
      `DELETE FROM user_sessions
       WHERE id = $1::uuid AND user_id = $2::uuid
       RETURNING id::text`,
      [sessionId, userId],
    );
    if (!rows[0]) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (actor) {
      await recordLoginEvent({
        eventType: "session.revoked",
        email: actor.email,
        user: loginEventUser(actor),
        req,
        sessionId: rows[0].id,
      });
    }

    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Revoke session error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/logout", authenticateJWT, async (req, res) => {
  const userId = req.user?.sub;
  const jti = req.user?.jti;
  if (!userId || !jti) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const { rows: userRows } = await query<UserRow>(
      "SELECT id, organization_id, email FROM users WHERE id = $1::uuid LIMIT 1",
      [userId],
    );
    const user = userRows[0];

    await revokeUserSession(userId, jti);

    if (user) {
      await recordLoginEvent({
        eventType: "logout.success",
        email: user.email,
        user: loginEventUser(user),
        req,
      });
    }

    return res.status(204).send();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Logout error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const authRoutes = router;
