-- Glovo: store platform net in net_earnings (gross + tips − |fee|), not driver_payout.
-- Rollup sums net_earnings as platformNet; driver_payout remains post-commission row payout.

BEGIN;

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
      COALESCE(NEW.gross_earnings, 0) + COALESCE(NEW.tips, 0) - ABS(COALESCE(NEW.platform_fee, 0))
  END;

  payout := ROUND((
    ni
    - COALESCE(NEW.company_commission, 0)
    - ABS(COALESCE(NEW.daily_cash, 0))
  )::numeric, 2);

  NEW.driver_payout := payout;
  NEW.net_earnings := ni;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION trg_enforce_driver_payout_after_cash() IS
  'Glovo/wolt: net_earnings = platform net (gross+tips−|fee|); driver_payout = net−commission−|cash|. Bolt/bolt_courier/uber/bolt_taxi: preserve app net_earnings.';

COMMIT;
