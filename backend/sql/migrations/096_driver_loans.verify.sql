-- Verify migration 096: driver loans tables and payout adjustment loan source.

SELECT
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'driver_loans'
    ) AS driver_loans_table_exists,
    EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'driver_loan_repayments'
    ) AS driver_loan_repayments_table_exists,
    EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'driver_payout_adjustments'
          AND column_name = 'loan_repayment_id'
    ) AS adjustment_loan_repayment_fk_exists,
    EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE schemaname = 'public'
          AND indexname = 'uq_driver_loans_one_active'
    ) AS one_active_loan_index_exists;
