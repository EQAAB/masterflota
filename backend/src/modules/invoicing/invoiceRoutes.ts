import { Router } from "express";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingManage, requireInvoicingView, requireInvoicingAnaf } from "./invoicingAuth";
import { invoicingDb } from "./invoicingDb";
import { createInvoice, issueInvoice, cancelInvoice } from "./invoiceService";
import { uploadInvoiceToAnaf, checkAnafStatus } from "./anafService";
import { buildInvoiceXml } from "./xmlBuilder";

const router = Router();

router.get("/", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { status, from, to, q } = req.query;
  const conditions = ["i.organization_id = $1"];
  const params: unknown[] = [orgId];
  let idx = 2;

  if (status) {
    conditions.push(`i.status = $${idx++}`);
    params.push(status);
  }
  if (from) {
    conditions.push(`i.issue_date >= $${idx++}::date`);
    params.push(from);
  }
  if (to) {
    conditions.push(`i.issue_date <= $${idx++}::date`);
    params.push(to);
  }
  if (q && typeof q === "string" && q.trim()) {
    conditions.push(`(
      i.buyer_name ILIKE $${idx} OR
      i.buyer_cui ILIKE $${idx} OR
      (i.series_prefix || i.invoice_number::text) ILIKE $${idx}
    )`);
    params.push(`%${q.trim()}%`);
    idx++;
  }

  const { rows } = await invoicingDb.query(
    `SELECT i.*, (u.first_name || ' ' || u.last_name) AS created_by_name
     FROM invoices i
     LEFT JOIN users u ON u.id = i.created_by
     WHERE ${conditions.join(" AND ")}
     ORDER BY i.issue_date DESC, i.invoice_number DESC
     LIMIT 500`,
    params,
  );

  return res.json(rows);
});

router.get("/:id", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  const { rows: invoiceRows } = await invoicingDb.query(
    `SELECT i.*, (u.first_name || ' ' || u.last_name) AS created_by_name
     FROM invoices i
     LEFT JOIN users u ON u.id = i.created_by
     WHERE i.id = $1::uuid AND i.organization_id = $2::uuid`,
    [id, orgId],
  );
  if (!invoiceRows.length) {
    return res.status(404).json({ message: "Invoice not found" });
  }

  const { rows: lines } = await invoicingDb.query(
    `SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_number`,
    [id],
  );

  return res.json({ ...invoiceRows[0], lines });
});

router.post("/", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  try {
    const invoice = await createInvoice({
      orgId,
      createdBy: req.user?.sub,
      ...req.body,
    });
    return res.status(201).json(invoice);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to create invoice";
    return res.status(400).json({ message: msg });
  }
});

router.post("/:id/issue", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  try {
    const { rows: fpRows } = await invoicingDb.query(
      `SELECT * FROM organization_fiscal_profiles WHERE organization_id = $1`,
      [orgId],
    );
    if (!fpRows.length) {
      return res.status(400).json({ message: "Organization fiscal profile is required before issuing invoices" });
    }

    const { rows: invoiceRows } = await invoicingDb.query(
      `SELECT * FROM invoices WHERE id = $1::uuid AND organization_id = $2::uuid`,
      [id, orgId],
    );
    if (!invoiceRows.length) {
      return res.status(404).json({ message: "Invoice not found" });
    }

    const { rows: lines } = await invoicingDb.query(
      `SELECT * FROM invoice_lines WHERE invoice_id = $1 ORDER BY line_number`,
      [id],
    );

    const xml = buildInvoiceXml(fpRows[0] as any, invoiceRows[0] as any, lines as any[]);

    await invoicingDb.query(
      `UPDATE invoices SET xml_content = $1 WHERE id = $2::uuid`,
      [xml, id],
    );

    const invoice = await issueInvoice(id, orgId);
    return res.json(invoice);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to issue invoice";
    return res.status(400).json({ message: msg });
  }
});

router.post("/:id/cancel", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  try {
    const invoice = await cancelInvoice(id, orgId);
    return res.json(invoice);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to cancel invoice";
    return res.status(400).json({ message: msg });
  }
});

router.post("/:id/submit-anaf", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  try {
    const result = await uploadInvoiceToAnaf(id, orgId);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to submit to ANAF";
    return res.status(400).json({ message: msg });
  }
});

router.get("/:id/anaf-status", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  try {
    const result = await checkAnafStatus(id, orgId);
    return res.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to check ANAF status";
    return res.status(400).json({ message: msg });
  }
});

router.get("/:id/xml", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;
  const id = req.params.id as string;

  const { rows } = await invoicingDb.query(
    `SELECT xml_content, series_prefix, invoice_number FROM invoices
     WHERE id = $1::uuid AND organization_id = $2::uuid`,
    [id, orgId],
  );
  if (!rows.length || !rows[0].xml_content) {
    return res.status(404).json({ message: "XML not available" });
  }

  const inv = rows[0] as { xml_content: string; series_prefix: string; invoice_number: number };
  res.setHeader("Content-Type", "application/xml");
  res.setHeader("Content-Disposition", `attachment; filename="${inv.series_prefix}${inv.invoice_number}.xml"`);
  return res.send(inv.xml_content);
});

export const invoiceRoutes = router;
