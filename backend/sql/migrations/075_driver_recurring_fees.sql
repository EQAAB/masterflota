-- Tier 1: recurring fees on driver profile, materialized into driver_payout_adjustments per payout week.

CREATE TABLE IF NOT EXISTS driver_recurring_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    fee_name VARCHAR(100) NOT NULL,
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('deduction', 'addition')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_recurring_fees_driver
    ON driver_recurring_fees (driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_recurring_fees_org_driver
    ON driver_recurring_fees (organization_id, driver_id);

ALTER TABLE driver_payout_adjustments
    ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'manual'
        CHECK (source IN ('manual', 'recurring'));

ALTER TABLE driver_payout_adjustments
    ADD COLUMN IF NOT EXISTS recurring_fee_id UUID REFERENCES driver_recurring_fees(id) ON DELETE SET NULL;

UPDATE driver_payout_adjustments SET source = 'manual' WHERE source IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_payout_adj_recurring_fee
    ON driver_payout_adjustments (driver_payout_id, recurring_fee_id)
    WHERE recurring_fee_id IS NOT NULL;
