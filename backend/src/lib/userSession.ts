import { createHash, randomUUID } from "crypto";
import type { Request } from "express";
import { query } from "../db/pool";
import { clientIp } from "./clientIp";

const JWT_TTL_HOURS = 8;

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newSessionJti(): string {
  return randomUUID();
}

export function sessionExpiresAt(): Date {
  return new Date(Date.now() + JWT_TTL_HOURS * 60 * 60 * 1000);
}

export async function createUserSession(
  userId: string,
  jti: string,
  req?: Request,
): Promise<string> {
  const tokenHash = hashSessionToken(jti);
  const expiresAt = sessionExpiresAt();
  const { rows } = await query<{ id: string }>(
    `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
     VALUES ($1::uuid, $2, $3::inet, $4, $5)
     RETURNING id::text`,
    [userId, tokenHash, clientIp(req), req?.headers["user-agent"] ?? null, expiresAt],
  );
  return rows[0]!.id;
}

export async function validateActiveSession(userId: string, jti: string): Promise<boolean> {
  const tokenHash = hashSessionToken(jti);
  const { rows } = await query<{ ok: number }>(
    `SELECT 1 AS ok
     FROM user_sessions s
     INNER JOIN users u ON u.id = s.user_id
     WHERE s.user_id = $1::uuid
       AND s.token = $2
       AND s.expires_at > NOW()
       AND u.is_active = true
     LIMIT 1`,
    [userId, tokenHash],
  );
  return rows.length > 0;
}

export async function revokeAllUserSessions(userId: string): Promise<void> {
  await query(`DELETE FROM user_sessions WHERE user_id = $1::uuid`, [userId]);
}

/** Invalidate all sessions for users assigned to a role (after permission/role changes). */
export async function revokeSessionsForRole(roleId: string): Promise<void> {
  await query(
    `DELETE FROM user_sessions
     WHERE user_id IN (SELECT id FROM users WHERE role_id = $1::uuid)`,
    [roleId],
  );
}

export async function revokeUserSession(userId: string, jti: string): Promise<void> {
  const tokenHash = hashSessionToken(jti);
  await query(
    `DELETE FROM user_sessions WHERE user_id = $1::uuid AND token = $2`,
    [userId, tokenHash],
  );
}
