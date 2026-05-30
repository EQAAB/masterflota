SELECT
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'driver_weekly_fees'
    ) AS weekly_fees_table_exists,
    (
        SELECT COUNT(*)::int
        FROM driver_payout_adjustments
        WHERE source = 'recurring'
    ) AS recurring_adjustment_rows_remaining,
    (
        SELECT COUNT(*)::int
        FROM (
            SELECT driver_id, payment_period_start, fee_name, COUNT(*) AS c
            FROM driver_payout_adjustments pa
            JOIN driver_payouts dp ON pa.driver_payout_id = dp.id
            WHERE pa.source = 'recurring'
            GROUP BY driver_id, payment_period_start, fee_name
            HAVING COUNT(*) > 1
        ) dup
    ) AS duplicate_recurring_adjustment_groups;
