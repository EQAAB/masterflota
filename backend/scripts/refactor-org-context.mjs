import fs from "fs";
import path from "path";

const files = [
  "src/modules/dashboard/routes.ts",
  "src/modules/users/routes.ts",
  "src/modules/audit/routes.ts",
  "src/modules/settings/routes.ts",
  "src/modules/roles/routes.ts",
  "src/modules/subcontractors/routes.ts",
  "src/modules/earnings/routes.ts",
  "src/modules/vehicleDocuments/routes.ts",
  "src/modules/documents/routes.ts",
  "src/modules/vehicles/routes.ts",
  "src/modules/drivers/routes.ts",
  "src/modules/import/earningsCsvRoutes.ts",
  "src/modules/rentals/routes.ts",
  "src/modules/subcontractorPayouts/routes.ts",
  "src/modules/rentals/pricingRoutes.ts",
  "src/modules/rentals/customersRoutes.ts",
  "src/modules/rentals/bookingsRoutes.ts",
  "src/modules/rentals/availabilityRoutes.ts",
  "src/modules/rentals/paymentsRoutes.ts",
  "src/modules/rentals/reportsRoutes.ts",
  "src/modules/vehicles/vehicleAssignmentHistoryHandlers.ts",
];

const routerFiles = [
  "src/modules/dashboard/routes.ts",
  "src/modules/users/routes.ts",
  "src/modules/audit/routes.ts",
  "src/modules/settings/routes.ts",
  "src/modules/roles/routes.ts",
  "src/modules/subcontractors/routes.ts",
  "src/modules/earnings/routes.ts",
  "src/modules/vehicleDocuments/routes.ts",
  "src/modules/documents/routes.ts",
  "src/modules/vehicles/routes.ts",
  "src/modules/drivers/routes.ts",
  "src/modules/import/earningsCsvRoutes.ts",
  "src/modules/rentals/routes.ts",
  "src/modules/subcontractorPayouts/routes.ts",
];

const guardPatterns = [
  /const orgId = req\.user\?\.orgId;\r?\n\s*if \(!orgId\) \{\r?\n\s*return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);\r?\n\s*\}/g,
  /const orgId = req\.user\?\.orgId;\r?\n\s*if \(!orgId\) return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);/g,
  /const orgId = req\.user\?\.orgId;\r?\n\s*if \(!orgId\) \{\r?\n\s*return res\.status\(400\)\.json\(\{ message: "Organization context is required" \}\);\r?\n\s*\}/g,
];

const root = path.join(import.meta.dirname, "..");

const guardEffective = /const orgId = req\.effectiveOrgId;\r?\n\s*if \(!orgId\) return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);/g;
const guardEffectiveBlock = /const orgId = req\.effectiveOrgId;\r?\n\s*if \(!orgId\) \{\r?\n\s*return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);\r?\n\s*\}/g;

function ensureRequireOrgIdImport(s) {
  if (!s.includes("requireOrgId(") || s.includes("from \"../../middleware/orgContext\"")) return s;
  if (s.includes('from "../../middleware/auth"')) {
    return s.replace(
      /from "\.\.\/\.\.\/middleware\/auth";/,
      'from "../../middleware/auth";\nimport { requireOrgId } from "../../middleware/orgContext";',
    );
  }
  if (s.includes('from "express"')) {
    return s.replace(
      /import \{ Router \} from "express";/,
      'import { Router } from "express";\nimport { requireOrgId } from "../../middleware/orgContext";',
    );
  }
  if (s.includes("export const customersRoutes")) {
    return s.replace(
      /import \{ query \} from "\.\.\/\.\.\/db\/pool";/,
      'import { query } from "../../db/pool";\nimport { requireOrgId } from "../../middleware/orgContext";',
    );
  }
  if (s.includes("vehicleAssignmentHistoryHandlers")) {
    return s.replace(
      /import \{ Request, Response \} from "express";/,
      'import { Request, Response } from "express";\nimport { requireOrgId } from "../../middleware/orgContext";',
    );
  }
  return s;
}

for (const rel of files) {
  const fp = path.join(root, rel);
  if (!fs.existsSync(fp)) {
    console.log("skip", rel);
    continue;
  }
  let s = fs.readFileSync(fp, "utf8");
  const before = s;
  for (const pat of guardPatterns) {
    s = s.replace(pat, "const orgId = requireOrgId(req, res);\n  if (!orgId) return;");
  }
  s = s.replace(guardEffective, "const orgId = requireOrgId(req, res);\n  if (!orgId) return;");
  s = s.replace(guardEffectiveBlock, "const orgId = requireOrgId(req, res);\n  if (!orgId) return;");
  s = s.replace(/req\.user\?\.orgId/g, "req.effectiveOrgId");
  if (s !== before) {
    s = ensureRequireOrgIdImport(s);
    fs.writeFileSync(fp, s);
    console.log("updated", rel);
  }
}

for (const rel of routerFiles) {
  const fp = path.join(root, rel);
  let s = fs.readFileSync(fp, "utf8");
  if (s.includes("attachOrgContext")) continue;
  if (!s.includes("router.use(authenticateJWT)")) continue;
  s = s.replace(
    /router\.use\(authenticateJWT\);/,
    'router.use(authenticateJWT);\nrouter.use(attachOrgContext);',
  );
  if (!s.includes("attachOrgContext")) continue;
  if (!s.includes("attachOrgContext }")) {
    s = s.replace(
      /from "\.\.\/\.\.\/middleware\/auth";/,
      'from "../../middleware/auth";\nimport { attachOrgContext, requireOrgId } from "../../middleware/orgContext";',
    );
    if (!s.includes("attachOrgContext")) {
      s = s.replace(
        /import \{ authenticateJWT([^}]*)\} from "\.\.\/\.\.\/middleware\/auth";/,
        'import { authenticateJWT$1} from "../../middleware/auth";\nimport { attachOrgContext, requireOrgId } from "../../middleware/orgContext";',
      );
    }
  }
  fs.writeFileSync(fp, s);
  console.log("middleware", rel);
}
