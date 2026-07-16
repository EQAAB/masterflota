#!/usr/bin/env bash
# Build and deploy Fleet Manager on the VM (database, backend, frontend).
# Run from repo root: bash deploy/scripts/deploy.sh [--init]
#
# Prerequisites:
#   - backend/.env configured (see backend/.env.production.example)
#   - frontend/.env.production configured (VITE_API_URL=https://169.58.28.189/fleet-api)
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

if [[ ! -f backend/.env ]]; then
  echo "Missing backend/.env — copy backend/.env.production.example to backend/.env and edit."
  exit 1
fi

if [[ ! -f frontend/.env.production ]]; then
  echo "Missing frontend/.env.production — copy frontend/.env.production.example and set VITE_API_URL."
  exit 1
fi

echo "==> Backend: install & build"
cd "$ROOT/backend"
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
npm ci
npm run build

echo "==> Permissions"
DEPLOY_USER="$(whoami)"
if id www-data >/dev/null 2>&1; then
  sudo chown -R www-data:www-data "$ROOT/backend/uploads" || true
  sudo chown www-data:www-data "$ROOT/backend/.env" || true
  sudo chown -R www-data:www-data "$ROOT/backend/dist" || true
fi

echo "==> systemd fleet-api"
if [[ -f "$ROOT/deploy/systemd/fleet-api.service" ]]; then
  sed "s|/var/www/Fleet-Manager|${ROOT}|g" "$ROOT/deploy/systemd/fleet-api.service" | sudo tee /etc/systemd/system/fleet-api.service >/dev/null
  sudo systemctl daemon-reload
  sudo systemctl enable fleet-api
  sudo systemctl restart fleet-api
  sudo systemctl --no-pager status fleet-api || true
fi

echo "==> Nginx"
if [[ -f "$ROOT/deploy/nginx/fleet-manager.conf" ]]; then
  if [[ ! -f /etc/nginx/sites-available/fleet-manager ]]; then
    echo "Run: sudo bash deploy/scripts/configure-nginx.sh 169.58.28.189"
  elif sudo nginx -t 2>/dev/null; then
    sudo systemctl reload nginx
  fi
fi

echo ""
echo "Deploy complete."
echo "  Health: curl -s http://127.0.0.1:4100/api/health"
echo "  UI:     https://169.58.28.189/fleet/"
echo ""
echo "First login: cd backend && npm run bootstrap:super-admin"
