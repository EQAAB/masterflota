-- One consolidated payment record per driver per payment week (all platforms paid together).

CREATE TABLE IF NOT EXISTS driver_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    platforms TEXT[] NOT NULL DEFAULT '{}',
    platform_payout_ids UUID[] NOT NULL DEFAULT '{}',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'paid'
        CHECK (payment_status IN ('paid', 'failed', 'cancelled')),
    payment_method VARCHAR(50),
    transaction_ref VARCHAR(100),
    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_driver_payment_driver_week
        UNIQUE (organization_id, driver_id, payment_period_start, payment_period_end)
);

CREATE INDEX IF NOT EXISTS idx_driver_payments_org_period
    ON driver_payments (organization_id, payment_period_start, payment_period_end);

CREATE INDEX IF NOT EXISTS idx_driver_payments_driver
    ON driver_payments (driver_id, payment_period_start, payment_period_end);

COMMENT ON TABLE driver_payments IS
    'Consolidated driver payment for a payment week; links to all platform driver_payouts rows paid in one transfer.';
