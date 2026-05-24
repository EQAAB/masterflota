-- Post-deploy checks for migration 072 (Bolt net_income not overwritten by cash trigger).
-- Replace driver name / week as needed.

-- 1) Trigger function contains Bolt early return
SELECT
  CASE
    WHEN pg_get_functiondef('trg_enforce_driver_payout_after_cash()'::regprocedure)
      LIKE '%bolt_courier%'
      AND pg_get_functiondef('trg_enforce_driver_payout_after_cash()'::regprocedure)
      LIKE '%RETURN NEW%'
    THEN 'ok'
    ELSE 'fail'
  END AS trigger_has_bolt_skip;

-- 2) Example: net should NOT equal (income+tips stored) - ABS(daily_cash) when net is correct platform net
-- After re-import, rows where ABS(net_earnings - (gross_earnings + tips - ABS(daily_cash))) < 0.01
-- and net_earnings > 500 indicate old bug pattern (adjust threshold per org).
SELECT
  er.driver_id,
  d.first_name,
  d.last_name,
  er.net_earnings,
  er.gross_earnings,
  er.tips,
  er.daily_cash,
  ROUND((COALESCE(er.gross_earnings, 0) + COALESCE(er.tips, 0) - ABS(COALESCE(er.daily_cash, 0)))::numeric, 2)
    AS legacy_trigger_net
FROM earnings_records er
JOIN drivers d ON d.id = er.driver_id
WHERE er.platform IN ('bolt', 'bolt_courier')
  AND ABS(
    er.net_earnings
    - (COALESCE(er.gross_earnings, 0) + COALESCE(er.tips, 0) - ABS(COALESCE(er.daily_cash, 0)))
  ) < 0.02
  AND er.net_earnings < 500
ORDER BY er.trip_date DESC
LIMIT 20;

-- 3) Payout roll-up sanity (bolt platform): net_income ~ SUM(earnings net); raw_net ~ net - commission - cash - rent
-- SELECT dp.net_income, dp.company_commission, dp.total_daily_cash, dp.raw_net_amount, dp.net_driver_payout
-- FROM driver_payouts dp
-- WHERE dp.platform = 'bolt'
-- ORDER BY dp.payment_period_end DESC
-- LIMIT 10;
