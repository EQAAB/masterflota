-- Verify accountant and manager roles have payouts.approve after migration 099.
SELECT r.name AS role_name, p.name AS permission_name
FROM roles r
JOIN role_permissions rp ON rp.role_id = r.id
JOIN permissions p ON p.id = rp.permission_id
WHERE r.name IN ('accountant', 'manager')
  AND p.name = 'payouts.approve'
ORDER BY r.name;

-- Expect exactly 2 rows (accountant + manager).
