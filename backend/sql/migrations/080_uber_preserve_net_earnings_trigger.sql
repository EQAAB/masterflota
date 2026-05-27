-- Uber taxi: net_earnings and driver_payout are set at commit (platform net + fleet formula).
-- Do not overwrite with Glovo-style row trigger (same as Bolt weekly).

BEGIN;

CREATE OR REPLACE FUNCTION trg_enforce_driver_payout_after_cash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ni numeric;
  payout numeric;
BEGIN
  IF NEW.platform IN ('bolt', 'bolt_courier', 'uber') THEN
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
  'Glovo-style rows: set net_earnings and driver_payout from ladder net minus commission and |cash|. Bolt/bolt_courier/uber: preserve application values; period payout in rollup.';

COMMIT;
