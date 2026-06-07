SELECT
    (SELECT COUNT(*)::int
     FROM users u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE r.name = 'super_admin' AND u.organization_id IS NOT NULL) AS org_bound_super_admin_count,
    (SELECT COUNT(*)::int
     FROM pg_trigger
     WHERE tgname = 'trg_users_org_role_consistency') AS trigger_exists;
