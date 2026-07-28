# Deploy Fleet Manager on a single VM (Ubuntu)

This guide deploys **PostgreSQL**, **Node API**, and **React frontend** on one server (e.g. Contabo VPS).

For **subdomain** production (`app.masterflota.com` + `api.masterflota.com`), see **[deploy-masterflota.md](./deploy-masterflota.md)**.

Default paths:
- App: `/var/www/Fleet-Manager`
- UI: `http://169.58.28.189/fleet/`
- API (via Nginx): `http://169.58.28.189/fleet-api/`

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
CORS_ORIGINS=http://YOUR_VM_IP_OR_DOMAIN
```

`CORS_ORIGINS` must list every browser origin that serves the UI (comma-separated). For this VM layout, use the public URL users open in the browser, e.g. `http://169.58.28.189` (no trailing slash). Without it, the API logs a warning and allows all origins.

`APP_VERSION` is optional in `.env` — `deploy/scripts/deploy.sh` sets it automatically from the current git commit on each deploy so browsers show the “Refresh Now” banner after updates.

## 5. Frontend environment

```bash
cd /var/www/Fleet-Manager/frontend
cp .env.production.example .env.production
nano .env.production
```

```env
VITE_API_URL=http://169.58.28.189/fleet-api
```

HTTP until TLS is configured (Certbot / load balancer).

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

`--init` applies `sql/schema.sql` on an empty database, then **baselines** all existing migration files (marks them applied). Do not re-run old ALTERs against a modern schema.

If you already applied `schema.sql` but migrations failed mid-way:

```bash
cd /var/www/Fleet-Manager/backend
node scripts/apply-all-migrations.mjs --baseline
```

Later deploys only run **new** migration files not yet recorded in `schema_migrations`.

## 8. Bootstrap super admin

```bash
cd /var/www/Fleet-Manager/backend
npm run bootstrap:super-admin
```

Sign in at `http://169.58.28.189/fleet/`, then change the password.

## 9. Smoke tests

```bash
curl -s http://127.0.0.1:4100/api/health
curl -s http://169.58.28.189/fleet-api/health
```

Open `http://169.58.28.189/fleet/` in a browser.

## Updates (after git pull)

```bash
cd /var/www/Fleet-Manager
bash deploy/scripts/deploy.sh
```

Each run updates `APP_VERSION` in `backend/.env` to the current git commit hash and restarts the API. Users with an older tab open will see **Fleet Manager has been updated → Refresh Now**.

## GitHub Actions (automated deploy)

Workflow file: `.github/workflows/deploy-vm.yml`

Triggers on **push to `main`** or **Run workflow** manually.

### GitHub repository secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `SSH_PRIVATE_KEY` | Yes | Private key for SSH (full PEM, including `BEGIN`/`END` lines). **No passphrase** (recommended for CI). |
| `VM_HOST` | Yes | VM IP or hostname |
| `VM_USER` | Yes | SSH user (e.g. `deploy`) |
| `SSH_PASSPHRASE` | No | Only if `SSH_PRIVATE_KEY` was created with a passphrase |
| `VM_APP_PATH` | No | Default `/var/www/Fleet-Manager` |
| `VM_BRANCH` | No | Default `main` |

Do **not** store `backend/.env` or `frontend/.env.production` in GitHub — they stay on the server only.

### One-time CI setup on the VM

1. **Deploy user** (if you do not have one yet):

```bash
sudo adduser deploy
sudo chown -R deploy:deploy /var/www/Fleet-Manager
```

2. **Passwordless sudo** for `deploy.sh`:

```bash
cd /var/www/Fleet-Manager
sudo DEPLOY_USER=deploy bash deploy/scripts/setup-ci-deploy.sh
```

3. **GitHub Actions SSH key** — generate a **passphrase-free** key pair for CI, put the **private** key in `SSH_PRIVATE_KEY`, add the **public** key to `~deploy/.ssh/authorized_keys`:

```bash
ssh-keygen -t ed25519 -f github_actions_deploy -N "" -C "github-actions-fleet-deploy"
```

4. **Git pull on the server** (deploy key):

```bash
sudo su - deploy
cd /var/www/Fleet-Manager
bash deploy/scripts/setup-git-deploy-key.sh
# Add printed public key in GitHub → Settings → Deploy keys (read-only)
git remote set-url origin git@github.com:YOUR_ORG/Fleet-Manager.git
git fetch origin main
```

5. Merge your changes to `main` and push, or run **Actions → Deploy to VM → Run workflow**.

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
| `deploy/scripts/setup-ci-deploy.sh` | Sudoers for GitHub Actions deploy user |
| `deploy/scripts/setup-git-deploy-key.sh` | VM deploy key for `git fetch` during CI |
| `.github/workflows/deploy-vm.yml` | GitHub Actions SSH deploy on push to `main` |
| `backend/scripts/apply-all-migrations.mjs` | Fresh: schema + baseline; updates: pending only |

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
| CI: `dubious ownership` | `sudo chown -R deploy:deploy /var/www/Fleet-Manager` or re-run `setup-ci-deploy.sh` |
| CI: `could not lock config file` `.gitconfig` | `sudo chown -R deploy:deploy /home/deploy` (home dir owned by root) |
| CI: `FETCH_HEAD` permission denied | Same — deploy user must own the repo; workflow auto-chowns if passwordless `sudo chown` is configured |
| CI: `private key is passphrase protected` | Regenerate with `ssh-keygen ... -N ""` and update `SSH_PRIVATE_KEY`, **or** add optional secret `SSH_PASSPHRASE` |
| CI: `unable to authenticate` | Public key missing from `~deploy/.ssh/authorized_keys`, wrong `VM_USER`, or wrong private key in `SSH_PRIVATE_KEY` |
