SELECT
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'driver_recurring_fees'
    ) AS recurring_table_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'driver_payout_adjustments'
          AND column_name = 'source'
    ) AS adjustment_source_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'driver_payout_adjustments'
          AND column_name = 'recurring_fee_id'
    ) AS adjustment_recurring_fk_exists;
