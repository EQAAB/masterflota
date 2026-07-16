#!/usr/bin/env bash
# Daily backup: PostgreSQL dump + uploads archive.
# Cron example (root): 0 2 * * * /var/www/Fleet-Manager/deploy/scripts/backup.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${FLEET_BACKUP_DIR:-/var/backups/fleet-manager}"
STAMP="$(date +%Y-%m-%d_%H%M%S)"

mkdir -p "$BACKUP_DIR"

if [[ -f "$ROOT/backend/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$ROOT/backend/.env"
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL not set in backend/.env"
  exit 1
fi

DUMP="$BACKUP_DIR/db_${STAMP}.sql.gz"
UPLOADS="$BACKUP_DIR/uploads_${STAMP}.tar.gz"

pg_dump "$DATABASE_URL" | gzip > "$DUMP"
tar -czf "$UPLOADS" -C "$ROOT/backend" uploads 2>/dev/null || true

find "$BACKUP_DIR" -name 'db_*.sql.gz' -mtime +14 -delete
find "$BACKUP_DIR" -name 'uploads_*.tar.gz' -mtime +14 -delete

echo "Backup written:"
echo "  $DUMP"
echo "  $UPLOADS"
