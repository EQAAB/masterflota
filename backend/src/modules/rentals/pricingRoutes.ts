import { Router } from "express";
import { query } from "../../db/pool";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const pricingRoutes = Router();

pricingRoutes.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  try {
    const params: unknown[] = [orgId];
    let sql = `
      SELECT rp.*, v.license_plate, v.make, v.model
      FROM rental_pricing rp
      LEFT JOIN vehicles v ON v.id = rp.vehicle_id
      WHERE rp.organization_id = $1::uuid`;
    if (vehicleId && UUID_RE.test(vehicleId)) {
      sql += ` AND (rp.vehicle_id = $2::uuid OR rp.vehicle_id IS NULL)`;
      params.push(vehicleId);
    }
    sql += ` ORDER BY rp.vehicle_id NULLS LAST, rp.created_at DESC`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.post("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows } = await query(
      `INSERT INTO rental_pricing (
         organization_id, vehicle_id, vehicle_type,
         daily_rate, weekly_rate, monthly_rate, deposit_default,
         effective_from, effective_to, is_active
       ) VALUES ($1, $2::uuid, $3, $4, $5, $6, $7, $8, $9, COALESCE($10, true))
       RETURNING *`,
      [
        orgId,
        b.vehicleId ?? null,
        b.vehicleType ?? null,
        b.dailyRate ?? 0,
        b.weeklyRate ?? 0,
        b.monthlyRate ?? 0,
        b.depositDefault ?? 0,
        b.effectiveFrom ?? null,
        b.effectiveTo ?? null,
        b.isActive ?? true,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.put("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows } = await query(
      `UPDATE rental_pricing SET
         daily_rate = COALESCE($3, daily_rate),
         weekly_rate = COALESCE($4, weekly_rate),
         monthly_rate = COALESCE($5, monthly_rate),
         deposit_default = COALESCE($6, deposit_default),
         is_active = COALESCE($7, is_active),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING *`,
      [id, orgId, b.dailyRate ?? null, b.weeklyRate ?? null, b.monthlyRate ?? null, b.depositDefault ?? null, b.isActive ?? null],
    );
    if (!rows[0]) return res.status(404).json({ message: "Pricing not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
