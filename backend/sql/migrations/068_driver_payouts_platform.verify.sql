-- Duplicate (driver, platform, week) keys
SELECT organization_id, driver_id, platform, payment_period_start, payment_period_end, COUNT(*) AS c
FROM driver_payouts
GROUP BY organization_id, driver_id, platform, payment_period_start, payment_period_end
HAVING COUNT(*) > 1;

-- Invalid platform values
SELECT id, platform FROM driver_payouts WHERE platform NOT IN ('glovo', 'bolt');
