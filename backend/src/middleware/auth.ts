import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { validateActiveSession } from "../lib/userSession";
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

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
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
    if (!decoded.jti || !decoded.sub) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    const sessionValid = await validateActiveSession(decoded.sub, decoded.jti);
    if (!sessionValid) {
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

export function isPlatformSuperAdminUser(user: AuthPayload): boolean {
  return user.role === "super_admin" && user.orgId == null;
}

export function requirePlatformSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  if (!isPlatformSuperAdminUser(req.user)) {
    return res.status(403).json({ message: "Platform super admin access required" });
  }
  return next();
}

/** @deprecated Use requirePlatformSuperAdmin */
export const requireSuperAdmin = requirePlatformSuperAdmin;

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
