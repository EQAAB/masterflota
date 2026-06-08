import { createHash, randomUUID } from "crypto";
import type { Request } from "express";
import { query } from "../db/pool";

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

function clientIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return req.socket.remoteAddress ?? null;
}

export async function createUserSession(
  userId: string,
  jti: string,
  req?: Request,
): Promise<void> {
  const tokenHash = hashSessionToken(jti);
  const expiresAt = sessionExpiresAt();
  await query(
    `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
     VALUES ($1::uuid, $2, $3::inet, $4, $5)`,
    [userId, tokenHash, clientIp(req), req?.headers["user-agent"] ?? null, expiresAt],
  );
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

export async function revokeUserSession(userId: string, jti: string): Promise<void> {
  const tokenHash = hashSessionToken(jti);
  await query(
    `DELETE FROM user_sessions WHERE user_id = $1::uuid AND token = $2`,
    [userId, tokenHash],
  );
}
