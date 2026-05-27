-- Bolt Taxi weekly import: bolt_taxi platform, driver UUID, earnings metadata, payout platform.

BEGIN;

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS bolt_taxi_driver_uuid UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_drivers_org_bolt_taxi_uuid
  ON drivers (organization_id, bolt_taxi_driver_uuid)
  WHERE bolt_taxi_driver_uuid IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_bolt_taxi_uuid ON drivers (bolt_taxi_driver_uuid);

ALTER TABLE earnings_records
  ADD COLUMN IF NOT EXISTS platform_metadata JSONB NOT NULL DEFAULT '{}';

ALTER TABLE earnings_imports
  DROP CONSTRAINT IF EXISTS earnings_imports_platform_check;

ALTER TABLE earnings_imports
  ADD CONSTRAINT earnings_imports_platform_check
  CHECK (platform IN ('uber', 'bolt', 'glovo', 'bolt_courier', 'wolt_courier', 'bolt_taxi'));

ALTER TABLE driver_payouts
  DROP CONSTRAINT IF EXISTS chk_driver_payouts_platform;

ALTER TABLE driver_payouts
  ADD CONSTRAINT chk_driver_payouts_platform
  CHECK (platform IN ('glovo', 'bolt', 'uber', 'bolt_taxi'));

CREATE OR REPLACE FUNCTION trg_enforce_driver_payout_after_cash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ni numeric;
  payout numeric;
BEGIN
  IF NEW.platform IN ('bolt', 'bolt_courier', 'uber', 'bolt_taxi') THEN
    NEW.driver_payout := COALESCE(NEW.driver_payout, 0);
    RETURN NEW;
  END IF;

  ni := CASE
    WHEN COALESCE(NEW.platform_fee, 0) < 0 THEN
      COALESCE(NEW.gross_earnings, 0) + COALESCE(NEW.tips, 0) + COALESCE(NEW.platform_fee, 0)
    ELSE
      COALESCE(NEW.gross_earnings, 0) + COALESCE(NEW.tips, 0) - COALESCE(NEW.platform_fee, 0)
  END;

  payout := ROUND((
    ni
    - COALESCE(NEW.company_commission, 0)
    - ABS(COALESCE(NEW.daily_cash, 0))
  )::numeric, 2);

  NEW.driver_payout := payout;
  NEW.net_earnings := payout;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_enforce_driver_payout_after_cash() IS
  'Glovo-style rows: set net_earnings and driver_payout from ladder net minus commission and |cash|. Bolt/bolt_courier/uber/bolt_taxi: preserve application values; period payout in rollup.';

COMMIT;
