# Fleet Manager

A full-stack, **multi-tenant SaaS platform** for gig-economy fleet operators: driver & vehicle management, Glovo/Bolt earnings import and payout computation, subcontractor settlements, vehicle rentals, and Romanian e-Factura (ANAF) invoicing. Built with React (Vite) and Node.js (Express) with PostgreSQL. Deployable white-labeled per client (e.g. **MasterFlota**) via env vars only.

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

Fleet Manager is a **multi-tenant** platform: a `super_admin` (platform operator) creates `organizations` (tenants), each with its own admin, drivers, vehicles, and data — fully isolated by `organization_id`. Within an organization:

- **Authenticate** users (login only; no public self-registration) with JWT and fine-grained **RBAC** (`users.role_id` → `roles` → `role_permissions` → `permissions`, embedded in the JWT). Seeded roles: `super_admin`, `admin`, `accountant`, `manager`, `viewer`, `driver`.
- **Manage drivers & vehicles**: CRUD, soft-delete, document upload (ID/license/contract, vehicle docs), activity logs, notes, vehicle assignment.
- **Import & compute earnings**: CSV import from **Glovo** and **Bolt** (courier) delivery platforms; one payout row per driver per platform per week; commission (percentage, fixed, or hybrid, with minimums), vehicle rental deduction, cross-platform debt carry-forward, driver loans.
- **Subcontractors**: drivers can be sub-managed by a subcontractor; weekly settlements aggregate all linked driver payouts.
- **Vehicle rentals**: a separate rental line of business — bookings, customers, calendar, pricing, availability, payments — alongside the gig-driver fleet.
- **Invoicing (e-Factura / ANAF)**: issue Romanian-compliant UBL 2.1 invoices and submit them electronically to ANAF (Romania's tax authority), with three connection methods: certificate upload, browser OAuth, or a provider (SmartBill/Oblio).
- **Admin & audit**: user management, custom roles & permission matrix, audit log, login events, org-level settings, white-label branding.
- **Dashboard**: fleet stats, driver status, earnings, document stats, recent activity. A separate **platform dashboard** exists for `super_admin` (cross-organization view).

---

## Tech Stack

| Layer      | Technologies |
| ---------- | ------------ |
| **Frontend** | React 19, TypeScript, Vite 7, Tailwind CSS, React Router 7, Zustand, React Query, Axios, Recharts, jsPDF/html2canvas, PapaParse |
| **Backend**  | Node.js, Express, TypeScript, PostgreSQL (`pg`), JWT, bcrypt, Multer, node-cron, fast-csv, xlsx, pdf-parse, fast-xml-parser |
| **Database** | PostgreSQL — 160+ incremental migrations under `backend/sql/migrations/`, each with a paired `.verify.sql` |

---

## Project Structure

```
Fleet Manager/
├── frontend/                 # React (Vite) SPA
│   ├── public/
│   ├── src/
│   │   ├── api/               # API clients (one per module)
│   │   ├── components/        # layout (route guards), UI, dashboard, drivers, documents
│   │   ├── lib/                # api.ts (axios instance), permissions, routePermissions, appBranding
│   │   ├── pages/
│   │   │   ├── auth/           # login
│   │   │   ├── dashboard/      # org dashboard
│   │   │   ├── platform/       # super_admin cross-org dashboard
│   │   │   ├── drivers/        # list, add, edit, detail
│   │   │   ├── vehicles/       # list, add, edit, detail, documents
│   │   │   ├── earnings/       # import, payouts, reports, loans, subcontractor settlements
│   │   │   ├── subcontractors/ # list, form, detail
│   │   │   ├── rentals/        # dashboard, bookings, calendar, customers, pricing, payments
│   │   │   ├── invoicing/      # invoices list/detail/form, e-Factura settings
│   │   │   └── settings/       # profile, organizations, users, roles, audit log, login events
│   │   ├── store/               # authStore (Zustand)
│   │   ├── App.tsx              # route table + permission/role guards
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/                  # Express API
│   ├── src/
│   │   ├── config/            # env, multer
│   │   ├── db/                 # pool (PostgreSQL)
│   │   ├── middleware/         # auth (JWT + permission checks), orgContext (multi-tenant scoping)
│   │   ├── modules/
│   │   │   ├── auth/            # login, sessions
│   │   │   ├── organizations/   # tenant CRUD (super_admin only)
│   │   │   ├── users/ roles/    # user & RBAC management
│   │   │   ├── dashboard/       # org + platform stats, activity, documents
│   │   │   ├── drivers/         # CRUD, activity, notes, soft delete
│   │   │   ├── vehicles/ vehicleDocuments/
│   │   │   ├── documents/       # driver document upload/verify/download
│   │   │   ├── earnings/        # Glovo/Bolt CSV import, payouts, reports, driver loans
│   │   │   ├── import/          # generic import staging/commit
│   │   │   ├── subcontractors/ subcontractorPayouts/  # sub-managed drivers, settlements
│   │   │   ├── rentals/         # bookings, customers, pricing, availability, payments
│   │   │   ├── invoicing/       # fiscal profile, series, invoices, ANAF (e-Factura) integration
│   │   │   ├── loginEvents/ audit/  # security/audit trail
│   │   │   └── settings/        # org key/value settings
│   │   ├── app.ts
│   │   └── index.ts
│   ├── sql/
│   │   ├── schema.sql          # Full schema
│   │   ├── views.sql
│   │   ├── migrations/         # 001 ... 102+, each paired with a *.verify.sql
│   │   └── seeds/               # bootstrap_super_admin.sql
│   ├── scripts/                 # migration runners, CSV import CLI, payout recompute, audits
│   ├── uploads/                 # Uploaded files (create if missing; never served statically)
│   ├── .env                    # Not committed; see Environment Setup
│   ├── package.json
│   └── tsconfig.json
│
├── deploy/                    # setup-server.sh, setup-database.sh, configure-nginx.sh, deploy.sh, systemd units
├── docs/                      # deploy-vm.md, deploy-masterflota.md, rbac-permission-map.md
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

# Invoicing / e-Factura module — required for databases that predate this module (adds tables +
# invoicing.* permission grants). On a fresh install, schema.sql already has the tables, but run
# 101 anyway (skip 102) to seed the permission grants — see note below.
psql -U postgres -d your_database -f sql/migrations/101_invoicing_module.sql
psql -U postgres -d your_database -f sql/migrations/102_invoicing_connection_methods.sql
```

`sql/schema.sql` is the current full schema (kept in sync with the cumulative effect of all migrations) — for a **fresh** database, run it once and skip the individual migration files above, *except* `101_invoicing_module.sql` (see note below). `npm run migrate:init` applies `schema.sql` and marks all migration files as baseline-applied automatically, but baselining only records a migration as done — it does not execute it, so any `INSERT` seed data a migration carries (as opposed to `CREATE TABLE`/`ALTER TABLE`) is never actually written by `migrate:init` alone.

> **Fresh installs still need to run `101_invoicing_module.sql` once**, even after `schema.sql`/`migrate:init`. Its `CREATE TABLE` statements are harmless no-ops (schema.sql already created those tables), but its `INSERT INTO permissions` / `role_permissions` seeds for `invoicing.view` / `invoicing.manage` / `invoicing.anaf` are not duplicated anywhere else — the same gap `091_rbac_permissions.sql` has for the base permission set (see Initial setup below). Without it, invoicing stays inaccessible even to `super_admin`, since permission checks read from `role_permissions`, not the role name. `102_invoicing_connection_methods.sql` carries no seed data — it's pure structure, fully covered by `schema.sql` — so fresh installs can skip it entirely.

### Initial setup (first super admin)

Public registration is disabled. Bootstrap the platform operator manually:

1. Apply RBAC migrations including `091_rbac_permissions.sql` and `093_organizations_permissions.sql` (and `101_invoicing_module.sql` if using the invoicing module — see note above).
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
DATABASE_URL=postgresql://user:password@localhost:5432/fleetmanager

# JWT — use a long random string (e.g. openssl rand -base64 48)
JWT_SECRET=replace_with_long_random_secret_at_least_32_chars

# Optional: local dev only; production deploy sets this from git in deploy.sh
APP_VERSION=dev

# AI (optional — Payout Explainer + Ops Digest). Never put the key in frontend/VITE_* env.
# Recommended free tier (Groq):
# OPENAI_API_KEY=gsk_your_groq_key
# OPENAI_BASE_URL=https://api.groq.com/openai/v1
# OPENAI_MODEL=llama-3.3-70b-versatile
# AI_FEATURES_ENABLED=true
#
# Or OpenAI (omit OPENAI_BASE_URL):
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# AI_FEATURES_ENABLED=true
```

| Variable       | Description                    | Default (if omitted)     |
| -------------- | ------------------------------ | ------------------------ |
| `PORT`         | API server port                | `4100`                   |
| `DATABASE_URL` | PostgreSQL connection string   | *(required for DB access)* |
| `JWT_SECRET`   | Secret for signing JWT tokens  | `dev_jwt_secret_change_me` (development only; logs a warning) |
| `APP_VERSION`  | API version exposed to clients (refresh banner) | `dev` locally; **auto-set from git commit on VM deploy** |
| `APP_NAME`     | Shown in generated rental contract downloads ("Generated by ___.") | `Fleet Manager` |
| `NODE_ENV`     | Runtime environment            | *(unset = development)*  |
| `OPENAI_API_KEY` | API key for Payout Explainer / Ops Digest (server-side only; Groq `gsk_...` or OpenAI `sk-...`) | *(empty = AI off)* |
| `OPENAI_BASE_URL` | OpenAI-compatible API base URL (set for Groq: `https://api.groq.com/openai/v1`) | *(empty = OpenAI default host)* |
| `OPENAI_MODEL` | Chat model name | `gpt-4o-mini` (use a Groq model id when using Groq) |
| `AI_FEATURES_ENABLED` | Must be `true` **and** key set to enable AI endpoints | `false` |

**Where to set the AI key:** only in `backend/.env` (same file as `DATABASE_URL`). On the VM after editing, restart the API: `sudo systemctl restart fleet-api`. Do **not** add `OPENAI_API_KEY` to frontend env vars.

**Production:** Set `NODE_ENV=production` and a strong `JWT_SECRET` (minimum 32 characters, not a default/placeholder). The API **refuses to start** if `JWT_SECRET` is missing or insecure when `NODE_ENV=production`.

### Frontend

**Local development (`npm run dev`):** No env file is required. The app calls `/api`, which Vite proxies to `http://localhost:4100`. Override with `frontend/.env.local` if needed:

```env
# Optional — only if you need a non-default API URL during dev
VITE_API_URL=http://localhost:4100/api
```

**Production build (`npm run build`):** `VITE_API_URL` is **required** and must point at your deployed API.

On the production server (one-time setup):

```bash
cd frontend
cp .env.production.example .env.production
# Edit .env.production if your API URL differs
npm run build
```

`.env.production` is gitignored — create it on each server from [`.env.production.example`](frontend/.env.production.example). After that, plain `npm run build` works.

Alternative without a file:

```bash
VITE_API_URL=http://169.58.28.189/fleet-api npm run build
```

The build fails with a clear error if `VITE_API_URL` is missing.

### White-label / branding

Fleet Manager can be re-skinned per deployment (e.g. white-labeled as **MasterFlota**) purely through env vars — no code changes needed. Set these in `frontend/.env.production` (see [`.env.production.masterflota.example`](frontend/.env.production.masterflota.example) for a full example):

| Variable                 | Description                                        | Default (if omitted)   |
| ------------------------ | --------------------------------------------------- | ----------------------- |
| `VITE_APP_NAME`          | App name shown in tab title, login page, sidebar    | `Fleet Manager`         |
| `VITE_APP_LOGO_MONOGRAM` | 1–3 letter monogram for the logo mark and favicon   | Auto-derived from `VITE_APP_NAME` |
| `VITE_MARKETING_URL`     | Product/marketing site link (sidebar + login footer) | *(hidden if unset)*   |
| `VITE_COMPANY_NAME`      | Company name shown alongside `VITE_COMPANY_URL`     | *(hidden if unset)*    |
| `VITE_COMPANY_URL`       | Company site link (sidebar + login footer)          | *(hidden if unset)*    |

These drive `frontend/src/lib/appBranding.ts`, which sets the document title, favicon (SVG monogram, matching the logo mark), meta description/Open Graph tags, and the login/sidebar UI at runtime — no rebuild-per-brand asset swap required. Pair with backend `APP_NAME` (above) so generated rental contracts match.

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
| Auth        | `/api/auth`         | Login, sessions (public register disabled) |
| Organizations | `/api/organizations` | List/create orgs (super_admin only) |
| Users / Roles | `/api/users`, `/api/roles` | User management, RBAC / permission matrix |
| Drivers     | `/api/drivers`      | CRUD, activity, notes, delete, documents (upload/verify/download) |
| Vehicles    | `/api/vehicles`     | CRUD, documents, assignment |
| Dashboard   | `/api/dashboard`    | Stats, status, earnings, activity (org + platform views) |
| Earnings    | `/api/earnings`, `/api/import` | Glovo/Bolt CSV import, payouts, reports, driver loans |
| Subcontractors | `/api/subcontractors`, `/api/subcontractor-payouts` | Sub-managed drivers, weekly settlements |
| Rentals     | `/api/rentals`      | Bookings, customers, calendar, pricing, payments, availability |
| Invoicing   | `/api/invoicing`    | Fiscal profile, invoice series, invoices, ANAF e-Factura connection/submission |
| Audit       | `/api/audit-logs`, `/api/settings` | Audit trail, org settings |

- **Authentication:** Send `Authorization: Bearer <token>` for protected routes.
- **Authorization:** Fine-grained RBAC — permissions (`drivers.view`, `payouts.approve`, `invoicing.anaf`, etc.) are resolved via `roles` → `role_permissions` and embedded in the JWT at login; routes and frontend UI both gate on specific permissions rather than raw role names. See [docs/rbac-permission-map.md](docs/rbac-permission-map.md) for the full map.
- **Multi-tenancy:** Every request (except platform-level `/api/organizations`) is scoped to the caller's `organization_id` via `orgContext` middleware.

**Weekly earnings (Glovo + Bolt Delivery):** Import each platform’s CSV for the same payment week (order does not matter). Rows are stored in `earnings_records` per platform (`net_earnings` = platform net). Each import recomputes **one `driver_payouts` row per driver per platform per week** (`platform` = `glovo` or `bolt`; Bolt imports use earnings platform `bolt_courier` → payout `bolt`). Commission uses that driver’s `commission_rate` / hybrid / fixed / minimum on **that row’s** `total_net_earnings` only; sum of per-platform commissions equals commission on combined net. Vehicle rental and debt carry-forward run per payout row (debt allocation is still driver-scoped across platforms). Subcontractor settlements `SUM` all linked payout rows. Reports and payout lists filter by `driver_payouts.platform` (`glovo` or `bolt`; API may accept `bolt_courier` as alias for `bolt`).

**Bolt Delivery weekly CSV (Tier A):** Auto-detected when headers include `Courier UID`, Adjusted Earnings with Courier Tips (With/Without VAT), and `Overdue courier cash debt` (or legacy `Cash received from Clients` in the file). Map `Courier UID` → `drivers.bolt_courier_id`. **Used columns (manual tip sum):** `gross_earnings` = Adjusted Earnings (With VAT); `tips` = Courier Tips (With VAT); `net_earnings` = Adjusted Earnings (Without VAT) + Courier Tips (Without VAT). **Payout deduction:** `Overdue courier cash debt` only (stored in `earnings_records.daily_cash` for rollup). **Not deducted:** Cash received from Clients (current-week cash is internal to Bolt), Cash paid to Providers. Combined “Adjusted Earnings with Courier Tips” columns are ignored. DB trigger `trg_enforce_driver_payout_after_cash` skips `bolt` / `bolt_courier` (migration `072`). Period math: commission = net × driver rate; payout = net − commission − |overdue courier cash debt|. Apply migrations `068`, `071`, and `072` in `backend/` before production Bolt imports. Fixture: `backend/src/modules/earnings/fixtures/bolt/weekly-export-headers.csv`.

**Bolt re-import after migration 072:** Existing rows imported before `072` may have wrong `net_earnings` (e.g. net ≈ gross − cash). Re-import the Bolt weekly CSV for that week so commit + rollup refresh `driver_payouts`. Verify: `earnings_records.net_earnings` matches adjusted (without VAT) + tips (without VAT); e.g. Muhammad Ikram row net **2944.08**, not **248.68**. See `backend/sql/migrations/072_bolt_skip_net_earnings_trigger.verify.sql`.

**Invoicing (e-Factura / ANAF):** Standalone module (`backend/src/modules/invoicing/`, migrations `101`–`102`) for issuing Romanian-compliant invoices and submitting them electronically to ANAF (Romania's national tax authority).

- **Fiscal profile** (`organization_fiscal_profiles`) — the org's issuer identity (CUI, company name, address, bank, VAT status). Required before issuing any invoice.
- **Invoice series** (`invoice_series`) — one or more numbering prefixes per org (e.g. `FV`), each with an auto-incrementing `next_number`.
- **Invoices** (`invoices` + `invoice_lines`) — created as `draft`, computed net/VAT/total per line; on **issue**, a CIUS-RO UBL 2.1 XML is generated (`xmlBuilder.ts`) and the invoice moves to `issued`. Status lifecycle: `draft → issued → submitted → accepted | rejected`, plus `cancelled`/`storno` (credit note). Invoices can optionally link back to a rental booking (`source_type`, `rental_booking_id`).
- **ANAF submission** (`anafService.ts`) — uploads the XML to ANAF's `FCTEL` REST API (`api.anaf.ro/prod/FCTEL/rest/upload`) and polls `stareMesaj` for accept/reject status. Requires a live OAuth access token per organization (`anaf_tokens`), auto-refreshed when near expiry.
- **Three ways to connect to ANAF** (`102_invoicing_connection_methods.sql`), selectable per org in Settings → Invoicing:
  1. **Certificate upload** (recommended in the UI) — upload the company's `.pfx`/`.p12` digital certificate + password once; the server exchanges it for an ANAF token via `client_credentials`.
  2. **Browser OAuth** — the standard ANAF flow (`logincert.anaf.ro`), redirecting the user to present their certificate in-browser; requires local certificate setup.
  3. **Provider API** — delegate to **SmartBill** or **Oblio** (Romanian invoicing SaaS providers) using an API key instead of a certificate.
- **Permissions:** `invoicing.view`, `invoicing.manage` (create/issue/cancel), `invoicing.anaf` (connect/submit to ANAF) — granted to `super_admin`/`admin` fully, `accountant` gets view+manage, `manager`/`viewer` get view only.
- **Required env vars:** `ANAF_CLIENT_ID`, `ANAF_CLIENT_SECRET`, `ANAF_CALLBACK_URL` (OAuth app registered with ANAF), `FRONTEND_URL` (for post-OAuth redirect). See `backend/.env.example`.

> ⚠️ The certificate-upload flow stores the certificate password in a column named `cert_password_encrypted`, but the current implementation writes the raw password — it is not actually encrypted at rest. Treat this as a known gap if/when hardening the invoicing module.

A full API reference (endpoints, request/response shapes, errors) can be added here or in a separate `docs/` folder.

---

## Deployment

**Single VM (Ubuntu):** see **[docs/deploy-vm.md](docs/deploy-vm.md)** for Contabo/VPS setup with PostgreSQL, systemd, and Nginx (`/fleet/` + `/fleet-api/`).

Quick path on the server:

```bash
sudo bash deploy/scripts/setup-server.sh
sudo FLEET_DB_PASSWORD='...' bash deploy/scripts/setup-database.sh
# configure backend/.env and frontend/.env.production
sudo bash deploy/scripts/configure-nginx.sh YOUR_PUBLIC_IP
bash deploy/scripts/deploy.sh --init
cd backend && npm run bootstrap:super-admin
```

- **Backend:** Run `npm run build` then `npm start`; set `NODE_ENV=production`, `PORT`, `DATABASE_URL`, and a strong `JWT_SECRET` (32+ characters) in the production environment. The server exits on startup if `JWT_SECRET` is missing or insecure in production. Ensure PostgreSQL is reachable and migrations are applied (`npm run migrate:all` or `deploy.sh`).
- **Frontend:** Run `npm run build` and serve the `frontend/dist` folder with Nginx. Set `VITE_API_URL` at build time to your production API URL (e.g. `http://YOUR_IP/fleet-api` when using the included Nginx config).
- **Database:** PostgreSQL on the VM or managed service; run `sql/schema.sql` and migrations on the production DB (`npm run migrate:init` on first deploy).
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

