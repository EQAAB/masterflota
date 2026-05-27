-- Restore platform net on Uber earnings rows where the old trigger set net_earnings = driver_payout.
-- Prerequisite: 080_uber_preserve_net_earnings_trigger.sql (stops new corruption).
--
-- After this migration, recompute driver_payouts per payment week:
--   cd backend
--   npx ts-node --transpile-only scripts/repair-driver-payout-rollups.ts <orgId> uber <weekStart> <weekEnd>
--
-- Example validation (Rahmat Ullah): net_income ≈ 1353.23, net_driver_payout ≈ 990.05

BEGIN;

UPDATE earnings_records er
SET net_earnings = ROUND(
  (
    COALESCE(er.gross_earnings, 0) + COALESCE(er.tips, 0)
    + CASE
        WHEN COALESCE(er.platform_fee, 0) < 0 THEN er.platform_fee
        ELSE -ABS(COALESCE(er.platform_fee, 0))
      END
  )::numeric,
  2
)
WHERE er.platform = 'uber'
  AND er.gross_earnings IS NOT NULL
  AND er.driver_payout IS NOT NULL
  AND ABS(er.net_earnings - er.driver_payout) < 0.02;

COMMIT;
