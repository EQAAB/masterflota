import type { Request } from "express";
import { query } from "../db/pool";
import { clientIp } from "./clientIp";

export type LoginEventType =
  | "login.success"
  | "login.failed"
  | "logout.success"
  | "session.revoked";

export type LoginFailureReason = "invalid_credentials" | "inactive_user" | "unknown_email";

export type LoginEventUser = {
  id: string;
  organization_id: string | null;
  email: string;
};

export type RecordLoginEventInput = {
  eventType: LoginEventType;
  email: string;
  user?: LoginEventUser | null;
  failureReason?: LoginFailureReason | null;
  req?: Request;
  sessionId?: string | null;
};

export async function recordLoginEvent(input: RecordLoginEventInput): Promise<void> {
  const { eventType, email, user, failureReason, req, sessionId } = input;
  const emailAttempted = email.trim().toLowerCase();
  if (!emailAttempted) return;

  try {
    await query(
      `INSERT INTO login_events (
          organization_id, user_id, email_attempted, event_type, failure_reason,
          ip_address, user_agent, session_id
        ) VALUES (
          $1::uuid, $2::uuid, $3, $4, $5,
          $6::inet, $7, $8::uuid
        )`,
      [
        user?.organization_id ?? null,
        user?.id ?? null,
        emailAttempted,
        eventType,
        failureReason ?? null,
        clientIp(req),
        req?.headers["user-agent"] ?? null,
        sessionId ?? null,
      ],
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("recordLoginEvent error", err);
  }
}
