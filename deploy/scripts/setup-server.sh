#!/usr/bin/env bash
# One-time Ubuntu server prep for Fleet Manager.
# Run as root or with sudo: bash deploy/scripts/setup-server.sh
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/scripts/setup-server.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive

apt-get update
apt-get upgrade -y
apt-get install -y nginx postgresql postgresql-contrib git curl ufw

if ! command -v node >/dev/null 2>&1 || [[ "$(node -v | cut -d. -f1 | tr -d v)" -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

mkdir -p /var/www
mkdir -p /var/backups/fleet-manager

echo "Server packages installed."
echo "Next:"
echo "  1. Clone repo to /var/www/Fleet-Manager"
echo "  2. bash deploy/scripts/setup-database.sh"
echo "  3. Configure backend/.env and frontend/.env.production"
echo "  4. bash deploy/scripts/deploy.sh --init"
