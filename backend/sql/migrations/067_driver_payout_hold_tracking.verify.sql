-- Post-067 checks (non-empty result = issue)
SELECT 'hold_reason column missing' AS issue
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'driver_payouts'
    AND column_name = 'hold_reason'
);

SELECT 'hold_released_by column missing' AS issue
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'driver_payouts'
    AND column_name = 'hold_released_by'
);

SELECT 'hold_released_at column missing' AS issue
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'driver_payouts'
    AND column_name = 'hold_released_at'
);

SELECT 'hold_notes column missing' AS issue
WHERE NOT EXISTS (
  SELECT 1 FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'driver_payouts'
    AND column_name = 'hold_notes'
);
