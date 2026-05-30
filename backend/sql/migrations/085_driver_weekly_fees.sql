-- Recurring fees materialized once per driver per payment week (not per platform payout).

CREATE TABLE IF NOT EXISTS driver_weekly_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    payment_period_start DATE NOT NULL,
    payment_period_end DATE NOT NULL,
    recurring_fee_id UUID NOT NULL REFERENCES driver_recurring_fees(id) ON DELETE CASCADE,
    fee_name VARCHAR(100) NOT NULL,
    fee_type VARCHAR(20) NOT NULL CHECK (fee_type IN ('deduction', 'addition')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_driver_weekly_fees_driver_week_fee
        UNIQUE (organization_id, driver_id, payment_period_start, payment_period_end, recurring_fee_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_weekly_fees_driver_period
    ON driver_weekly_fees (driver_id, payment_period_start, payment_period_end);

CREATE INDEX IF NOT EXISTS idx_driver_weekly_fees_org_driver
    ON driver_weekly_fees (organization_id, driver_id);

-- Backfill from existing recurring adjustments (one row per driver/week/recurring_fee_id, prefer anchor payout).
WITH ranked AS (
    SELECT
        dp.organization_id,
        dp.driver_id,
        dp.payment_period_start,
        dp.payment_period_end,
        pa.recurring_fee_id,
        pa.fee_name,
        pa.fee_type,
        pa.amount,
        ROW_NUMBER() OVER (
            PARTITION BY
                dp.organization_id,
                dp.driver_id,
                dp.payment_period_start,
                dp.payment_period_end,
                pa.recurring_fee_id
            ORDER BY
                CASE dp.platform
                    WHEN 'glovo' THEN 1
                    WHEN 'uber' THEN 2
                    WHEN 'bolt_taxi' THEN 3
                    WHEN 'bolt' THEN 4
                    ELSE 5
                END,
                dp.id
        ) AS rn
    FROM driver_payout_adjustments pa
    INNER JOIN driver_payouts dp ON dp.id = pa.driver_payout_id
    WHERE pa.source = 'recurring'
      AND pa.recurring_fee_id IS NOT NULL
)
INSERT INTO driver_weekly_fees (
    organization_id,
    driver_id,
    payment_period_start,
    payment_period_end,
    recurring_fee_id,
    fee_name,
    fee_type,
    amount
)
SELECT
    organization_id,
    driver_id,
    payment_period_start,
    payment_period_end,
    recurring_fee_id,
    fee_name,
    fee_type,
    amount
FROM ranked
WHERE rn = 1
ON CONFLICT (organization_id, driver_id, payment_period_start, payment_period_end, recurring_fee_id)
DO NOTHING;

DELETE FROM driver_payout_adjustments WHERE source = 'recurring';

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
    WITH anchor_payouts AS (
        SELECT DISTINCT ON (dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end)
            dp.id AS payout_id,
            dp.driver_id,
            dp.organization_id,
            dp.payment_period_start,
            dp.payment_period_end
        FROM driver_payouts dp
        WHERE dp.organization_id = p_organization_id
          AND dp.payment_period_start = p_period_start
          AND dp.payment_period_end = p_period_end
        ORDER BY
            dp.organization_id,
            dp.driver_id,
            dp.payment_period_start,
            dp.payment_period_end,
            CASE dp.platform
                WHEN 'glovo' THEN 1
                WHEN 'uber' THEN 2
                WHEN 'bolt_taxi' THEN 3
                WHEN 'bolt' THEN 4
                ELSE 5
            END,
            dp.id
    ),
    weekly_fee_totals AS (
        SELECT
            dwf.organization_id,
            dwf.driver_id,
            dwf.payment_period_start,
            dwf.payment_period_end,
            COALESCE(SUM(CASE WHEN dwf.fee_type = 'deduction' THEN dwf.amount ELSE 0 END), 0) AS deductions,
            COALESCE(SUM(CASE WHEN dwf.fee_type = 'addition' THEN dwf.amount ELSE 0 END), 0) AS additions
        FROM driver_weekly_fees dwf
        WHERE dwf.organization_id = p_organization_id
          AND dwf.payment_period_start = p_period_start
          AND dwf.payment_period_end = p_period_end
        GROUP BY dwf.organization_id, dwf.driver_id, dwf.payment_period_start, dwf.payment_period_end
    )
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
           ROUND(
             (
               COALESCE(SUM(manual_fee.deductions), 0)
               + COALESCE(SUM(CASE WHEN ap.payout_id IS NOT NULL THEN wf.deductions ELSE 0 END), 0)
             )::numeric,
             2
           ),
           ROUND(
             (
               COALESCE(SUM(manual_fee.additions), 0)
               + COALESCE(SUM(CASE WHEN ap.payout_id IS NOT NULL THEN wf.additions ELSE 0 END), 0)
             )::numeric,
             2
           ),
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
          AND pa.source = 'manual'
    ) manual_fee ON true
    LEFT JOIN anchor_payouts ap ON ap.payout_id = dp.id
    LEFT JOIN weekly_fee_totals wf
      ON wf.organization_id = dp.organization_id
     AND wf.driver_id = dp.driver_id
     AND wf.payment_period_start = dp.payment_period_start
     AND wf.payment_period_end = dp.payment_period_end
    WHERE dp.organization_id = p_organization_id
      AND dp.payment_period_start = p_period_start
      AND dp.payment_period_end = p_period_end
      AND d.subcontractor_id IS NOT NULL
    GROUP BY d.subcontractor_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION subcontractor_settlement_totals(UUID, DATE, DATE) IS
    'Per-subcontractor SUM of driver_payouts. Manual fees per payout row; recurring fees once per driver/week via driver_weekly_fees on anchor payout.';

COMMENT ON TABLE driver_weekly_fees IS
    'Recurring fees materialized once per driver per payment week; deducted on anchor platform payout only.';
