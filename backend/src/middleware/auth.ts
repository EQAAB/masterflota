import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { hasAllPermissions, hasAnyPermission } from "../modules/auth/permissions";

export interface AuthPayload {
  sub: string;
  orgId: string | null;
  roleId: string;
  role: string;
  permissions: string[];
  jti?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthPayload;
  }
}

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Missing authorization token" });
  }

  const token = authHeader.substring("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthPayload;
    if (!decoded.roleId || !decoded.role || !Array.isArray(decoded.permissions)) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    req.user = decoded;
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requirePermission(...names: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!hasAnyPermission(req.user.permissions, names)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Super admin access required" });
  }
  return next();
}

export function requireAllPermissions(...names: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!hasAllPermissions(req.user.permissions, names)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return next();
  };
}

/** @deprecated Use requirePermission. Maps legacy role names to coarse permission sets. */
export function requireRole(...roles: string[]) {
  const rolePermissionMap: Record<string, string[]> = {
    admin: ["users.manage"],
    accountant: ["payouts.view"],
    driver: [],
  };
  const required = roles.flatMap((r) => rolePermissionMap[r] ?? []);
  if (required.length === 0) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return requirePermission(...required);
}
