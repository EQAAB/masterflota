import { Router } from "express";
import { query } from "../../db/pool";
import { authenticateJWT, requirePermission } from "../../middleware/auth";

const router = Router();

router.use(authenticateJWT);
router.use(requirePermission("settings.manage"));

const VALID_TYPES = new Set(["string", "number", "boolean", "json"]);

type SettingRow = {
  id: string;
  key: string;
  value: string | null;
  value_type: string;
  created_at: string;
  updated_at: string;
};

function parseValue(value: string | null, valueType: string): unknown {
  if (value === null) return null;
  if (valueType === "number") return Number(value);
  if (valueType === "boolean") return value === "true";
  if (valueType === "json") return JSON.parse(value);
  return value;
}

function serializeSetting(row: SettingRow) {
  return {
    id: row.id,
    key: row.key,
    value: parseValue(row.value, row.value_type),
    valueType: row.value_type,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

router.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  try {
    const { rows } = await query<SettingRow>(
      `SELECT id::text, key, value, value_type, created_at::text, updated_at::text
       FROM settings WHERE organization_id = $1::uuid ORDER BY key`,
      [orgId],
    );
    return res.json(rows.map(serializeSetting));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("List settings error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/:key", async (req, res) => {
  const orgId = req.user?.orgId;
  const key = String(req.params.key ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  try {
    const { rows } = await query<SettingRow>(
      `SELECT id::text, key, value, value_type, created_at::text, updated_at::text
       FROM settings WHERE organization_id = $1::uuid AND key = $2`,
      [orgId, key],
    );
    const row = rows[0];
    if (!row) {
      return res.status(404).json({ message: "Setting not found" });
    }
    return res.json(serializeSetting(row));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Get setting error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.put("/:key", async (req, res) => {
  const orgId = req.user?.orgId;
  const key = String(req.params.key ?? "");
  if (!orgId) {
    return res.status(400).json({ message: "User is not associated with an organization" });
  }
  const { value, valueType } = req.body as { value?: unknown; valueType?: string };
  const type = valueType ?? "string";
  if (!VALID_TYPES.has(type)) {
    return res.status(400).json({ message: "Invalid valueType" });
  }
  let stored: string | null = null;
  if (value !== undefined && value !== null) {
    if (type === "json") stored = JSON.stringify(value);
    else if (type === "boolean") stored = value ? "true" : "false";
    else stored = String(value);
  }
  try {
    const { rows } = await query<SettingRow>(
      `INSERT INTO settings (organization_id, key, value, value_type)
       VALUES ($1::uuid, $2, $3, $4)
       ON CONFLICT (organization_id, key) DO UPDATE SET
         value = EXCLUDED.value,
         value_type = EXCLUDED.value_type,
         updated_at = NOW()
       RETURNING id::text, key, value, value_type, created_at::text, updated_at::text`,
      [orgId, key, stored, type],
    );
    return res.json(serializeSetting(rows[0]));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Upsert setting error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export const settingsRoutes = router;
