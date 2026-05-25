-- Recurring fee application frequency (weekly vs monthly first week, etc.)

ALTER TABLE driver_recurring_fees
    ADD COLUMN IF NOT EXISTS frequency VARCHAR(30) NOT NULL DEFAULT 'weekly'
        CHECK (frequency IN ('weekly', 'monthly_first_week', 'monthly_last_week', 'one_time'));

UPDATE driver_recurring_fees SET frequency = 'weekly' WHERE frequency IS NULL;
