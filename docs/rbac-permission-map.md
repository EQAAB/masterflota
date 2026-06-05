# RBAC permission map

Fleet Manager uses role-based access control: `users.role_id` → `roles` → `role_permissions` → `permissions`.

Permissions are loaded at login and embedded in the JWT (`permissions: string[]`).

## Roles (seeded)

| Role | Purpose |
|------|---------|
| `super_admin` | All permissions |
| `admin` | Full organization access |
| `accountant` | Earnings, payouts, drivers, vehicles, subcontractors (no import delete, user/settings admin) |
| `manager` | Day-to-day ops; no delete drivers/vehicles, no import delete, no payout approve |
| `viewer` | Read-only (`*.view`) |
| `driver` | No fleet permissions (future driver portal) |

## Permissions by module

### imports
- `imports.create` — preview, commit, CSV import
- `imports.view` — import history
- `imports.delete` — revert and hard-delete imports

### payouts
- `payouts.view` — read driver payouts and earnings records
- `payouts.view_all` — list all drivers for a week
- `payouts.adjust` — custom fees, debt adjustments, sync vehicle rent
- `payouts.approve` — mark paid, release hold, bulk approve

### drivers / vehicles / subcontractors
- `drivers.*`, `vehicles.*`, `subcontractors.*` — CRUD and assignments per action name

### settings / admin
- `users.manage` — `/api/users`, Settings → Users
- `roles.manage` — `/api/roles`, view permission matrix
- `settings.manage` — org Glovo import settings PATCH

### dashboard / rentals / reports
- `dashboard.view`, `rentals.view`, `rentals.manage`, `reports.view`

## Tables touched by permission domain

| Permission | Primary tables |
|------------|----------------|
| `imports.create` | `earnings_imports`, `earnings_import_staging`, commit → `earnings_records`, `driver_payouts` |
| `imports.delete` | `earnings_records` (reversal), `earnings_imports` |
| `payouts.view` | `driver_payouts`, `earnings_records` (read) |
| `payouts.adjust` | `driver_payout_adjustments`, `payout_adjustments` |
| `payouts.approve` | `driver_payouts.payment_status`, `driver_payments` |
| `drivers.*` | `drivers`, vehicle assignment |
| `subcontractors.settle` | `subcontractor_payouts`, settlement views |
| `users.manage` | `users` |
| `roles.manage` | `roles`, `role_permissions` |

## API route guards (backend)

| Module | Base permission |
|--------|-----------------|
| `/api/dashboard` | `dashboard.view` |
| `/api/drivers` | `drivers.view`; mutations use `drivers.create/edit/delete/assign_vehicle` |
| `/api/vehicles` | `vehicles.view`; mutations use `vehicles.create/edit/delete/assign` |
| `/api/earnings` | any of `payouts.view`, `imports.view`, `imports.create`, `reports.view` |
| `/api/import` | `imports.create` |
| `/api/subcontractors` | `subcontractors.view` |
| `/api/subcontractor-payouts` | `subcontractors.settle` |
| `/api/rentals` | `rentals.view` or `rentals.manage` |
| `/api/users` | `users.manage` |
| `/api/roles` | `roles.manage` or `users.manage` (list) |

## Migration

Apply [`backend/sql/migrations/091_rbac_permissions.sql`](../backend/sql/migrations/091_rbac_permissions.sql), then [`backend/sql/migrations/092_user_management_extensions.sql`](../backend/sql/migrations/092_user_management_extensions.sql).

Existing users are mapped: `admin` → admin role, `accountant` → accountant, `driver` → driver.

**Breaking:** JWTs issued before deploy are invalid; users must log in again.

## User management extensions (092)

| Table | Purpose |
|-------|---------|
| `audit_logs` | User/role change audit trail (org-scoped reads via `users.manage`) |
| `user_sessions` | Session tracking on login/register (JWT still used; hash stored for future revocation) |
| `settings` | Org key/value settings (`settings.manage`) — coexists with `organizations.settings` JSONB |

### Additional API routes

| Route | Permission |
|-------|------------|
| `GET /api/audit-logs` | `users.manage` |
| `GET/PUT /api/settings` | `settings.manage` |
| `POST/PATCH/DELETE /api/roles` | `roles.manage` (custom roles only for mutations) |
| `GET/DELETE /api/auth/sessions` | Authenticated user (own sessions) |
