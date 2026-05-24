-- Custom operational fees per driver payout (accommodation, food, bonuses, penalties).
-- Separate from payout_adjustments (debt audit).

CREATE TABLE IF NOT EXISTS driver_payout_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_payout_id UUID NOT NULL REFERENCES driver_payouts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    fee_name VARCHAR(100) NOT NULL,
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('deduction', 'addition')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    notes TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_payout_adj_payout
    ON driver_payout_adjustments (driver_payout_id);

CREATE INDEX IF NOT EXISTS idx_driver_payout_adj_org
    ON driver_payout_adjustments (organization_id);

DROP FUNCTION IF EXISTS subcontractor_settlement_totals(UUID, DATE, DATE);

CREATE OR REPLACE FUNCTION subcontractor_settlement_totals(
    p_organization_id UUID,
    p_period_start DATE,
    p_period_end DATE
) RETURNS TABLE (
    subcontractor_id UUID,
    driver_payout_count INT,
    total_gross_income NUMERIC(12, 2),
    total_tips NUMERIC(12, 2),
    total_commission NUMERIC(12, 2),
    total_vehicle_rent NUMERIC(12, 2),
    total_account_opening_fee NUMERIC(12, 2),
    total_platform_fees NUMERIC(12, 2),
    total_daily_cash NUMERIC(12, 2),
    total_custom_deductions NUMERIC(12, 2),
    total_custom_additions NUMERIC(12, 2),
    total_payable NUMERIC(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT d.subcontractor_id,
           COUNT(DISTINCT dp.id)::int,
           ROUND(COALESCE(SUM(dp.total_gross_earnings), 0)::numeric, 2),
           ROUND(COALESCE(SUM(dp.tips), 0)::numeric, 2),
           ROUND(COALESCE(SUM(dp.company_commission), 0)::numeric, 2),
           ROUND(COALESCE(SUM(dp.vehicle_rental_fee), 0)::numeric, 2),
           ROUND(
             COALESCE(
               SUM(CASE WHEN dp.platform = 'glovo' THEN dp.account_opening_fee ELSE 0 END),
               0
             )::numeric,
             2
           ),
           ROUND(
             COALESCE(
               SUM(CASE WHEN dp.platform = 'glovo' THEN dp.total_platform_fees ELSE 0 END),
               0
             )::numeric,
             2
           ),
           ROUND(COALESCE(SUM(dp.total_daily_cash), 0)::numeric, 2),
           ROUND(COALESCE(SUM(fee.deductions), 0)::numeric, 2),
           ROUND(COALESCE(SUM(fee.additions), 0)::numeric, 2),
           ROUND(COALESCE(SUM(dp.net_driver_payout), 0)::numeric, 2)
    FROM driver_payouts dp
    INNER JOIN drivers d
      ON d.id = dp.driver_id
     AND d.organization_id = dp.organization_id
    LEFT JOIN LATERAL (
        SELECT
            COALESCE(SUM(CASE WHEN pa.fee_type = 'deduction' THEN pa.amount ELSE 0 END), 0) AS deductions,
            COALESCE(SUM(CASE WHEN pa.fee_type = 'addition' THEN pa.amount ELSE 0 END), 0) AS additions
        FROM driver_payout_adjustments pa
        WHERE pa.driver_payout_id = dp.id
    ) fee ON true
    WHERE dp.organization_id = p_organization_id
      AND dp.payment_period_start = p_period_start
      AND dp.payment_period_end = p_period_end
      AND d.subcontractor_id IS NOT NULL
    GROUP BY d.subcontractor_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION subcontractor_settlement_totals(UUID, DATE, DATE) IS
    'Per-subcontractor SUM of driver_payouts. Custom fee columns sum driver_payout_adjustments; total_payable = SUM(net_driver_payout).';
