import { describe, expect, it } from "vitest";
import {
  FAILED_ATTEMPT_THRESHOLD,
  buildLoginEventListWhere,
  buildLoginEventOrgClause,
  computeRecentFailedSpike,
  formatLocation,
} from "./loginEventQueries";

describe("buildLoginEventOrgClause", () => {
  it("scopes to organization for fleet users", () => {
    const clause = buildLoginEventOrgClause("org-uuid", false);
    expect(clause.sql).toContain("le.organization_id = $1::uuid");
    expect(clause.params).toEqual(["org-uuid"]);
  });

  it("allows platform-wide view for super admin", () => {
    const clause = buildLoginEventOrgClause(null, true);
    expect(clause.sql).toBe("TRUE");
    expect(clause.params).toEqual([]);
  });
});

describe("buildLoginEventListWhere", () => {
  it("composes event type and email filters", () => {
    const where = buildLoginEventListWhere({
      orgId: "org-1",
      eventType: "login.failed",
      email: "driver@",
    });
    expect(where.sql).toContain("le.event_type = $2");
    expect(where.sql).toContain("le.email_attempted ILIKE $3");
    expect(where.params).toEqual(["org-1", "login.failed", "%driver@%"]);
  });

  it("adds suspicious-only subqueries", () => {
    const where = buildLoginEventListWhere({
      orgId: "org-1",
      suspiciousOnly: true,
      suspiciousHours: 24,
    });
    expect(where.sql).toContain("login.failed");
    expect(where.sql).toContain(`>= ${FAILED_ATTEMPT_THRESHOLD}`);
    expect(where.params).toEqual(["org-1", 24]);
  });
});

describe("computeRecentFailedSpike", () => {
  it("flags spike when last hour exceeds 2x prior average", () => {
    expect(computeRecentFailedSpike(12, 20, 20)).toBe(true);
  });

  it("does not flag low-volume noise", () => {
    expect(computeRecentFailedSpike(2, 10, 23)).toBe(false);
  });
});

describe("formatLocation", () => {
  it("joins city region country", () => {
    expect(formatLocation("Bucharest", "Ilfov", "RO")).toBe("Bucharest, Ilfov, RO");
  });

  it("returns null when all empty", () => {
    expect(formatLocation(null, null, null)).toBeNull();
  });
});
