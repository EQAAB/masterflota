-- Hold audit + release tracking on driver_payouts

ALTER TABLE driver_payouts
  ADD COLUMN IF NOT EXISTS hold_reason VARCHAR(200),
  ADD COLUMN IF NOT EXISTS hold_released_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS hold_released_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS hold_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_driver_payouts_hold
  ON driver_payouts (organization_id, payment_status)
  WHERE payment_status = 'hold';
