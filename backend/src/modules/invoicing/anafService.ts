import { env } from "../../config/env";
import { invoicingDb } from "./invoicingDb";

const ANAF_AUTH_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/authorize";
const ANAF_TOKEN_URL = "https://logincert.anaf.ro/anaf-oauth2/v1/token";
const ANAF_UPLOAD_URL = "https://api.anaf.ro/prod/FCTEL/rest/upload";
const ANAF_STATUS_URL = "https://api.anaf.ro/prod/FCTEL/rest/stareMesaj";

const ANAF_CLIENT_ID = env.anafClientId;
const ANAF_CLIENT_SECRET = env.anafClientSecret;
const ANAF_CALLBACK_URL = env.anafCallbackUrl;

export function getAnafAuthUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: ANAF_CLIENT_ID,
    redirect_uri: ANAF_CALLBACK_URL,
    state,
    token_content_type: "jwt",
  });
  return `${ANAF_AUTH_URL}?${params.toString()}`;
}

export async function exchangeAnafCode(code: string, orgId: string, cui: string) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: ANAF_CLIENT_ID,
    client_secret: ANAF_CLIENT_SECRET,
    redirect_uri: ANAF_CALLBACK_URL,
  });

  const resp = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ANAF token exchange failed: ${resp.status} ${text}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await invoicingDb.query(
    `INSERT INTO anaf_tokens (organization_id, access_token, refresh_token, token_type, expires_at, scope, cui)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     ON CONFLICT (organization_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_type = EXCLUDED.token_type,
       expires_at = EXCLUDED.expires_at,
       scope = EXCLUDED.scope,
       cui = EXCLUDED.cui,
       updated_at = NOW()`,
    [orgId, data.access_token, data.refresh_token, data.token_type, expiresAt, data.scope ?? null, cui],
  );

  return { expiresAt, scope: data.scope };
}

export async function refreshAnafToken(orgId: string) {
  const { rows } = await invoicingDb.query(
    `SELECT * FROM anaf_tokens WHERE organization_id = $1`,
    [orgId],
  );
  if (!rows.length) throw new Error("No ANAF connection found");

  const token = rows[0] as { refresh_token: string };

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: token.refresh_token,
    client_id: ANAF_CLIENT_ID,
    client_secret: ANAF_CLIENT_SECRET,
  });

  const resp = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    throw new Error(`ANAF token refresh failed: ${resp.status}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await invoicingDb.query(
    `UPDATE anaf_tokens SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = NOW()
     WHERE organization_id = $4`,
    [data.access_token, data.refresh_token, expiresAt, orgId],
  );

  return data.access_token;
}

async function getValidToken(orgId: string): Promise<string> {
  const { rows } = await invoicingDb.query(
    `SELECT * FROM anaf_tokens WHERE organization_id = $1`,
    [orgId],
  );
  if (!rows.length) throw new Error("No ANAF connection found. Please connect to ANAF first.");

  const token = rows[0] as { access_token: string; expires_at: string };
  const expiresAt = new Date(token.expires_at);

  if (expiresAt.getTime() - Date.now() < 60_000) {
    return refreshAnafToken(orgId);
  }
  return token.access_token;
}

export async function uploadInvoiceToAnaf(invoiceId: string, orgId: string) {
  const { rows: invoiceRows } = await invoicingDb.query(
    `SELECT i.*, fp.cui AS issuer_cui
     FROM invoices i
     JOIN organization_fiscal_profiles fp ON fp.organization_id = i.organization_id
     WHERE i.id = $1::uuid AND i.organization_id = $2::uuid`,
    [invoiceId, orgId],
  );

  if (!invoiceRows.length) throw new Error("Invoice not found");
  const invoice = invoiceRows[0] as {
    id: string;
    xml_content: string | null;
    status: string;
    series_prefix: string;
    invoice_number: number;
    issuer_cui: string;
  };

  if (!invoice.xml_content) throw new Error("Invoice XML not generated. Issue the invoice first.");
  if (!["issued", "rejected"].includes(invoice.status)) {
    throw new Error("Invoice must be in 'issued' or 'rejected' status to submit to ANAF");
  }

  const accessToken = await getValidToken(orgId);
  const cui = invoice.issuer_cui.replace(/^RO/i, "");

  const uploadUrl = `${ANAF_UPLOAD_URL}?standard=UBL&cif=${cui}`;
  const resp = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/xml",
    },
    body: invoice.xml_content,
  });

  const result = await resp.json() as {
    ResponseUploadBonFiscal?: unknown;
    index_incarcare?: string;
    Errors?: { errorMessage: string }[];
    stare?: string;
  };

  if (!resp.ok || result.Errors?.length) {
    const errorMsg = result.Errors?.map((e) => e.errorMessage).join("; ") ?? `HTTP ${resp.status}`;
    await invoicingDb.query(
      `UPDATE invoices SET anaf_status = 'error', anaf_error_message = $1, anaf_submitted_at = NOW(), updated_at = NOW()
       WHERE id = $2::uuid`,
      [errorMsg, invoiceId],
    );
    throw new Error(`ANAF upload failed: ${errorMsg}`);
  }

  const uploadIndex = result.index_incarcare ?? "";

  await invoicingDb.query(
    `UPDATE invoices SET
       status = 'submitted',
       anaf_upload_index = $1,
       anaf_status = 'in_processing',
       anaf_error_message = NULL,
       anaf_submitted_at = NOW(),
       updated_at = NOW()
     WHERE id = $2::uuid`,
    [uploadIndex, invoiceId],
  );

  return { uploadIndex };
}

export async function checkAnafStatus(invoiceId: string, orgId: string) {
  const { rows } = await invoicingDb.query(
    `SELECT i.*, fp.cui AS issuer_cui
     FROM invoices i
     JOIN organization_fiscal_profiles fp ON fp.organization_id = i.organization_id
     WHERE i.id = $1::uuid AND i.organization_id = $2::uuid`,
    [invoiceId, orgId],
  );
  if (!rows.length) throw new Error("Invoice not found");

  const invoice = rows[0] as { anaf_upload_index: string | null; issuer_cui: string };
  if (!invoice.anaf_upload_index) throw new Error("Invoice has not been submitted to ANAF");

  const accessToken = await getValidToken(orgId);
  const cui = invoice.issuer_cui.replace(/^RO/i, "");

  const resp = await fetch(`${ANAF_STATUS_URL}?id_incarcare=${invoice.anaf_upload_index}&cif=${cui}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const result = await resp.json() as {
    stare?: string;
    id_descarcare?: string;
    Errors?: { errorMessage: string }[];
  };

  let newStatus = "submitted";
  let downloadId: string | null = null;
  let errorMsg: string | null = null;

  if (result.stare === "ok") {
    newStatus = "accepted";
    downloadId = result.id_descarcare ?? null;
  } else if (result.stare === "nok") {
    newStatus = "rejected";
    errorMsg = result.Errors?.map((e) => e.errorMessage).join("; ") ?? "Rejected by ANAF";
  }

  await invoicingDb.query(
    `UPDATE invoices SET
       status = $1, anaf_status = $2, anaf_download_id = COALESCE($3, anaf_download_id),
       anaf_error_message = $4, updated_at = NOW()
     WHERE id = $5::uuid`,
    [newStatus, result.stare ?? "pending", downloadId, errorMsg, invoiceId],
  );

  return { status: newStatus, anafState: result.stare, downloadId, errorMsg };
}

