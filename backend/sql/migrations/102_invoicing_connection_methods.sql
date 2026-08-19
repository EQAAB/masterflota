-- Add multiple ANAF connection methods: certificate upload, browser OAuth, provider API
-- Extends anaf_tokens with connection_method and cert storage
-- Adds provider_credentials for SmartBill/Oblio integration

BEGIN;

ALTER TABLE anaf_tokens
  ADD COLUMN IF NOT EXISTS connection_method VARCHAR(20) NOT NULL DEFAULT 'oauth'
    CHECK (connection_method IN ('oauth', 'certificate'));

-- Stored certificate (encrypted .pfx content + password, uploaded once)
CREATE TABLE IF NOT EXISTS anaf_certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    cert_data BYTEA NOT NULL,
    cert_password_encrypted TEXT NOT NULL,
    cert_serial VARCHAR(100),
    cert_subject VARCHAR(500),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Provider API credentials (SmartBill, Oblio, etc.)
CREATE TABLE IF NOT EXISTS invoicing_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    provider VARCHAR(30) NOT NULL CHECK (provider IN ('smartbill', 'oblio')),
    api_key TEXT NOT NULL,
    api_secret TEXT,
    company_cui VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
