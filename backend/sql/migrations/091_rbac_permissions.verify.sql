SELECT
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'permissions') AS permissions_table,
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'roles') AS roles_table,
    (SELECT COUNT(*)::int FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = 'role_permissions') AS role_permissions_table,
    (SELECT COUNT(*)::int FROM permissions) AS permission_count,
    (SELECT COUNT(*)::int FROM roles) AS role_count,
    (SELECT COUNT(*)::int FROM roles WHERE name = 'driver') AS driver_role,
    (SELECT COUNT(*)::int FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role_id') AS users_role_id_col,
    (SELECT COUNT(*)::int FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') AS users_role_col_gone,
    (SELECT COUNT(*)::int FROM users WHERE role_id IS NULL) AS users_without_role_id,
    (SELECT COUNT(*)::int FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.name = 'accountant' AND p.name = 'imports.delete') AS accountant_has_import_delete;
