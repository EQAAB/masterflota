import { Router } from "express";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingAnaf } from "./invoicingAuth";
import { invoicingDb } from "./invoicingDb";

const router = Router();

router.get("/status", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { rows } = await invoicingDb.query(
    `SELECT provider, company_cui, is_active, connected_at
     FROM invoicing_providers WHERE organization_id = $1`,
    [orgId],
  );

  if (!rows.length) {
    return res.json({ configured: false });
  }

  const p = rows[0] as { provider: string; company_cui: string; is_active: boolean; connected_at: string };
  return res.json({
    configured: true,
    provider: p.provider,
    companyCui: p.company_cui,
    isActive: p.is_active,
    connectedAt: p.connected_at,
  });
});

router.post("/connect", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { provider, apiKey, apiSecret, companyCui } = req.body;

  if (!provider || !apiKey) {
    return res.status(400).json({ message: "Provider and API key are required" });
  }
  if (!["smartbill", "oblio"].includes(provider)) {
    return res.status(400).json({ message: "Supported providers: smartbill, oblio" });
  }

  await invoicingDb.query(
    `INSERT INTO invoicing_providers (organization_id, provider, api_key, api_secret, company_cui)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (organization_id) DO UPDATE SET
       provider = EXCLUDED.provider,
       api_key = EXCLUDED.api_key,
       api_secret = EXCLUDED.api_secret,
       company_cui = EXCLUDED.company_cui,
       is_active = true,
       updated_at = NOW()`,
    [orgId, provider, apiKey, apiSecret ?? null, companyCui ?? null],
  );

  return res.json({ configured: true, provider });
});

router.delete("/", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  await invoicingDb.query(`DELETE FROM invoicing_providers WHERE organization_id = $1`, [orgId]);
  return res.json({ deleted: true });
});

export const providerRoutes = router;
