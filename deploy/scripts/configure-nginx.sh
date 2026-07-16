#!/usr/bin/env bash
# Install Nginx site config with your server_name / IP.
# Usage: sudo bash deploy/scripts/configure-nginx.sh 203.0.113.10
#        sudo bash deploy/scripts/configure-nginx.sh fleet.example.com
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo."
  exit 1
fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TEMPLATE="$ROOT/deploy/nginx/fleet-manager.conf"
SERVER_NAME="${1:-}"
if [[ -z "$SERVER_NAME" ]]; then
  echo "Usage: sudo bash deploy/scripts/configure-nginx.sh <server_name_or_ip>"
  exit 1
fi

sed "s|/var/www/Fleet-Manager|${ROOT}|g; s/169.58.28.189/${SERVER_NAME}/g" "$TEMPLATE" > /etc/nginx/sites-available/fleet-manager
ln -sf /etc/nginx/sites-available/fleet-manager /etc/nginx/sites-enabled/fleet-manager
nginx -t
systemctl reload nginx

echo "Nginx configured for server_name=${SERVER_NAME}"
echo "UI: https://${SERVER_NAME}/fleet/"
echo "API: https://${SERVER_NAME}/fleet-api/health"
