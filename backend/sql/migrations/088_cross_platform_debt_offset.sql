-- Cross-platform debt offset within the same payment week (driver is one entity).

ALTER TABLE driver_payouts
    ADD COLUMN IF NOT EXISTS cross_platform_debt_offset NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS week_debt_platforms TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE driver_payments
    ADD COLUMN IF NOT EXISTS total_debt_offset NUMERIC(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS debt_platforms TEXT[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN driver_payouts.cross_platform_debt_offset IS
    'Amount of same-week negative platform raw net offset by positive platforms before final payout.';

COMMENT ON COLUMN driver_payouts.week_debt_platforms IS
    'Platforms with negative raw_net in this payment week (debt legs).';

COMMENT ON COLUMN driver_payments.total_debt_offset IS
    'Cross-platform debt offset applied when consolidating platform legs for payment.';

COMMENT ON COLUMN driver_payments.debt_platforms IS
    'Platforms that had debt (negative raw net) in the paid week.';
