import { describe, expect, it, vi, beforeEach } from "vitest";
import type { Request, Response } from "express";
import type { AuthPayload } from "./auth";

const validateActiveSessionMock = vi.fn();
const jwtVerifyMock = vi.fn();

vi.mock("../lib/userSession", () => ({
  validateActiveSession: (...args: unknown[]) => validateActiveSessionMock(...args),
}));

vi.mock("jsonwebtoken", () => ({
  default: {
    verify: (...args: unknown[]) => jwtVerifyMock(...args),
  },
}));

import { authenticateJWT } from "./auth";

function mockResponse() {
  return {
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
}

async function runAuthenticateJWT(authHeader?: string) {
  const req = {
    headers: authHeader ? { authorization: authHeader } : {},
  } as Request;
  const res = mockResponse();
  const next = vi.fn();
  await authenticateJWT(req, res, next);
  return { req, res, next };
}

const validPayload: AuthPayload = {
  sub: "user-1",
  orgId: "org-1",
  roleId: "role-1",
  role: "admin",
  permissions: ["drivers.view"],
  jti: "session-jti",
};

describe("authenticateJWT session enforcement", () => {
  beforeEach(() => {
    validateActiveSessionMock.mockReset();
    jwtVerifyMock.mockReset();
  });

  it("returns 401 without authorization header", async () => {
    const { next, res } = await runAuthenticateJWT();
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when jwt verification fails", async () => {
    jwtVerifyMock.mockImplementation(() => {
      throw new Error("invalid");
    });
    const { next, res } = await runAuthenticateJWT("Bearer bad-token");
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when jti is missing", async () => {
    jwtVerifyMock.mockReturnValue({ ...validPayload, jti: undefined });
    const { next, res } = await runAuthenticateJWT("Bearer token");
    expect(validateActiveSessionMock).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("returns 401 when session is not active", async () => {
    jwtVerifyMock.mockReturnValue(validPayload);
    validateActiveSessionMock.mockResolvedValue(false);
    const { next, res } = await runAuthenticateJWT("Bearer token");
    expect(validateActiveSessionMock).toHaveBeenCalledWith("user-1", "session-jti");
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
  });

  it("calls next when jwt and session are valid", async () => {
    jwtVerifyMock.mockReturnValue(validPayload);
    validateActiveSessionMock.mockResolvedValue(true);
    const { req, next, res } = await runAuthenticateJWT("Bearer token");
    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(req.user).toEqual(validPayload);
  });
});
