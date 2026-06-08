import { Router } from "express";
import { query } from "../../db/pool";
import { requireOrgId } from "../../middleware/orgContext";
import { requireRentalsManage, requireRentalsView } from "./rentalAuth";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const customersRoutes = Router();

customersRoutes.get("/summary", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  try {
    const { rows } = await query(
      `SELECT
         (SELECT COUNT(*)::int FROM rental_customers WHERE organization_id = $1 AND is_active = true) AS total_customers,
         (SELECT COUNT(*)::int FROM rental_bookings WHERE organization_id = $1 AND status = 'active') AS active_rentals,
         (SELECT COUNT(*)::int FROM (
            SELECT c.id FROM rental_customers c
            JOIN rental_bookings b ON b.customer_id = c.id AND b.organization_id = c.organization_id
            WHERE c.organization_id = $1 AND b.status = 'completed'
            GROUP BY c.id HAVING COUNT(*) >= 2
          ) sub) AS returning_customers,
         (SELECT COALESCE(SUM(amount), 0)::numeric FROM rental_payments
          WHERE organization_id = $1 AND payment_type = 'rent' AND status = 'paid') AS lifetime_revenue,
         (SELECT COUNT(*)::int FROM rental_customers
          WHERE organization_id = $1 AND created_at >= date_trunc('month', NOW())) AS customers_added_this_month`,
      [orgId],
    );
    return res.json(rows[0]);
  } catch (err) {
    console.error("Rental customers summary error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.get("/", requireRentalsView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const activeOnly = req.query.active !== "false";
  const customerType =
    req.query.customerType === "company" || req.query.customerType === "individual"
      ? req.query.customerType
      : undefined;
  const hasActiveRental =
    req.query.hasActiveRental === "true" ? true : req.query.hasActiveRental === "false" ? false : undefined;
  const sort = typeof req.query.sort === "string" ? req.query.sort : "name";
  const orderClause =
    sort === "revenue"
      ? "lifetime_revenue DESC NULLS LAST"
      : sort === "bookings"
        ? "total_bookings DESC NULLS LAST"
        : sort === "created"
          ? "c.created_at DESC"
          : "c.legal_name ASC";

  try {
    const params: unknown[] = [orgId];
    let i = 2;
    let sql = `
      SELECT c.*,
        COUNT(b.id) FILTER (WHERE b.status IN ('active', 'confirmed'))::int AS active_bookings,
        COUNT(b.id) FILTER (WHERE b.status = 'completed')::int AS completed_rentals,
        COUNT(b.id)::int AS total_bookings,
        COALESCE(SUM(CASE WHEN p.payment_type = 'rent' AND p.status = 'paid' THEN p.amount ELSE 0 END), 0)::numeric AS lifetime_revenue
      FROM rental_customers c
      LEFT JOIN rental_bookings b ON b.customer_id = c.id AND b.organization_id = c.organization_id
      LEFT JOIN rental_payments p ON p.booking_id = b.id
      WHERE c.organization_id = $1::uuid`;

    if (activeOnly) sql += ` AND c.is_active = true`;
    if (customerType) {
      sql += ` AND c.customer_type = $${i}`;
      params.push(customerType);
      i++;
    }
    if (q) {
      sql += ` AND (
        c.legal_name ILIKE '%' || $${i} || '%'
        OR c.contact_name ILIKE '%' || $${i} || '%'
        OR c.email ILIKE '%' || $${i} || '%'
        OR c.phone ILIKE '%' || $${i} || '%'
      )`;
      params.push(q);
      i++;
    }

    sql += ` GROUP BY c.id`;

    if (hasActiveRental === true) {
      sql += ` HAVING COUNT(b.id) FILTER (WHERE b.status IN ('active', 'confirmed')) > 0`;
    } else if (hasActiveRental === false) {
      sql += ` HAVING COUNT(b.id) FILTER (WHERE b.status IN ('active', 'confirmed')) = 0`;
    }

    sql += ` ORDER BY ${orderClause}`;

    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental customers error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.get("/:id", requireRentalsView, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const { rows } = await query(
      `SELECT * FROM rental_customers WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [id, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Customer not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Get rental customer error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.post("/", requireRentalsManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const b = req.body as Record<string, unknown>;
  const legalName = typeof b.legalName === "string" ? b.legalName.trim() : "";
  if (!legalName) return res.status(400).json({ message: "legalName is required" });
  const customerType = b.customerType === "company" ? "company" : "individual";
  try {
    const { rows } = await query(
      `INSERT INTO rental_customers (
         organization_id, customer_type, legal_name, contact_name, email, phone, tax_id, address, notes, is_active
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8::jsonb, '{}'), $9, COALESCE($10, true))
       RETURNING *`,
      [
        orgId,
        customerType,
        legalName,
        b.contactName ?? null,
        b.email ?? null,
        b.phone ?? null,
        b.taxId ?? null,
        b.address ? JSON.stringify(b.address) : null,
        b.notes ?? null,
        b.isActive ?? true,
      ],
    );
    return res.status(201).json(rows[0]);
  } catch (err) {
    console.error("Create rental customer error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.put("/:id", requireRentalsManage, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  const b = req.body as Record<string, unknown>;
  try {
    const { rows } = await query(
      `UPDATE rental_customers SET
         customer_type = COALESCE($3, customer_type),
         legal_name = COALESCE($4, legal_name),
         contact_name = COALESCE($5, contact_name),
         email = COALESCE($6, email),
         phone = COALESCE($7, phone),
         tax_id = COALESCE($8, tax_id),
         address = COALESCE($9::jsonb, address),
         notes = COALESCE($10, notes),
         is_active = COALESCE($11, is_active),
         updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING *`,
      [
        id,
        orgId,
        b.customerType ?? null,
        b.legalName ?? null,
        b.contactName ?? null,
        b.email ?? null,
        b.phone ?? null,
        b.taxId ?? null,
        b.address ? JSON.stringify(b.address) : null,
        b.notes ?? null,
        b.isActive ?? null,
      ],
    );
    if (!rows[0]) return res.status(404).json({ message: "Customer not found" });
    return res.json(rows[0]);
  } catch (err) {
    console.error("Update rental customer error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.delete("/:id", requireRentalsManage, async (req, res) => {
  const orgId = req.effectiveOrgId;
  const id = String(req.params.id ?? "");
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  if (!UUID_RE.test(id)) return res.status(400).json({ message: "Invalid id" });
  try {
    const { rows } = await query(
      `UPDATE rental_customers SET is_active = false, updated_at = NOW()
       WHERE id = $1::uuid AND organization_id = $2::uuid
       RETURNING id`,
      [id, orgId],
    );
    if (!rows[0]) return res.status(404).json({ message: "Customer not found" });
    return res.status(204).send();
  } catch (err) {
    console.error("Deactivate rental customer error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});