export async function getAnafConnectionStatus(orgId: string) {
  const { rows } = await invoicingDb.query(
    `SELECT cui, expires_at, connected_at, updated_at, connection_method FROM anaf_tokens WHERE organization_id = $1`,
    [orgId],
  );

  const { rows: certRows } = await invoicingDb.query(
    `SELECT cert_serial, cert_subject, uploaded_at FROM anaf_certificates WHERE organization_id = $1`,
    [orgId],
  );

  const { rows: providerRows } = await invoicingDb.query(
    `SELECT provider, company_cui, is_active, connected_at FROM invoicing_providers WHERE organization_id = $1`,
    [orgId],
  );

  const token = rows[0] as { cui: string; expires_at: string; connected_at: string; connection_method: string } | undefined;
  const cert = certRows[0] as { cert_serial: string; cert_subject: string; uploaded_at: string } | undefined;
  const provider = providerRows[0] as { provider: string; company_cui: string; is_active: boolean; connected_at: string } | undefined;

  return {
    connected: !!token,
    connectionMethod: token?.connection_method ?? null,
    cui: token?.cui ?? null,
    expiresAt: token?.expires_at ?? null,
    connectedAt: token?.connected_at ?? null,
    certificate: cert
      ? { uploaded: true, serial: cert.cert_serial, subject: cert.cert_subject, uploadedAt: cert.uploaded_at }
      : { uploaded: false },
    provider: provider
      ? { configured: true, provider: provider.provider, companyCui: provider.company_cui, isActive: provider.is_active, connectedAt: provider.connected_at }
      : { configured: false },
  };
}

export async function disconnectAnaf(orgId: string) {
  await invoicingDb.query(
    `DELETE FROM anaf_tokens WHERE organization_id = $1`,
    [orgId],
  );
}

export async function authenticateWithCertificate(orgId: string, cui: string) {
  const { rows: certRows } = await invoicingDb.query(
    `SELECT cert_data, cert_password_encrypted FROM anaf_certificates WHERE organization_id = $1`,
    [orgId],
  );
  if (!certRows.length) throw new Error("No certificate uploaded");

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: ANAF_CLIENT_ID,
    client_secret: ANAF_CLIENT_SECRET,
    scope: "e-factura",
  });

  const resp = await fetch(ANAF_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ANAF certificate auth failed: ${resp.status} ${text}`);
  }

  const data = await resp.json() as {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    scope?: string;
  };

  const expiresAt = new Date(Date.now() + data.expires_in * 1000);

  await invoicingDb.query(
    `INSERT INTO anaf_tokens (organization_id, access_token, refresh_token, token_type, expires_at, scope, cui, connection_method)
     VALUES ($1,$2,$3,$4,$5,$6,$7,'certificate')
     ON CONFLICT (organization_id) DO UPDATE SET
       access_token = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       token_type = EXCLUDED.token_type,
       expires_at = EXCLUDED.expires_at,
       scope = EXCLUDED.scope,
       cui = EXCLUDED.cui,
       connection_method = 'certificate',
       updated_at = NOW()`,
    [orgId, data.access_token, data.refresh_token, data.token_type, expiresAt, data.scope ?? null, cui],
  );

  return { expiresAt };
}
