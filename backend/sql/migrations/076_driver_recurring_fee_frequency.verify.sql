SELECT
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'driver_recurring_fees'
          AND column_name = 'frequency'
    ) AS frequency_column_exists;
