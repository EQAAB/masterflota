SELECT proname, prosrc
FROM pg_proc
WHERE proname = 'trg_enforce_driver_payout_after_cash'
  AND prosrc NOT LIKE '%uber%';
