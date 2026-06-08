import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";
import { requireRentalsManage, requireRentalsView } from "./rentalAuth";
import { assertVehicleInOrg, RentalOrgScopeError } from "./rentalOrgGuards";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const pricingRoutes = Router();

pricingRoutes.get("/summary", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query(
      `SELECT
         COALESCE(AVG(daily_rate) FILTER (WHERE is_active = true), 0)::numeric AS avg_daily_rate,
         COALESCE(AVG(weekly_rate) FILTER (WHERE is_active = true), 0)::numeric AS avg_weekly_rate,
         COALESCE(SUM(monthly_rate) FILTER (WHERE is_active = true AND vehicle_id IS NOT NULL), 0)::numeric AS monthly_revenue_estimate,
         COUNT(DISTINCT vehicle_id) FILTER (WHERE vehicle_id IS NOT NULL AND is_active = true)::int AS vehicles_with_custom_pricing,
         COUNT(*) FILTER (WHERE is_active = true)::int AS pricing_rules_active,
         (SELECT COALESCE(AVG(daily_rate), 0) FROM rental_pricing
          WHERE organization_id = $1 AND is_active = true
            AND created_at >= date_trunc('month', NOW())) AS avg_daily_this_month,
         (SELECT COALESCE(AVG(daily_rate), 0) FROM rental_pricing
          WHERE organization_id = $1 AND is_active = true
            AND created_at >= date_trunc('month', NOW()) - interval '1 month'
            AND created_at < date_trunc('month', NOW())) AS avg_daily_prev_month
       FROM rental_pricing
       WHERE organization_id = $1`,
      [orgId],
    );
    const row = rows[0] as Record<string, unknown>;
    const thisM = Number(row.avg_daily_this_month ?? 0);
    const prevM = Number(row.avg_daily_prev_month ?? 0);
    let daily_rate_trend_pct: number | null = null;
    if (prevM > 0) {
      daily_rate_trend_pct = Math.round(((thisM - prevM) / prevM) * 1000) / 10;
    }
    return res.json({
      avg_daily_rate: Number(row.avg_daily_rate ?? 0),
      avg_weekly_rate: Number(row.avg_weekly_rate ?? 0),
      monthly_revenue_estimate: Number(row.monthly_revenue_estimate ?? 0),
      vehicles_with_custom_pricing: Number(row.vehicles_with_custom_pricing ?? 0),
      pricing_rules_active: Number(row.pricing_rules_active ?? 0),
      daily_rate_trend_pct,
    });
  } catch (err) {
    console.error("Pricing summary error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.get("/insights", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows: rented } = await query(
      `SELECT v.license_plate, v.make, v.model, COUNT(b.id)::int AS booking_count
       FROM rental_bookings b
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE b.organization_id = $1::uuid AND b.status IN ('active', 'completed', 'confirmed')
       GROUP BY v.id, v.license_plate, v.make, v.model
       ORDER BY booking_count DESC
       LIMIT 1`,
      [orgId],
    );

    const { rows: earning } = await query(
      `SELECT v.license_plate, COALESCE(SUM(p.amount), 0)::numeric AS revenue
       FROM rental_payments p
       JOIN rental_bookings b ON b.id = p.booking_id
       JOIN vehicles v ON v.id = b.vehicle_id
       WHERE p.organization_id = $1::uuid AND p.payment_type = 'rent' AND p.status = 'paid'
       GROUP BY v.id, v.license_plate
       ORDER BY revenue DESC
       LIMIT 1`,
      [orgId],
    );

    const { rows: fleet } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active') AS active_bookings,
         (SELECT COUNT(*)::int FROM vehicles WHERE organization_id = $1 AND status IN ('available', 'rented', 'maintenance')) AS fleet_total`,
      [orgId],
    );

    const { rows: mtd } = await query(
      `SELECT COALESCE(SUM(amount), 0)::numeric AS revenue_forecast
       FROM rental_payments
       WHERE organization_id = $1
         AND payment_type = 'rent'
         AND status = 'paid'
         AND paid_at >= date_trunc('month', NOW())`,
      [orgId],
    );

    const active = Number(fleet[0]?.active_bookings ?? 0);
    const total = Number(fleet[0]?.fleet_total ?? 0);
    const best_utilization_pct = total > 0 ? Math.round((active / total) * 100) : 0;

    return res.json({
      most_rented_vehicle: rented[0] ?? null,
      highest_earning_vehicle: earning[0] ?? null,
      best_utilization_pct,
      revenue_forecast: Number(mtd[0]?.revenue_forecast ?? 0),
    });
  } catch (err) {
    console.error("Pricing insights error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.get("/", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const vehicleId = typeof req.query.vehicleId === "string" ? req.query.vehicleId : undefined;
  const vehicleQ = typeof req.query.vehicleQ === "string" ? req.query.vehicleQ.trim() : undefined;
  try {
    const params: unknown[] = [orgId];
    let i = 2;
    let sql = `
      SELECT rp.*, v.license_plate, v.make, v.model, v.status AS vehicle_status,
             v.vehicle_type AS vehicle_type_name, v.transmission
      FROM rental_pricing rp
      LEFT JOIN vehicles v ON v.id = rp.vehicle_id
      WHERE rp.organization_id = $1::uuid`;
    if (vehicleId && UUID_RE.test(vehicleId)) {
      sql += ` AND (rp.vehicle_id = $${i}::uuid OR rp.vehicle_id IS NULL)`;
      params.push(vehicleId);
      i++;
    }
    if (vehicleQ) {
      sql += ` AND (
        v.license_plate ILIKE '%' || $${i} || '%'
        OR v.make ILIKE '%' || $${i} || '%'
        OR v.model ILIKE '%' || $${i} || '%'
        OR rp.vehicle_type ILIKE '%' || $${i} || '%'
      )`;
      params.push(vehicleQ);
      i++;
    }
    sql += ` ORDER BY rp.vehicle_id NULLS LAST, rp.created_at DESC`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.post("/", requireRentalsManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const b = req.body as Record<string, unknown>;
  const vehicleId = typeof b.vehicleId === "string" ? b.vehicleId : "";
  try {
    if (vehicleId && UUID_RE.test(vehicleId)) {
      await assertVehicleInOrg(vehicleId, orgId);
    }
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
    if (err instanceof RentalOrgScopeError) {
      return res.status(err.statusCode).json({ message: err.message });
    }
    console.error("Create rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

pricingRoutes.put("/:id", requireRentalsManage, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows } = await query(
      `UPDATE rental_pricing SET
         daily_rate = COALESCE($3, daily_rate),
         weekly_rate = COALESCE($4, weekly_rate),
         monthly_rate = COALESCE($5, monthly_rate),
         deposit_default = COALESCE($6, deposit_default),
         is_active = COALESCE($7, is_active),
         effective_from = COALESCE($8, effective_from),
         effective_to = COALESCE($9, effective_to),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING *`,
      [
        id,
        orgId,
        b.dailyRate ?? null,
        b.weeklyRate ?? null,
        b.monthlyRate ?? null,
        b.depositDefault ?? null,
        b.isActive ?? null,
        b.effectiveFrom ?? null,
        b.effectiveTo ?? null,
      ],
    );
    if (!rows[0]) return res.status(404).json({ message: "Pricing not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental pricing error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
