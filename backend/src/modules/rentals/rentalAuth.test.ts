import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { requireRentalsManage, requireRentalsView } from "./rentalAuth";

function mockReq(permissions: string[] | undefined): Request {
  return {
    user: permissions
      ? { permissions, sub: "u1", orgId: "o1", roleId: "r1", role: "viewer" }
      : undefined,
  } as Request;
}

function runMiddleware(mw: ReturnType<typeof requireRentalsView>, req: Request) {
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

describe("rentalAuth", () => {
  describe("requireRentalsView", () => {
    it("allows rentals.view only", () => {
      const { next, res } = runMiddleware(requireRentalsView, mockReq(["rentals.view"]));
      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("allows rentals.manage only", () => {
      const { next, res } = runMiddleware(requireRentalsView, mockReq(["rentals.manage"]));
      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("denies when neither view nor manage", () => {
      const { next, res } = runMiddleware(requireRentalsView, mockReq(["drivers.view"]));
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
    });
  });

  describe("requireRentalsManage", () => {
    it("denies rentals.view only", () => {
      const { next, res } = runMiddleware(requireRentalsManage, mockReq(["rentals.view"]));
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(403);
    });

    it("allows rentals.manage", () => {
      const { next, res } = runMiddleware(requireRentalsManage, mockReq(["rentals.manage"]));
      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    it("returns 401 without user", () => {
      const { next, res } = runMiddleware(requireRentalsManage, mockReq(undefined));
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(401);
    });
  });
});
