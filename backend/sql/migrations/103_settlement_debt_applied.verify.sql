-- Verify migration 103: settlement totals expose raw net and debt applied.
SELECT
    EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'subcontractor_settlement_totals'
          AND pg_get_function_result(p.oid) LIKE '%total_raw_net%'
          AND pg_get_function_result(p.oid) LIKE '%total_debt_applied%'
    ) AS settlement_totals_has_debt_columns;
