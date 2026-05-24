-- Bolt weekly: net_earnings is pre-parsed (adjusted without VAT + courier tips without VAT).
-- Do not overwrite with row-level (gross + tips) - commission - |cash| (that is period payout math).

BEGIN;

CREATE OR REPLACE FUNCTION trg_enforce_driver_payout_after_cash()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  ni numeric;
  payout numeric;
BEGIN
  IF NEW.platform IN ('bolt', 'bolt_courier') THEN
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
  'Glovo-style rows: set net_earnings and driver_payout from ladder net minus commission and |cash|. Bolt/bolt_courier: preserve application net_earnings; period payout in rollup.';

COMMIT;
