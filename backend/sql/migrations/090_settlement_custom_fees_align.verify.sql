-- Verify migration 090: subcontractor_settlement_totals exposes custom fee columns.
SELECT
    EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND p.proname = 'subcontractor_settlement_totals'
    ) AS settlement_fn_exists,
    EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        JOIN pg_type t ON t.oid = p.prorettype
        WHERE n.nspname = 'public'
          AND p.proname = 'subcontractor_settlement_totals'
          AND t.typname = 'record'
    ) AS returns_table,
    (
        SELECT COUNT(*)::int
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        CROSS JOIN LATERAL unnest(p.proargtypes) WITH ORDINALITY AS args(oid, ord)
        JOIN pg_type at ON at.oid = args.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'subcontractor_settlement_totals'
    ) AS arg_count;
