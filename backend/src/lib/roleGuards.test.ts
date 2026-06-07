import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AuthPayload } from "../middleware/auth";
import { assertRoleAssignableByCaller, RoleAssignmentError } from "./roleGuards";

const queryMock = vi.fn();

vi.mock("../db/pool", () => ({
  query: (...args: unknown[]) => queryMock(...args),
}));

function orgAdminCaller(): AuthPayload {
  return {
    sub: "u1",
    orgId: "org-1",
    roleId: "r-admin",
    role: "admin",
    permissions: ["users.manage"],
  };
}

function platformSuperAdminCaller(): AuthPayload {
  return {
    sub: "u2",
    orgId: null,
    roleId: "r-super",
    role: "super_admin",
    permissions: ["organizations.create"],
  };
}

describe("assertRoleAssignableByCaller", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("rejects super_admin assignment by org admin", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ name: "super_admin" }] });

    await expect(assertRoleAssignableByCaller("role-super", orgAdminCaller())).rejects.toMatchObject({
      message: "Cannot assign super admin role",
      statusCode: 403,
    });
  });

  it("allows super_admin assignment by platform super admin", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ name: "super_admin" }] });

    await expect(
      assertRoleAssignableByCaller("role-super", platformSuperAdminCaller()),
    ).resolves.toBeUndefined();
  });

  it("allows org admin to assign admin role", async () => {
    queryMock.mockResolvedValueOnce({ rows: [{ name: "admin" }] });

    await expect(assertRoleAssignableByCaller("role-admin", orgAdminCaller())).resolves.toBeUndefined();
  });

  it("throws 400 for unknown role id", async () => {
    queryMock.mockResolvedValueOnce({ rows: [] });

    try {
      await assertRoleAssignableByCaller("missing", orgAdminCaller());
      expect.fail("expected RoleAssignmentError");
    } catch (err) {
      expect(err).toBeInstanceOf(RoleAssignmentError);
      expect(err).toMatchObject({ statusCode: 400, message: "Invalid role" });
    }
  });
});
