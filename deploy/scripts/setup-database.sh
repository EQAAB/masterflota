#!/usr/bin/env bash
# Create PostgreSQL role + database for Fleet Manager.
# Usage:
#   sudo bash deploy/scripts/setup-database.sh
#   sudo FLEET_DB_PASSWORD='secret' bash deploy/scripts/setup-database.sh
set -euo pipefail

FLEET_DB_USER="${FLEET_DB_USER:-fleetadmin}"
FLEET_DB_NAME="${FLEET_DB_NAME:-fleetmanager}"
FLEET_DB_PASSWORD="${FLEET_DB_PASSWORD:-}"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo."
  exit 1
fi

if [[ -z "${FLEET_DB_PASSWORD}" ]]; then
  echo "Set FLEET_DB_PASSWORD, e.g.:"
  echo "  sudo FLEET_DB_PASSWORD='your-strong-password' bash deploy/scripts/setup-database.sh"
  exit 1
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${FLEET_DB_USER}') THEN
    CREATE ROLE ${FLEET_DB_USER} LOGIN PASSWORD '${FLEET_DB_PASSWORD}';
  ELSE
    ALTER ROLE ${FLEET_DB_USER} WITH PASSWORD '${FLEET_DB_PASSWORD}';
  END IF;
END
\$\$;
SQL

if ! sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${FLEET_DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb -O "${FLEET_DB_USER}" "${FLEET_DB_NAME}"
fi

sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE ${FLEET_DB_NAME} TO ${FLEET_DB_USER};"

echo "Database ready: ${FLEET_DB_NAME} (user: ${FLEET_DB_USER})"
echo "DATABASE_URL=postgresql://${FLEET_DB_USER}:****@127.0.0.1:5432/${FLEET_DB_NAME}"
