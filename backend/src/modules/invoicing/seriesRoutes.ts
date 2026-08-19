import { Router } from "express";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingManage, requireInvoicingView } from "./invoicingAuth";
import { invoicingDb } from "./invoicingDb";

const router = Router();

router.get("/", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { rows } = await invoicingDb.query(
    `SELECT * FROM invoice_series WHERE organization_id = $1 ORDER BY prefix`,
    [orgId],
  );
  return res.json(rows);
});

router.post("/", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { prefix, startNumber, isDefault } = req.body;
  if (!prefix?.trim()) {
    return res.status(400).json({ message: "Series prefix is required" });
  }

  if (isDefault) {
    await invoicingDb.query(
      `UPDATE invoice_series SET is_default = false WHERE organization_id = $1`,
      [orgId],
    );
  }

  const { rows } = await invoicingDb.query(
    `INSERT INTO invoice_series (organization_id, prefix, next_number, is_default)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [orgId, prefix.trim().toUpperCase(), startNumber ?? 1, isDefault ?? false],
  );
  return res.status(201).json(rows[0]);
});

router.patch("/:id", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { isActive, isDefault } = req.body;

  if (isDefault) {
    await invoicingDb.query(
      `UPDATE invoice_series SET is_default = false WHERE organization_id = $1`,
      [orgId],
    );
  }

  const sets: string[] = [];
  const params: unknown[] = [];
  let idx = 1;

  if (isActive !== undefined) {
    sets.push(`is_active = $${idx++}`);
    params.push(isActive);
  }
  if (isDefault !== undefined) {
    sets.push(`is_default = $${idx++}`);
    params.push(isDefault);
  }
  sets.push(`updated_at = NOW()`);

  const id = req.params.id as string;
  params.push(id, orgId);

  const { rows } = await invoicingDb.query(
    `UPDATE invoice_series SET ${sets.join(", ")}
     WHERE id = $${idx++}::uuid AND organization_id = $${idx}::uuid
     RETURNING *`,
    params,
  );

  if (!rows.length) {
    return res.status(404).json({ message: "Series not found" });
  }
  return res.json(rows[0]);
});

export const seriesRoutes = router;
