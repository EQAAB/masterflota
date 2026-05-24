-- Find Bolt payouts where net_driver_payout was clamped to 0 but canonical raw net is negative.
-- After fix + re-import/recompute, this should return 0 rows.

SELECT
  dp.id,
  dp.driver_id,
  dp.net_driver_payout,
  dp.raw_net_amount,
  dp.payment_status,
  dp.total_net_earnings,
  dp.company_commission,
  dp.total_daily_cash,
  ROUND((
    COALESCE(dp.total_net_earnings, 0)
    - COALESCE(dp.company_commission, 0)
    - ABS(COALESCE(dp.total_daily_cash, 0))
    - ABS(COALESCE(dp.account_opening_fee, 0))
    - COALESCE(dp.vehicle_rental_fee, 0)
  )::numeric, 2) AS expected_raw_net
FROM driver_payouts dp
WHERE dp.platform = 'bolt'
  AND COALESCE(dp.net_driver_payout, 0) = 0
  AND ROUND((
        COALESCE(dp.total_net_earnings, 0)
        - COALESCE(dp.company_commission, 0)
        - ABS(COALESCE(dp.total_daily_cash, 0))
        - ABS(COALESCE(dp.account_opening_fee, 0))
        - COALESCE(dp.vehicle_rental_fee, 0)
      )::numeric, 2) < -0.01;
