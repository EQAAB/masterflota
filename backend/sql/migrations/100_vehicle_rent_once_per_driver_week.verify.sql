-- After 100: rent is charged on at most one open payout per driver/week.
-- Expect 0 rows: multiple open legs with vehicle_rental_fee > 0 in the same period.

SELECT
  dp.organization_id,
  dp.driver_id,
  dp.payment_period_start,
  dp.payment_period_end,
  COUNT(*) FILTER (WHERE COALESCE(dp.vehicle_rental_fee, 0) > 0.02) AS legs_with_rent
FROM driver_payouts dp
WHERE dp.payment_status NOT IN ('paid', 'approved')
GROUP BY dp.organization_id, dp.driver_id, dp.payment_period_start, dp.payment_period_end
HAVING COUNT(*) FILTER (WHERE COALESCE(dp.vehicle_rental_fee, 0) > 0.02) > 1;
