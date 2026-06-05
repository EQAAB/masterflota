import type { Request } from "express";
import { query } from "../db/pool";

export type AuditLogInput = {
  orgId: string | null;
  userId: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  req?: Request;
};

function clientIp(req?: Request): string | null {
  if (!req) return null;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }
  return req.socket.remoteAddress ?? null;
}

export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  const { orgId, userId, action, entityType, entityId, oldValue, newValue, req } = input;
  try {
    await query(
      `INSERT INTO audit_logs (
          organization_id, user_id, action, entity_type, entity_id,
          old_value, new_value, ip_address, user_agent
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5::uuid,
          $6::jsonb, $7::jsonb, $8::inet, $9
        )`,
      [
        orgId,
        userId,
        action,
        entityType,
        entityId ?? null,
        oldValue !== undefined ? JSON.stringify(oldValue) : null,
        newValue !== undefined ? JSON.stringify(newValue) : null,
        clientIp(req),
        req?.headers["user-agent"] ?? null,
      ],
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("writeAuditLog error", err);
  }
}
