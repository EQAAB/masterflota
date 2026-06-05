import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requirePermission, requireAllPermissions } from "./auth";

function mockReq(permissions: string[] | undefined): Request {
  return { user: permissions ? { permissions, sub: "u1", orgId: "o1", roleId: "r1", role: "admin" } : undefined } as Request;
}

function runMiddleware(mw: ReturnType<typeof requirePermission>, req: Request) {
  const res = {
    statusCode: 200,
    body: null as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  } as Response & { statusCode: number; body: unknown };
  const next = vi.fn();
  mw(req, res, next);
  return { res, next };
}

describe("requirePermission", () => {
  it("allows when user has one of the required permissions", () => {
    const { next, res } = runMiddleware(requirePermission("imports.create", "imports.view"), mockReq(["imports.view"]));
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
  });

  it("denies when permission is missing", () => {
    const { next, res } = runMiddleware(requirePermission("imports.delete"), mockReq(["imports.view"]));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });

  it("returns 401 without user", () => {
    const { next, res } = runMiddleware(requirePermission("imports.view"), mockReq(undefined));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });
});

describe("requireAllPermissions", () => {
  it("requires every permission", () => {
    const { next } = runMiddleware(requireAllPermissions("imports.view", "imports.create"), mockReq(["imports.view", "imports.create"]));
    expect(next).toHaveBeenCalled();
  });

  it("denies when one permission is missing", () => {
    const { next, res } = runMiddleware(requireAllPermissions("imports.view", "imports.create"), mockReq(["imports.view"]));
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
