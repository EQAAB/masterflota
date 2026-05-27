-- Allow Uber taxi weekly imports on driver_payouts.platform.

ALTER TABLE driver_payouts
  DROP CONSTRAINT IF EXISTS chk_driver_payouts_platform;

ALTER TABLE driver_payouts
  ADD CONSTRAINT chk_driver_payouts_platform
  CHECK (platform IN ('glovo', 'bolt', 'uber'));
