-- RBAC: permissions, roles, role_permissions; migrate users.role -> users.role_id

CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_system_role BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);

INSERT INTO permissions (name, module, description) VALUES
    ('imports.create', 'imports', 'Upload and process earnings imports'),
    ('imports.view', 'imports', 'View import history'),
    ('imports.delete', 'imports', 'Delete and revert imports'),
    ('payouts.view', 'payouts', 'View driver payouts'),
    ('payouts.approve', 'payouts', 'Approve and pay drivers'),
    ('payouts.view_all', 'payouts', 'View all drivers payouts'),
    ('payouts.adjust', 'payouts', 'Add adjustments to payouts'),
    ('drivers.create', 'drivers', 'Create new drivers'),
    ('drivers.view', 'drivers', 'View driver profiles'),
    ('drivers.edit', 'drivers', 'Edit driver profiles'),
    ('drivers.delete', 'drivers', 'Delete drivers'),
    ('drivers.assign_vehicle', 'drivers', 'Assign vehicles to drivers'),
    ('vehicles.create', 'vehicles', 'Add new vehicles'),
    ('vehicles.view', 'vehicles', 'View vehicle list'),
    ('vehicles.edit', 'vehicles', 'Edit vehicle details'),
    ('vehicles.delete', 'vehicles', 'Remove vehicles'),
    ('vehicles.assign', 'vehicles', 'Assign vehicles to drivers'),
    ('subcontractors.create', 'subcontractors', 'Create subcontractors'),
    ('subcontractors.view', 'subcontractors', 'View subcontractors'),
    ('subcontractors.edit', 'subcontractors', 'Edit subcontractors'),
    ('subcontractors.settle', 'subcontractors', 'Generate settlements'),
    ('users.manage', 'users', 'Manage users and permissions'),
    ('roles.manage', 'roles', 'Manage roles and permissions'),
    ('settings.manage', 'settings', 'Manage system settings'),
    ('dashboard.view', 'dashboard', 'View dashboard'),
    ('rentals.view', 'rentals', 'View rental module'),
    ('rentals.manage', 'rentals', 'Manage bookings, customers, and pricing'),
    ('reports.view', 'reports', 'View earnings reports')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (name, description, is_system_role, is_default) VALUES
    ('super_admin', 'Full system access', true, false),
    ('admin', 'Organization admin with full access', true, false),
    ('manager', 'Manager - can manage day-to-day operations', true, false),
    ('accountant', 'Can view and process earnings and payouts', true, false),
    ('viewer', 'Read-only access', true, true),
    ('driver', 'Driver portal (no fleet management access)', true, false)
ON CONFLICT (name) DO NOTHING;

-- super_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- admin: all except none (full org)
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'admin'
ON CONFLICT DO NOTHING;

-- accountant: current accountant behavior
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'imports.create', 'imports.view',
    'payouts.view', 'payouts.view_all', 'payouts.adjust',
    'drivers.create', 'drivers.view', 'drivers.edit', 'drivers.delete', 'drivers.assign_vehicle',
    'vehicles.create', 'vehicles.view', 'vehicles.edit', 'vehicles.delete', 'vehicles.assign',
    'subcontractors.create', 'subcontractors.view', 'subcontractors.edit', 'subcontractors.settle',
    'dashboard.view', 'rentals.view', 'rentals.manage', 'reports.view'
)
WHERE r.name = 'accountant'
ON CONFLICT DO NOTHING;

-- manager: ops without delete-import, approve, users/roles/settings, driver/vehicle delete
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'imports.create', 'imports.view',
    'payouts.view', 'payouts.view_all', 'payouts.adjust',
    'drivers.create', 'drivers.view', 'drivers.edit', 'drivers.assign_vehicle',
    'vehicles.create', 'vehicles.view', 'vehicles.edit', 'vehicles.assign',
    'subcontractors.view', 'subcontractors.settle',
    'dashboard.view', 'rentals.view', 'rentals.manage', 'reports.view'
)
WHERE r.name = 'manager'
ON CONFLICT DO NOTHING;

-- viewer: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r
JOIN permissions p ON p.name IN (
    'imports.view',
    'payouts.view', 'payouts.view_all',
    'drivers.view',
    'vehicles.view',
    'subcontractors.view',
    'dashboard.view', 'rentals.view', 'reports.view'
)
WHERE r.name = 'viewer'
ON CONFLICT DO NOTHING;

-- driver: no fleet permissions (future portal)

ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES roles(id);

UPDATE users u
SET role_id = r.id
FROM roles r
WHERE u.role_id IS NULL
  AND r.name = u.role;

UPDATE users u
SET role_id = (SELECT id FROM roles WHERE name = 'viewer' LIMIT 1)
WHERE u.role_id IS NULL;

ALTER TABLE users ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP COLUMN IF EXISTS role;

CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
