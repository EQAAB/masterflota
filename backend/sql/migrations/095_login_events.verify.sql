SELECT
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'login_events') AS login_events_table,
    (SELECT COUNT(*)::int FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'login_events' AND column_name = 'event_type') AS event_type_col,
    (SELECT COUNT(*)::int FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = 'idx_login_events_org_created') AS org_created_idx;
