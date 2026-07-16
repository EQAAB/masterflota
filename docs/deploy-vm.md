# Deploy Fleet Manager on a single VM (Ubuntu)

This guide deploys **PostgreSQL**, **Node API**, and **React frontend** on one server (e.g. Contabo VPS).

Default paths:
- App: `/var/www/Fleet-Manager`
- UI: `https://169.58.28.189/fleet/`
- API (via Nginx): `https://169.58.28.189/fleet-api/`

## 1. One-time server setup

```bash
sudo bash deploy/scripts/setup-server.sh
```

## 2. Clone the app

```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone YOUR_REPO_URL Fleet-Manager
sudo chown -R $USER:$USER Fleet-Manager
cd Fleet-Manager
```

## 3. PostgreSQL

```bash
sudo FLEET_DB_PASSWORD='your-strong-db-password' bash deploy/scripts/setup-database.sh
```

## 4. Backend environment

```bash
cd /var/www/Fleet-Manager/backend
cp .env.production.example .env
nano .env
```

Set at minimum:

```env
NODE_ENV=production
PORT=4100
DATABASE_URL=postgresql://fleetadmin:your-strong-db-password@127.0.0.1:5432/fleetmanager
JWT_SECRET=<openssl rand -base64 48>
APP_VERSION=1.0.0
```

## 5. Frontend environment

```bash
cd /var/www/Fleet-Manager/frontend
cp .env.production.example .env.production
nano .env.production
```

```env
VITE_API_URL=https://169.58.28.189/fleet-api
```

Use HTTPS at the edge (load balancer or Certbot on Nginx).

## 6. Nginx

```bash
cd /var/www/Fleet-Manager
sudo bash deploy/scripts/configure-nginx.sh 169.58.28.189
```

## 7. Deploy (first time)

```bash
cd /var/www/Fleet-Manager
bash deploy/scripts/deploy.sh --init
```

`--init` applies `sql/schema.sql` on an empty database, then all pending migrations.

## 8. Bootstrap super admin

```bash
cd /var/www/Fleet-Manager/backend
npm run bootstrap:super-admin
```

Sign in at `https://169.58.28.189/fleet/`, then change the password.

## 9. Smoke tests

```bash
curl -s http://127.0.0.1:4100/api/health
curl -s https://169.58.28.189/fleet-api/health
```

Open `https://169.58.28.189/fleet/` in a browser.

## Updates (after git pull)

```bash
cd /var/www/Fleet-Manager
bash deploy/scripts/deploy.sh
```

## Backups

```bash
bash deploy/scripts/backup.sh
```

Cron (daily 2am):

```cron
0 2 * * * /var/www/Fleet-Manager/deploy/scripts/backup.sh >> /var/log/fleet-backup.log 2>&1
```

## Files in this repo

| File | Purpose |
|------|---------|
| `deploy/nginx/fleet-manager.conf` | Nginx SPA + API proxy |
| `deploy/systemd/fleet-api.service` | systemd unit for Node API |
| `deploy/scripts/setup-server.sh` | apt packages, Node 20, firewall |
| `deploy/scripts/setup-database.sh` | Postgres role + database |
| `deploy/scripts/configure-nginx.sh` | Install Nginx site with your IP/domain |
| `deploy/scripts/deploy.sh` | build, migrate, restart services |
| `deploy/scripts/backup.sh` | pg_dump + uploads archive |
| `backend/scripts/apply-all-migrations.mjs` | ordered SQL migrations |

## Security notes

- Do **not** expose ports `4100` or `5432` publicly; use Nginx on 80/443 only.
- Set a strong `JWT_SECRET` (32+ chars); production refuses weak defaults.
- `backend/uploads` must be writable by `www-data` (driver photos/documents).
- Add HTTPS with Certbot when you have a domain.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| API 404 via `/fleet-api/` | Nginx `proxy_pass` must be `http://127.0.0.1:4100/api/` |
| Frontend calls wrong API | Rebuild frontend after fixing `VITE_API_URL` |
| `JWT_SECRET` error on start | Set `NODE_ENV=production` and a 32+ char secret in `.env` |
| SPA 404 on refresh | Use the Nginx `@fleet_spa` fallback from `deploy/nginx/fleet-manager.conf` |
| Import upload fails | `client_max_body_size 40m` in Nginx (already in template) |
