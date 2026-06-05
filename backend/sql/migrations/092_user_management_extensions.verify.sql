SELECT
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'audit_logs') AS audit_logs_table,
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'user_sessions') AS user_sessions_table,
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'settings') AS settings_table,
    (SELECT COUNT(*)::int FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'updated_at') AS roles_updated_at_col,
    (SELECT character_maximum_length::int FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'roles' AND column_name = 'name') AS roles_name_max_len;
