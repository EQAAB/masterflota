import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const files = [];
function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name.endsWith(".ts")) files.push(p);
  }
}
walk(path.join(root, "src/modules"));

const block = /const orgId = req\.effectiveOrgId;\r?\n(\s*)if \(!orgId\) \{\r?\n\s*return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);\r?\n\s*\}/g;
const single = /const orgId = req\.effectiveOrgId;\r?\n\s*if \(!orgId\) return res\.status\(400\)\.json\(\{ message: "User is not associated with an organization" \}\);/g;

function addImport(s, rel) {
  if (s.includes('from "../../middleware/orgContext"')) return s;
  const depth = rel.split("/").length - 2;
  const prefix = "../".repeat(depth) + "middleware/orgContext";
  if (s.includes('from "../../middleware/auth"')) {
    return s.replace(
      /from "\.\.\/\.\.\/middleware\/auth";/,
      `from "../../middleware/auth";\nimport { requireOrgId } from "${prefix}";`,
    );
  }
  if (s.includes('import { query } from "../../db/pool"')) {
    return s.replace(
      /import \{ query \} from "\.\.\/\.\.\/db\/pool";/,
      `import { query } from "../../db/pool";\nimport { requireOrgId } from "${prefix}";`,
    );
  }
  if (s.includes("vehicleAssignmentHistoryHandlers")) {
    return `import { requireOrgId } from "../../middleware/orgContext";\n${s}`;
  }
  return s;
}

for (const fp of files) {
  let s = fs.readFileSync(fp, "utf8");
  if (!s.includes("req.effectiveOrgId")) continue;
  const before = s;
  s = s.replace(block, "const orgId = requireOrgId(req, res);\n  if (!orgId) return;");
  s = s.replace(single, "const orgId = requireOrgId(req, res);\n  if (!orgId) return;");
  if (s.includes("requireOrgId(")) {
    const rel = path.relative(path.join(root, "src"), fp).replace(/\\/g, "/");
    s = addImport(s, rel);
  }
  if (s !== before) {
    fs.writeFileSync(fp, s);
    console.log("fixed", path.relative(root, fp));
  }
}
