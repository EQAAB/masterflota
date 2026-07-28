#!/usr/bin/env bash
# Build and deploy Fleet Manager on the VM (database, backend, frontend).
# Run from repo root: bash deploy/scripts/deploy.sh [--init]
#
# Prerequisites:
#   - backend/.env configured (see backend/.env.production.example)
#   - frontend/.env.production configured (VITE_API_URL=http://169.58.28.189/fleet-api)
#   - PostgreSQL running with DATABASE_URL credentials
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
INIT=false
for arg in "$@"; do
  case "$arg" in
    --init) INIT=true ;;
    -h|--help)
      echo "Usage: bash deploy/scripts/deploy.sh [--init]"
      exit 0
      ;;
    *)
      echo "Unknown argument: $arg"
      exit 1
      ;;
  esac
done

cd "$ROOT"

# Avoid ~/.npm permission errors when npm was previously run with sudo.
export npm_config_cache="${ROOT}/.npm-cache"
mkdir -p "$npm_config_cache"

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — copy backend/.env.production.example to backend/.env and edit."
  exit 1
fi

if [[ ! -f frontend/.env.production ]]; then
  echo "Missing frontend/.env.production — copy frontend/.env.production.example and set VITE_API_URL."
  exit 1
fi

ENV_FILE="$ROOT/backend/.env"

# deploy builds; www-data runs the API — shared group, deploy owns files
ensure_deploy_ownership() {
  local u
  u="$(whoami)"
  if ! id www-data >/dev/null 2>&1; then
    return 0
  fi
  if sudo -n chown -R "${u}:www-data" "$ROOT/backend" "$ROOT/frontend" 2>/dev/null; then
    echo "==> Ownership: ${u}:www-data on backend/ and frontend/"
    return 0
  fi
  echo "WARN: could not chown backend/frontend (EACCES on dist/.env may persist)"
}

# deploy must write APP_VERSION; www-data (API user) must read .env
ensure_backend_env_access() {
  if [[ ! -f "$ENV_FILE" ]]; then
    return 0
  fi
  if [[ -w "$ENV_FILE" ]]; then
    chgrp www-data "$ENV_FILE" 2>/dev/null || sudo -n chgrp www-data "$ENV_FILE" 2>/dev/null || true
    chmod 640 "$ENV_FILE" 2>/dev/null || true
    return 0
  fi
  if sudo -n chown "$(whoami):www-data" "$ENV_FILE" 2>/dev/null; then
    sudo -n chmod 640 "$ENV_FILE" 2>/dev/null || true
    return 0
  fi
  echo "WARN: cannot fix ownership on $ENV_FILE — run: sudo chown deploy:www-data $ENV_FILE && sudo chmod 640 $ENV_FILE"
}

if git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  APP_VERSION="$(git -C "$ROOT" rev-parse --short HEAD)"
else
  APP_VERSION="$(date -u +%Y%m%d%H%M%S)"
fi
update_env_file() {
  if [[ -w "$ENV_FILE" ]]; then
    if grep -q '^APP_VERSION=' "$ENV_FILE"; then
      sed -i "s/^APP_VERSION=.*/APP_VERSION=${APP_VERSION}/" "$ENV_FILE"
    else
      printf '\nAPP_VERSION=%s\n' "$APP_VERSION" >>"$ENV_FILE"
    fi
    return
  fi
  if command -v sudo >/dev/null 2>&1 && sudo -n true 2>/dev/null; then
    if sudo grep -q '^APP_VERSION=' "$ENV_FILE"; then
      sudo sed -i "s/^APP_VERSION=.*/APP_VERSION=${APP_VERSION}/" "$ENV_FILE"
    else
      printf '\nAPP_VERSION=%s\n' "$APP_VERSION" | sudo tee -a "$ENV_FILE" >/dev/null
    fi
    return
  fi
  echo "Cannot update APP_VERSION in $ENV_FILE (not writable; configure passwordless sudo for CI deploy)."
  echo "Fix on VM: sudo chown deploy:www-data $ENV_FILE && sudo chmod 640 $ENV_FILE"
  exit 1
}
ensure_deploy_ownership
ensure_backend_env_access
update_env_file
echo "==> APP_VERSION=${APP_VERSION} (clients see refresh banner after deploy)"

echo "==> Backend: install & build"
cd "$ROOT/backend"
rm -rf node_modules dist
npm ci
npm run build

echo "==> Backend: migrations"
if $INIT; then
  node scripts/apply-all-migrations.mjs --init
else
  node scripts/apply-all-migrations.mjs
fi

echo "==> Backend: upload directories"
mkdir -p uploads/driver-photos uploads/driver-documents uploads/vehicle-documents

echo "==> Frontend: install & build"
cd "$ROOT/frontend"
rm -rf node_modules dist
npm ci
npm run build

echo "==> Permissions"
if id www-data >/dev/null 2>&1 && groups | grep -qw www-data; then
  # deploy is in www-data group — set group perms without sudo
  mkdir -p "$ROOT/backend/uploads/driver-photos" "$ROOT/backend/uploads/driver-documents" "$ROOT/backend/uploads/vehicle-documents"
  chgrp -R www-data "$ROOT/backend/uploads" "$ROOT/backend/dist" 2>/dev/null || true
  chgrp www-data "$ROOT/backend/.env" 2>/dev/null || true
  chmod -R g+rwX "$ROOT/backend/uploads"
  chmod -R g+rX "$ROOT/backend/dist"
  chmod 640 "$ROOT/backend/.env" 2>/dev/null || true
elif id www-data >/dev/null 2>&1; then
  sudo -n chown -R deploy:www-data "$ROOT/backend/uploads" || true
  sudo -n chown deploy:www-data "$ROOT/backend/.env" || true
  sudo -n chmod 640 "$ROOT/backend/.env" 2>/dev/null || true
  sudo -n chown -R deploy:www-data "$ROOT/backend/dist" || true
  sudo -n chmod -R g+rX "$ROOT/backend/dist" 2>/dev/null || true
fi

require_sudo() {
  if ! sudo -n true 2>/dev/null; then
    echo "ERROR: passwordless sudo is not configured for $(whoami)."
    echo "On the VM run: sudo DEPLOY_USER=$(whoami) bash deploy/scripts/setup-ci-deploy.sh"
    exit 1
  fi
}

echo "==> systemd fleet-api"
require_sudo
if [[ -f "$ROOT/deploy/systemd/fleet-api.service" ]]; then
  sed "s|/var/www/Fleet-Manager|${ROOT}|g" "$ROOT/deploy/systemd/fleet-api.service" | sudo -n tee /etc/systemd/system/fleet-api.service >/dev/null
  sudo -n systemctl daemon-reload
  sudo -n systemctl enable fleet-api
  sudo -n systemctl restart fleet-api
  sudo -n systemctl --no-pager status fleet-api || true
fi

echo "==> Nginx"
if [[ -f /etc/nginx/sites-available/masterflota ]] || [[ -f /etc/nginx/sites-available/fleet-manager ]]; then
  if sudo -n nginx -t 2>/dev/null; then
    sudo -n systemctl reload nginx
  fi
elif [[ -f "$ROOT/deploy/nginx/fleet-manager.conf" ]]; then
  echo "Run: sudo bash deploy/scripts/configure-nginx.sh <host>"
  echo "  or: sudo bash deploy/scripts/configure-nginx-masterflota.sh"
fi

echo ""
echo "Deploy complete."
echo "  Health: curl -s http://127.0.0.1:4100/api/health"
echo ""
echo "First login: cd backend && npm run bootstrap:super-admin"
