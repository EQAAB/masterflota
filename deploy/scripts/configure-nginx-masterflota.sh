#!/usr/bin/env bash
# Install Nginx site config for Masterflota (app + API subdomains).
# Usage:
#   sudo bash deploy/scripts/configure-nginx-masterflota.sh
#   sudo bash deploy/scripts/configure-nginx-masterflota.sh app.example.com api.example.com
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo."
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE="$ROOT/deploy/nginx/masterflota.conf"
APP_DOMAIN="${1:-app.masterflota.com}"
API_DOMAIN="${2:-api.masterflota.com}"

if [[ ! -f "$TEMPLATE" ]]; then
  echo "Missing template: $TEMPLATE"
  exit 1
fi

sed \
  "s|/var/www/Fleet-Manager|${ROOT}|g; \
   s/app\\.masterflota\\.com/${APP_DOMAIN}/g; \
   s/api\\.masterflota\\.com/${API_DOMAIN}/g" \
  "$TEMPLATE" > /etc/nginx/sites-available/masterflota

ln -sf /etc/nginx/sites-available/masterflota /etc/nginx/sites-enabled/masterflota
nginx -t
systemctl reload nginx

echo "Nginx configured for Masterflota:"
echo "  UI:  http://${APP_DOMAIN}/"
echo "  API: http://${API_DOMAIN}/api/health"
echo ""
echo "TLS (recommended):"
echo "  sudo certbot --nginx -d ${APP_DOMAIN} -d ${API_DOMAIN}"
