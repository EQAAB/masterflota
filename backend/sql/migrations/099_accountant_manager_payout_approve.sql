-- Grant payouts.approve to accountant and manager so they can mark driver payouts as paid.

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name = 'payouts.approve'
WHERE r.name IN ('accountant', 'manager')
ON CONFLICT DO NOTHING;
