import { Request, Response, NextFunction } from "express";
import { isPlatformSuperAdminUser } from "./auth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readHeaderOrgId(req: Request): string | null {
  const raw =
    req.headers["x-organization-id"] ??
    req.headers["x-org-id"];
  const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  if (!value) return null;
  if (!UUID_RE.test(value)) return null;
  return value;
}

declare module "express-serve-static-core" {
  interface Request {
    effectiveOrgId?: string | null;
  }
}

export function attachOrgContext(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const headerOrg = readHeaderOrgId(req);
  const jwtOrg = req.user.orgId ?? null;
  if (isPlatformSuperAdminUser(req.user)) {
    req.effectiveOrgId = headerOrg;
    return next();
  }

  if (headerOrg && jwtOrg && headerOrg !== jwtOrg) {
    return res.status(403).json({ message: "Organization context mismatch" });
  }

  req.effectiveOrgId = jwtOrg;
  return next();
}

export function requireOrgId(req: Request, res: Response): string | null {
  const orgId = req.effectiveOrgId ?? null;
  if (!orgId) {
    res.status(400).json({ message: "Organization context is required" });
    return null;
  }
  return orgId;
}
