-- Driver cash loans: separate ledger from platform bad-week debt and recurring fees.

CREATE TABLE IF NOT EXISTS driver_loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    principal NUMERIC(12, 2) NOT NULL CHECK (principal > 0),
    remaining_balance NUMERIC(12, 2) NOT NULL CHECK (remaining_balance >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'paid', 'written_off')),
    disbursed_at DATE NOT NULL DEFAULT CURRENT_DATE,
    reference VARCHAR(100),
    notes TEXT,
    planned_repayment_week DATE,
    planned_repayment_note TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_loans_org_driver
    ON driver_loans (organization_id, driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_loans_driver_status
    ON driver_loans (driver_id, status);

CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_loans_one_active
    ON driver_loans (organization_id, driver_id)
    WHERE status = 'active';

CREATE TABLE IF NOT EXISTS driver_loan_repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    loan_id UUID NOT NULL REFERENCES driver_loans(id) ON DELETE CASCADE,
    repayment_type VARCHAR(20) NOT NULL
        CHECK (repayment_type IN ('from_payout', 'cash', 'forgive')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    balance_before NUMERIC(12, 2) NOT NULL CHECK (balance_before >= 0),
    balance_after NUMERIC(12, 2) NOT NULL CHECK (balance_after >= 0),
    driver_payout_id UUID REFERENCES driver_payouts(id) ON DELETE SET NULL,
    payment_period_start DATE,
    payment_period_end DATE,
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_loan_repayments_loan
    ON driver_loan_repayments (loan_id);

CREATE INDEX IF NOT EXISTS idx_driver_loan_repayments_org_driver_period
    ON driver_loan_repayments (organization_id, payment_period_start, payment_period_end);

-- Extend driver_payout_adjustments for loan-sourced deductions on anchor payout leg.
ALTER TABLE driver_payout_adjustments
    DROP CONSTRAINT IF EXISTS driver_payout_adjustments_source_check;

ALTER TABLE driver_payout_adjustments
    ADD CONSTRAINT driver_payout_adjustments_source_check
        CHECK (source IN ('manual', 'recurring', 'loan'));

ALTER TABLE driver_payout_adjustments
    ADD COLUMN IF NOT EXISTS loan_repayment_id UUID REFERENCES driver_loan_repayments(id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_driver_payout_adj_loan_repayment
    ON driver_payout_adjustments (loan_repayment_id)
    WHERE loan_repayment_id IS NOT NULL;

COMMENT ON TABLE driver_loans IS
    'Cash loans to drivers; one active loan per driver. Separate from platform bad-week debt.';
COMMENT ON TABLE driver_loan_repayments IS
    'Explicit loan repayments: from_payout (deducts anchor leg), cash, or forgive/write-off.';
