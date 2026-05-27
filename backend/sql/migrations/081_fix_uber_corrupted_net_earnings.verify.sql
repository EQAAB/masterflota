-- Rows still conflating platform net with driver payout (should return 0 rows after fix).
SELECT er.id, er.net_earnings, er.driver_payout
FROM earnings_records er
WHERE er.platform = 'uber'
  AND er.gross_earnings IS NOT NULL
  AND er.driver_payout IS NOT NULL
  AND ABS(er.net_earnings - er.driver_payout) < 0.02;

-- Rahmat Ullah spot-check (adjust name if needed).
SELECT d.first_name,
       d.last_name,
       er.gross_earnings,
       er.platform_fee,
       er.net_earnings,
       er.driver_payout,
       dp.net_income,
       dp.net_driver_payout
FROM earnings_records er
JOIN drivers d ON d.id = er.driver_id
LEFT JOIN driver_payouts dp
  ON dp.driver_id = er.driver_id
 AND dp.platform = 'uber'
 AND dp.payment_period_start <= er.trip_date
 AND dp.payment_period_end >= er.trip_date
WHERE er.platform = 'uber'
  AND d.first_name ILIKE '%Rahmat%';
