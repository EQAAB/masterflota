import { Router } from "express";
import multer from "multer";
import { requireOrgId } from "../../middleware/orgContext";
import { requireInvoicingAnaf } from "./invoicingAuth";
import { invoicingDb } from "./invoicingDb";
import { authenticateWithCertificate } from "./anafService";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (ext.endsWith(".pfx") || ext.endsWith(".p12")) {
      cb(null, true);
    } else {
      cb(new Error("Only .pfx or .p12 certificate files are allowed"));
    }
  },
});

const router = Router();

router.get("/status", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const { rows } = await invoicingDb.query(
    `SELECT cert_serial, cert_subject, uploaded_at
     FROM anaf_certificates WHERE organization_id = $1`,
    [orgId],
  );

  if (!rows.length) {
    return res.json({ uploaded: false });
  }

  const cert = rows[0] as { cert_serial: string; cert_subject: string; uploaded_at: string };
  return res.json({
    uploaded: true,
    serial: cert.cert_serial,
    subject: cert.cert_subject,
    uploadedAt: cert.uploaded_at,
  });
});

router.post("/upload", requireInvoicingAnaf, upload.single("certificate"), async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  const file = req.file;
  if (!file) {
    return res.status(400).json({ message: "Certificate file is required (.pfx or .p12)" });
  }

  const certPassword = req.body.password;
  if (!certPassword) {
    return res.status(400).json({ message: "Certificate password is required" });
  }

  const { rows: fpRows } = await invoicingDb.query(
    `SELECT cui FROM organization_fiscal_profiles WHERE organization_id = $1`,
    [orgId],
  );
  if (!fpRows.length) {
    return res.status(400).json({ message: "Set up your fiscal profile before uploading a certificate" });
  }

  try {
    await invoicingDb.query(
      `INSERT INTO anaf_certificates (organization_id, cert_data, cert_password_encrypted, cert_serial, cert_subject, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id) DO UPDATE SET
         cert_data = EXCLUDED.cert_data,
         cert_password_encrypted = EXCLUDED.cert_password_encrypted,
         cert_serial = EXCLUDED.cert_serial,
         cert_subject = EXCLUDED.cert_subject,
         uploaded_by = EXCLUDED.uploaded_by,
         uploaded_at = NOW()`,
      [
        orgId,
        file.buffer,
        certPassword,
        file.originalname,
        `Certificate: ${file.originalname}`,
        req.user?.sub ?? null,
      ],
    );

    const cui = (fpRows[0] as { cui: string }).cui;
    await authenticateWithCertificate(orgId, cui);

    return res.json({ uploaded: true, message: "Certificate uploaded and ANAF connection established" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Certificate upload failed";
    return res.status(400).json({ message: msg });
  }
});

router.delete("/", requireInvoicingAnaf, async (req, res) => {
  const orgId = requireOrgId(req, res);
  if (!orgId) return;

  await invoicingDb.query(`DELETE FROM anaf_certificates WHERE organization_id = $1`, [orgId]);
  await invoicingDb.query(
    `DELETE FROM anaf_tokens WHERE organization_id = $1 AND connection_method = 'certificate'`,
    [orgId],
  );

  return res.json({ deleted: true });
});

export const certificateRoutes = router;
