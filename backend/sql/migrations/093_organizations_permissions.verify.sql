SELECT
    (SELECT COUNT(*)::int FROM permissions WHERE name = 'organizations.view') AS org_view_perm,
    (SELECT COUNT(*)::int FROM permissions WHERE name = 'organizations.create') AS org_create_perm,
    (SELECT COUNT(*)::int FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.name = 'super_admin' AND p.name = 'organizations.create') AS super_admin_has_create,
    (SELECT COUNT(*)::int FROM role_permissions rp
     JOIN roles r ON r.id = rp.role_id
     JOIN permissions p ON p.id = rp.permission_id
     WHERE r.name = 'admin' AND p.name = 'organizations.create') AS admin_has_create;
