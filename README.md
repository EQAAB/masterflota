# Fleet Manager

A full-stack **Fleet & Driver Management System** for managing drivers, documents, commissions, and fleet overview. Built with React (Vite) and Node.js (Express) with PostgreSQL.

---

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [Build](#build)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Project Description

Fleet Manager helps organizations:

- **Authenticate** users (login only; no public registration) with JWT and role-based access (super_admin, admin, accountant, driver).
- **Manage drivers**: list, add, edit, soft-delete, view profile and activity.
- **Handle documents**: upload ID, license, contract files; verify, download, delete.
- **Configure commission**: percentage, fixed amount, or hybrid per driver.
- **View dashboard**: fleet stats, driver status, earnings, document stats, recent activity.
- **Log out** with confirmation.

---

## Tech Stack

| Layer      | Technologies |
| ---------- | ------------ |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS, React Router, Zustand, React Query, Axios, Recharts |
| **Backend**  | Node.js, Express, TypeScript, PostgreSQL, JWT, bcrypt, Multer |
| **Database** | PostgreSQL |

---

## Project Structure

```
Fleet Manager/
├── frontend/                 # React (Vite) SPA
│   ├── public/
│   ├── src/
│   │   ├── api/              # API clients (drivers, auth, dashboard, documents)
│   │   ├── components/       # UI, dashboard, drivers, documents
│   │   ├── lib/              # api.ts (axios instance)
│   │   ├── pages/            # auth, dashboard, drivers, settings
│   │   ├── store/            # authStore (Zustand)
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/           # env, multer
│   │   ├── db/                # pool (PostgreSQL)
│   │   ├── middleware/       # auth (JWT, roles)
│   │   ├── modules/
│   │   │   ├── auth/         # login
│   │   │   ├── dashboard/    # stats, activity, documents
│   │   │   ├── documents/    # upload, list, verify, download
│   │   │   └── drivers/      # CRUD, activity, notes, soft delete
│   │   ├── app.ts
│   │   └── index.ts
│   ├── sql/
│   │   ├── schema.sql        # Full schema
│   │   ├── views.sql
│   │   └── migrations/       # 001, 002, 003...
│   ├── uploads/              # Uploaded files (create if missing)
│   ├── .env                  # Not committed; see Environment Setup
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **npm** or **yarn** or **pnpm**
- **PostgreSQL** 14+ (local or remote instance)

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/your-org/fleet-manager.git
cd fleet-manager
```

### 2. Backend setup

```bash
cd backend
npm install
```

Create a PostgreSQL database and run the schema:

```bash
# Using psql (adjust user/db name)
psql -U postgres -d your_database -f sql/schema.sql

# Run migrations if the DB already existed before new schema changes
psql -U postgres -d your_database -f sql/migrations/001_add_organization_id_to_driver_documents.sql
psql -U postgres -d your_database -f sql/migrations/002_soft_delete_drivers.sql
psql -U postgres -d your_database -f sql/migrations/003_commission_system.sql

# Commission legs sign fix (positive magnitudes + generated total_commission); then verify (expect empty result sets):
psql -U postgres -d your_database -f sql/migrations/038_commission_legs_positive.sql
psql -U postgres -d your_database -f sql/migrations/038_commission_legs_positive.verify.sql

# Single company commission on net income (drops dual-leg columns); then verify:
psql -U postgres -d your_database -f sql/migrations/039_single_company_commission.sql
psql -U postgres -d your_database -f sql/migrations/039_single_company_commission.verify.sql
```

### Initial setup (first super admin)

Public registration is disabled. Bootstrap the platform operator manually:

1. Apply RBAC migrations including `091_rbac_permissions.sql` and `093_organizations_permissions.sql`.
2. Generate a bcrypt hash: `node -e "require('bcrypt').hash('YourSecurePassword', 10).then(console.log)"` (from `backend/`).
3. Edit and run `backend/sql/seeds/bootstrap_super_admin.sql` (sets `organization_id = NULL`, role `super_admin`).
4. Sign in at `/login`, then use **Settings → Organizations** to create tenant organizations and their first admin users.

### 3. Frontend setup

```bash
cd ../frontend
npm install
```

---

## Environment Setup

### Backend (`.env` in `backend/`)

Create `backend/.env` (copy from `backend/.env.example`):

```env
# Server
PORT=4100

# Database (required for production)
DATABASE_URL=postgresql://user:password@localhost:5432/fleet_manager

# JWT — use a long random string (e.g. openssl rand -base64 48)
JWT_SECRET=replace_with_long_random_secret_at_least_32_chars

# Optional: set in production for deploy versioning
APP_VERSION=dev
```

| Variable       | Description                    | Default (if omitted)     |
| -------------- | ------------------------------ | ------------------------ |
| `PORT`         | API server port                | `4100`                   |
| `DATABASE_URL` | PostgreSQL connection string   | *(required for DB access)* |
| `JWT_SECRET`   | Secret for signing JWT tokens  | `dev_jwt_secret_change_me` (development only; logs a warning) |
| `APP_VERSION`  | API version exposed to clients | `dev`                    |
| `NODE_ENV`     | Runtime environment            | *(unset = development)*  |

**Production:** Set `NODE_ENV=production` and a strong `JWT_SECRET` (minimum 32 characters, not a default/placeholder). The API **refuses to start** if `JWT_SECRET` is missing or insecure when `NODE_ENV=production`.

### Frontend (optional)

Create `frontend/.env` if you need to point the app at a different API:

```env
# API base URL (used by Vite as import.meta.env.VITE_API_URL)
VITE_API_URL=http://localhost:4100/api
```

If not set, the frontend defaults to `http://localhost:4100/api`.

---

## Development

### Run backend (API)

From the project root:

```bash
cd backend
npm run dev
```

- API: **http://localhost:4100**
- Health: **http://localhost:4100/health**
- API base path: **http://localhost:4100/api**

### Run frontend (React)

From the project root:

```bash
cd frontend
npm run dev
```

- App: **http://localhost:5173** (or the port Vite prints)

Use both terminals so the frontend can call the backend API.

---

## Build

### Backend

```bash
cd backend
npm run build
```

Output: `backend/dist/`. Run in production with:

```bash
npm start
```

### Frontend

```bash
cd frontend
npm run build
```

Output: `frontend/dist/`. Serve with any static file server or use:

```bash
npm run preview
```

---

## API Documentation

*(Placeholder for full API docs. You can replace this with OpenAPI/Swagger or a link to your docs.)*

**Base URL:** `http://localhost:4100/api` (or your deployed API URL)

| Area        | Prefix              | Description                    |
| ----------- | ------------------- | ------------------------------ |
| Auth        | `/api/auth`         | Login (public register disabled) |
| Organizations | `/api/organizations` | List/create orgs (super_admin only) |
| Drivers     | `/api/drivers`      | CRUD, activity, notes, delete  |
| Documents   | `/api/drivers`      | Upload, list, verify, download |
| Dashboard   | `/api/dashboard`    | Stats, status, earnings, activity |

- **Authentication:** Send `Authorization: Bearer <token>` for protected routes.
- **Roles:** Many routes require `admin` or `accountant` (enforced by backend).

**Weekly earnings (Glovo + Bolt Delivery):** Import each platform’s CSV for the same payment week (order does not matter). Rows are stored in `earnings_records` per platform (`net_earnings` = platform net). Each import recomputes **one `driver_payouts` row per driver per platform per week** (`platform` = `glovo` or `bolt`; Bolt imports use earnings platform `bolt_courier` → payout `bolt`). Commission uses that driver’s `commission_rate` / hybrid / fixed / minimum on **that row’s** `total_net_earnings` only; sum of per-platform commissions equals commission on combined net. Vehicle rental and debt carry-forward run per payout row (debt allocation is still driver-scoped across platforms). Subcontractor settlements `SUM` all linked payout rows. Reports and payout lists filter by `driver_payouts.platform` (`glovo` or `bolt`; API may accept `bolt_courier` as alias for `bolt`).

**Bolt Delivery weekly CSV (Tier A):** Auto-detected when headers include `Courier UID`, Adjusted Earnings with Courier Tips (With/Without VAT), and `Overdue courier cash debt` (or legacy `Cash received from Clients` in the file). Map `Courier UID` → `drivers.bolt_courier_id`. **Used columns (manual tip sum):** `gross_earnings` = Adjusted Earnings (With VAT); `tips` = Courier Tips (With VAT); `net_earnings` = Adjusted Earnings (Without VAT) + Courier Tips (Without VAT). **Payout deduction:** `Overdue courier cash debt` only (stored in `earnings_records.daily_cash` for rollup). **Not deducted:** Cash received from Clients (current-week cash is internal to Bolt), Cash paid to Providers. Combined “Adjusted Earnings with Courier Tips” columns are ignored. DB trigger `trg_enforce_driver_payout_after_cash` skips `bolt` / `bolt_courier` (migration `072`). Period math: commission = net × driver rate; payout = net − commission − |overdue courier cash debt|. Apply migrations `068`, `071`, and `072` in `backend/` before production Bolt imports. Fixture: `backend/src/modules/earnings/fixtures/bolt/weekly-export-headers.csv`.

**Bolt re-import after migration 072:** Existing rows imported before `072` may have wrong `net_earnings` (e.g. net ≈ gross − cash). Re-import the Bolt weekly CSV for that week so commit + rollup refresh `driver_payouts`. Verify: `earnings_records.net_earnings` matches adjusted (without VAT) + tips (without VAT); e.g. Muhammad Ikram row net **2944.08**, not **248.68**. See `backend/sql/migrations/072_bolt_skip_net_earnings_trigger.verify.sql`.

A full API reference (endpoints, request/response shapes, errors) can be added here or in a separate `docs/` folder.

---

## Deployment

- **Backend:** Run `npm run build` then `npm start`; set `NODE_ENV=production`, `PORT`, `DATABASE_URL`, and a strong `JWT_SECRET` (32+ characters) in the production environment. The server exits on startup if `JWT_SECRET` is missing or insecure in production. Ensure PostgreSQL is reachable and migrations are applied.
- **Frontend:** Run `npm run build` and serve the `frontend/dist` folder with Nginx, a CDN, or a static host. Set `VITE_API_URL` at build time to your production API URL.
- **Database:** Use a managed PostgreSQL service; run `schema.sql` and migrations on the production DB.
  - **Subcontractor module (in order):** `051`–`061`, `062_remove_subcontractor_commission_rate.sql` (run `npm run migrate:060-062` in `backend/`; verify scripts should return empty result sets). Settlements: **Commission** = `SUM(driver_payouts.company_commission)`; `subcontractor_payouts` has no commission columns; `subcontractors` has no `commission_rate` (use each driver’s rate). After deploy, use **Refresh settlements** on active periods. Re-import sub-managed earnings if rows were computed with the old subcontractor-level rate override.
- **Uploads:** Ensure `backend/uploads` exists and is writable. Uploads are **not** served publicly; driver photos and documents are accessed only through authenticated API routes (`GET /api/drivers/:id/photo`, document download endpoints). Do not expose `/uploads` via Nginx or a static alias. For multi-instance setups, use a shared store (e.g. S3) and adjust the app accordingly.

---

## Contributing

1. **Fork** the repository and create a branch from `main` (e.g. `feature/your-feature` or `fix/your-fix`).
2. **Follow** existing code style (TypeScript, existing patterns in frontend/backend).
3. **Test** your changes (run frontend and backend, test in the UI and/or with API calls).
4. **Commit** with clear messages; reference any issue numbers.
5. **Push** your branch and open a **Pull Request** against `main`.
6. Address review feedback; maintainers will merge when ready.

---

## License

[Add your license here, e.g. MIT, Apache 2.0, or "Proprietary - All rights reserved."]
