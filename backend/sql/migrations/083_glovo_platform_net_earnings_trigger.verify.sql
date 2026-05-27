-- Trigger stores platform net, not driver payout, for Glovo-shaped rows
SELECT pg_get_functiondef('trg_enforce_driver_payout_after_cash()'::regprocedure)
  LIKE '%NEW.net_earnings := ni%';
