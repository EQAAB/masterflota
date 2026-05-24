-- Verify migration 074: driver_payout_adjustments and settlement totals columns.
SELECT
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'driver_payout_adjustments'
    ) AS table_exists,
    EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_driver_payout_adj_payout'
    ) AS payout_index_exists,
    EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'subcontractor_settlement_totals'
    ) AS settlement_fn_exists;
