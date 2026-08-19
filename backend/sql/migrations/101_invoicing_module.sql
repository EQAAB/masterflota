-- Invoicing module: standalone e-Factura / ANAF integration
-- Tables: org fiscal profile, invoice series, invoices, invoice lines, ANAF tokens

BEGIN;

-- Organization fiscal profile (issuer identity for invoices)
CREATE TABLE IF NOT EXISTS organization_fiscal_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    cui VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    reg_com VARCHAR(50),
    is_vat_payer BOOLEAN NOT NULL DEFAULT false,
    vat_code VARCHAR(20),
    address_county VARCHAR(100),
    address_city VARCHAR(100),
    address_street VARCHAR(255),
    address_number VARCHAR(20),
    address_zip VARCHAR(10),
    bank_name VARCHAR(255),
    bank_iban VARCHAR(50),
    legal_representative VARCHAR(255),
    phone VARCHAR(30),
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoice numbering series (multiple per org, e.g. "FV", "AV")
CREATE TABLE IF NOT EXISTS invoice_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prefix VARCHAR(10) NOT NULL,
    next_number INTEGER NOT NULL DEFAULT 1,
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT invoice_series_org_prefix_uq UNIQUE (organization_id, prefix)
);

-- Invoices (standalone — optional link to rental bookings)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    series_id UUID NOT NULL REFERENCES invoice_series(id) ON DELETE RESTRICT,
    series_prefix VARCHAR(10) NOT NULL,
    invoice_number INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'issued', 'submitted', 'accepted', 'rejected', 'cancelled', 'storno')),

    -- Dates
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    delivery_date DATE,

    -- Buyer info (denormalized for immutability after issue)
    buyer_name VARCHAR(255) NOT NULL,
    buyer_cui VARCHAR(20),
    buyer_reg_com VARCHAR(50),
    buyer_address_county VARCHAR(100),
    buyer_address_city VARCHAR(100),
    buyer_address_street VARCHAR(255),
    buyer_address_number VARCHAR(20),
    buyer_address_zip VARCHAR(10),
    buyer_is_vat_payer BOOLEAN NOT NULL DEFAULT false,
    buyer_email VARCHAR(255),
    buyer_phone VARCHAR(30),
    buyer_bank_name VARCHAR(255),
    buyer_bank_iban VARCHAR(50),

    -- Amounts
    currency VARCHAR(3) NOT NULL DEFAULT 'RON',
    net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,

    -- ANAF e-Factura
    anaf_upload_index VARCHAR(100),
    anaf_download_id VARCHAR(100),
    anaf_status VARCHAR(30),
    anaf_error_message TEXT,
    anaf_submitted_at TIMESTAMPTZ,
    xml_content TEXT,

    -- Optional source links
    source_type VARCHAR(30),
    rental_booking_id UUID REFERENCES rental_bookings(id) ON DELETE SET NULL,

    -- Storno / credit note
    storno_of_id UUID REFERENCES invoices(id) ON DELETE SET NULL,

    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT invoices_org_series_number_uq UNIQUE (organization_id, series_prefix, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_org_status ON invoices(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_org_date ON invoices(organization_id, issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_booking ON invoices(rental_booking_id) WHERE rental_booking_id IS NOT NULL;

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL DEFAULT 1,
    description VARCHAR(500) NOT NULL,
    quantity NUMERIC(12, 4) NOT NULL DEFAULT 1,
    unit VARCHAR(20) NOT NULL DEFAULT 'buc',
    unit_price NUMERIC(12, 4) NOT NULL DEFAULT 0,
    vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 19,
    net_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    vat_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- ANAF OAuth tokens (per organization)
CREATE TABLE IF NOT EXISTS anaf_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_type VARCHAR(30) NOT NULL DEFAULT 'Bearer',
    expires_at TIMESTAMPTZ NOT NULL,
    scope VARCHAR(255),
    cui VARCHAR(20),
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Permissions for invoicing module
INSERT INTO permissions (name, module, description) VALUES
    ('invoicing.view', 'invoicing', 'View invoices'),
    ('invoicing.manage', 'invoicing', 'Create, edit, and issue invoices'),
    ('invoicing.anaf', 'invoicing', 'Submit invoices to ANAF and manage ANAF connection')
ON CONFLICT (name) DO NOTHING;

-- Grant to admin / super_admin / accountant
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name IN ('super_admin', 'admin')
  AND p.name IN ('invoicing.view', 'invoicing.manage', 'invoicing.anaf')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN ('invoicing.view', 'invoicing.manage')
WHERE r.name = 'accountant'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'invoicing.view'
WHERE r.name IN ('manager', 'viewer')
ON CONFLICT DO NOTHING;

COMMIT;
