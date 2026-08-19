import { Router } from "express";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingManage, requireInvoicingView } from "./invoicingAuth";
import { invoicingDb } from "./invoicingDb";

const router = Router();

router.get("/", requireInvoicingView, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { rows } = await invoicingDb.query(
    `SELECT * FROM organization_fiscal_profiles WHERE organization_id = $1`,
    [orgId],
  );
  return res.json(rows[0] ?? null);
});

router.put("/", requireInvoicingManage, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const {
    cui, companyName, regCom, isVatPayer, vatCode,
    addressCounty, addressCity, addressStreet, addressNumber, addressZip,
    bankName, bankIban, legalRepresentative, phone, email,
  } = req.body;

  if (!cui?.trim() || !companyName?.trim()) {
    return res.status(400).json({ message: "CUI and company name are required" });
  }

  const { rows } = await invoicingDb.query(
    `INSERT INTO organization_fiscal_profiles (
        organization_id, cui, company_name, reg_com, is_vat_payer, vat_code,
        address_county, address_city, address_street, address_number, address_zip,
        bank_name, bank_iban, legal_representative, phone, email
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
     ON CONFLICT (organization_id) DO UPDATE SET
        cui = EXCLUDED.cui,
        company_name = EXCLUDED.company_name,
        reg_com = EXCLUDED.reg_com,
        is_vat_payer = EXCLUDED.is_vat_payer,
        vat_code = EXCLUDED.vat_code,
        address_county = EXCLUDED.address_county,
        address_city = EXCLUDED.address_city,
        address_street = EXCLUDED.address_street,
        address_number = EXCLUDED.address_number,
        address_zip = EXCLUDED.address_zip,
        bank_name = EXCLUDED.bank_name,
        bank_iban = EXCLUDED.bank_iban,
        legal_representative = EXCLUDED.legal_representative,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        updated_at = NOW()
     RETURNING *`,
    [
      orgId, cui.trim(), companyName.trim(), regCom ?? null,
      isVatPayer ?? false, vatCode ?? null,
      addressCounty ?? null, addressCity ?? null, addressStreet ?? null,
      addressNumber ?? null, addressZip ?? null,
      bankName ?? null, bankIban ?? null, legalRepresentative ?? null,
      phone ?? null, email ?? null,
    ],
  );

  return res.json(rows[0]);
});

export const fiscalProfileRoutes = router;
