-- One driver_payouts row per (driver, platform, payment week).

ALTER TABLE driver_payouts
  ADD COLUMN IF NOT EXISTS platform VARCHAR(20) NOT NULL DEFAULT 'glovo';

ALTER TABLE driver_payouts
  DROP CONSTRAINT IF EXISTS chk_driver_payouts_platform;

ALTER TABLE driver_payouts
  ADD CONSTRAINT chk_driver_payouts_platform
  CHECK (platform IN ('glovo', 'bolt'));

-- Bolt-only periods (earnings_records bolt_courier, no glovo in same week)
UPDATE driver_payouts dp
SET platform = 'bolt'
WHERE dp.platform = 'glovo'
  AND EXISTS (
    SELECT 1 FROM earnings_records er
    INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = dp.organization_id
    WHERE er.driver_id = dp.driver_id
      AND er.platform = 'bolt_courier'
      AND er.trip_date >= dp.payment_period_start
      AND er.trip_date <= dp.payment_period_end
  )
  AND NOT EXISTS (
    SELECT 1 FROM earnings_records er
    INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = dp.organization_id
    WHERE er.driver_id = dp.driver_id
      AND er.platform = 'glovo'
      AND er.trip_date >= dp.payment_period_start
      AND er.trip_date <= dp.payment_period_end
  );

-- Dual-platform weeks: split combined row into glovo + bolt rows from earnings_records aggregates
DO $$
DECLARE
  r RECORD;
  agg RECORD;
BEGIN
  FOR r IN
    SELECT dp.id AS old_id,
           dp.organization_id,
           dp.driver_id,
           dp.payment_period_start,
           dp.payment_period_end,
           dp.platform_id,
           dp.payment_status,
           dp.payment_date,
           dp.payment_method,
           dp.transaction_ref,
           dp.notes,
           dp.hold_reason,
           dp.hold_released_by,
           dp.hold_released_at,
           dp.hold_notes,
           dp.subcontractor_payout_id
    FROM driver_payouts dp
    WHERE EXISTS (
      SELECT 1 FROM earnings_records er
      INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = dp.organization_id
      WHERE er.driver_id = dp.driver_id AND er.platform = 'glovo'
        AND er.trip_date >= dp.payment_period_start AND er.trip_date <= dp.payment_period_end
    )
    AND EXISTS (
      SELECT 1 FROM earnings_records er
      INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = dp.organization_id
      WHERE er.driver_id = dp.driver_id AND er.platform = 'bolt_courier'
        AND er.trip_date >= dp.payment_period_start AND er.trip_date <= dp.payment_period_end
    )
  LOOP
    -- Glovo row: update existing payout
    SELECT
      COALESCE(SUM(er.gross_earnings), 0) AS income,
      COALESCE(SUM(er.tips), 0) AS tips,
      COALESCE(SUM(ABS(er.platform_fee)), 0) AS fee_abs,
      COALESCE(SUM(er.net_earnings), 0) AS net_earnings,
      COALESCE(SUM(er.daily_cash), 0) AS daily_cash,
      COALESCE(SUM(ABS(COALESCE(er.account_opening_fee, 0))), 0) AS account_opening
    INTO agg
    FROM earnings_records er
    INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = r.organization_id
    WHERE er.driver_id = r.driver_id AND er.platform = 'glovo'
      AND er.trip_date >= r.payment_period_start AND er.trip_date <= r.payment_period_end;

    UPDATE driver_payouts
    SET platform = 'glovo',
        income = agg.income,
        tips = agg.tips,
        total_platform_fees = agg.fee_abs,
        total_net_earnings = agg.net_earnings,
        net_income = agg.net_earnings,
        gross_income = agg.income + agg.tips,
        total_daily_cash = agg.daily_cash,
        account_opening_fee = agg.account_opening,
        commission_base = agg.net_earnings
    WHERE id = r.old_id;

    -- Bolt row: insert if not already present
    IF NOT EXISTS (
      SELECT 1 FROM driver_payouts dp2
      WHERE dp2.organization_id = r.organization_id
        AND dp2.driver_id = r.driver_id
        AND dp2.platform = 'bolt'
        AND dp2.payment_period_start = r.payment_period_start
        AND dp2.payment_period_end = r.payment_period_end
    ) THEN
      SELECT
        COALESCE(SUM(er.gross_earnings), 0) AS income,
        COALESCE(SUM(er.tips), 0) AS tips,
        0::numeric AS fee_abs,
        COALESCE(SUM(er.net_earnings), 0) AS net_earnings,
        COALESCE(SUM(er.daily_cash), 0) AS daily_cash,
        0::numeric AS account_opening
      INTO agg
      FROM earnings_records er
      INNER JOIN earnings_imports ei ON ei.id = er.import_id AND ei.organization_id = r.organization_id
      WHERE er.driver_id = r.driver_id AND er.platform = 'bolt_courier'
        AND er.trip_date >= r.payment_period_start AND er.trip_date <= r.payment_period_end;

      INSERT INTO driver_payouts (
        organization_id, driver_id, platform, platform_id,
        payment_period_start, payment_period_end,
        income, tips, total_platform_fees, total_net_earnings,
        total_daily_cash, account_opening_fee,
        company_commission, raw_net_amount, net_driver_payout,
        debt_amount, debt_applied_amount, remaining_debt_amount,
        vehicle_rental_fee, payment_status,
        gross_income, net_income, commission_base, commission_rate, commission_base_type,
        payment_date, payment_method, transaction_ref, notes,
        hold_reason, hold_released_by, hold_released_at, hold_notes,
        subcontractor_payout_id
      )
      SELECT
        r.organization_id,
        r.driver_id,
        'bolt',
        d.bolt_courier_id,
        r.payment_period_start,
        r.payment_period_end,
        agg.income,
        agg.tips,
        agg.fee_abs,
        agg.net_earnings,
        agg.daily_cash,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        calculate_rental_fee(r.organization_id, r.driver_id, r.payment_period_start, r.payment_period_end),
        r.payment_status,
        agg.income + agg.tips,
        agg.net_earnings,
        agg.net_earnings,
        0,
        'net_income',
        r.payment_date,
        r.payment_method,
        r.transaction_ref,
        r.notes,
        r.hold_reason,
        r.hold_released_by,
        r.hold_released_at,
        r.hold_notes,
        r.subcontractor_payout_id
      FROM drivers d
      WHERE d.id = r.driver_id;
    END IF;
  END LOOP;
END $$;

DROP INDEX IF EXISTS idx_driver_payouts_org_driver_period;

CREATE UNIQUE INDEX IF NOT EXISTS idx_driver_payouts_org_driver_platform_period
  ON driver_payouts (organization_id, driver_id, platform, payment_period_start, payment_period_end);

CREATE INDEX IF NOT EXISTS idx_driver_payouts_platform
  ON driver_payouts (organization_id, platform, payment_period_start, payment_period_end);
