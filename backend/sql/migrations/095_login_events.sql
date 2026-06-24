-- Login audit trail: success/failure, logout, session revocation.

BEGIN;

CREATE TABLE IF NOT EXISTS login_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    email_attempted VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN (
            'login.success',
            'login.failed',
            'logout.success',
            'session.revoked'
        )
    ),
    failure_reason VARCHAR(50) CHECK (
        failure_reason IS NULL
        OR failure_reason IN ('invalid_credentials', 'inactive_user', 'unknown_email')
    ),
    ip_address INET,
    user_agent TEXT,
    city VARCHAR(100),
    region VARCHAR(100),
    country VARCHAR(100),
    session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_events_org_created
    ON login_events (organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_events_type_created
    ON login_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_events_email_created
    ON login_events (email_attempted, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_events_ip_created
    ON login_events (ip_address, created_at DESC);

COMMIT;
