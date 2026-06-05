-- Bootstrap the first platform super_admin user (run once after migrations 091 + 093).
--
-- 1. Generate a bcrypt password hash (Node.js, from backend/ directory):
--    node -e "require('bcrypt').hash('YourSecurePassword', 10).then(console.log)"
--
-- 2. Replace placeholders below, then run this script against your database.

INSERT INTO users (
    organization_id,
    email,
    password_hash,
    first_name,
    last_name,
    role_id,
    is_active
)
SELECT
    NULL,
    'owner@example.com',
    '$2b$10$REPLACE_WITH_BCRYPT_HASH',
    'System',
    'Owner',
    r.id,
    true
FROM roles r
WHERE r.name = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM users u
    INNER JOIN roles r2 ON r2.id = u.role_id
    WHERE r2.name = 'super_admin'
  );
