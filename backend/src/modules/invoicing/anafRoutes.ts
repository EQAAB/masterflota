import { Router } from "express";
import { env } from "../../config/env";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingAnaf, requireInvoicingView } from "./invoicingAuth";
import {
  getAnafAuthUrl,
  exchangeAnafCode,
  getAnafConnectionStatus,
  disconnectAnaf,
} from "./anafService";
import { invoicingDb } from "./invoicingDb";

const router = Router();

router.get("/status", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const status = await getAnafConnectionStatus(orgId);
  return res.json(status);
});

router.post("/connect", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { rows } = await invoicingDb.query(
    `SELECT cui FROM organization_fiscal_profiles WHERE organization_id = $1`,
    [orgId],
  );
  if (!rows.length) {
    return res.status(400).json({ message: "Set up your fiscal profile before connecting to ANAF" });
  }

  const state = Buffer.from(JSON.stringify({ orgId })).toString("base64url");
  const authUrl = getAnafAuthUrl(state);
  return res.json({ authUrl });
});

router.get("/callback", async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ message: `ANAF authorization failed: ${error}` });
  }
  if (!code || !state) {
    return res.status(400).json({ message: "Missing code or state parameter" });
  }

  try {
    const decoded = JSON.parse(Buffer.from(state as string, "base64url").toString()) as { orgId: string };

    const { rows } = await invoicingDb.query(
      `SELECT cui FROM organization_fiscal_profiles WHERE organization_id = $1`,
      [decoded.orgId],
    );
    if (!rows.length) {
      return res.status(400).json({ message: "Fiscal profile not found" });
    }

    const result = await exchangeAnafCode(code as string, decoded.orgId, (rows[0] as { cui: string }).cui);

    // Redirect to frontend settings page with success
    return res.redirect(`${env.frontendUrl}/invoicing/settings?anaf=connected`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Token exchange failed";
    return res.redirect(`${env.frontendUrl}/invoicing/settings?anaf=error&message=${encodeURIComponent(msg)}`);
  }
});

router.post("/disconnect", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  await disconnectAnaf(orgId);
  return res.json({ disconnected: true });
});

export const anafRoutes = router;
