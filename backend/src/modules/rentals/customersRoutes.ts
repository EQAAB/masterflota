import { Router } from "express";
import { query } from "../../db/pool";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const customersRoutes = Router();

customersRoutes.get("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const activeOnly = req.query.active !== "false";
  try {
    const params: unknown[] = [orgId];
    let sql = `SELECT * FROM rental_customers WHERE organization_id = $1::uuid`;
    if (activeOnly) sql += ` AND is_active = true`;
    if (q) {
      params.push(`%${q}%`);
      sql += ` AND (legal_name ILIKE $2 OR contact_name ILIKE $2 OR email ILIKE $2 OR phone ILIKE $2)`;
    }
    sql += ` ORDER BY legal_name ASC`;
    const { rows } = await query(sql, params);
    return res.json(rows);
  } catch (err) {
    console.error("List rental customers error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

customersRoutes.get("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
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

customersRoutes.post("/", async (req, res) => {
  const orgId = req.user?.orgId;
  if (!orgId) return res.status(400).json({ message: "User is not associated with an organization" });
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

customersRoutes.put("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
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

customersRoutes.delete("/:id", async (req, res) => {
  const orgId = req.user?.orgId;
  const { id } = req.params;
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
