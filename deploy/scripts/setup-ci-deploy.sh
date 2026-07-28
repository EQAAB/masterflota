#!/usr/bin/env bash
# One-time VM setup for GitHub Actions deploy (passwordless sudo for deploy.sh).
# Run on the server as root:
#   sudo DEPLOY_USER=deploy bash deploy/scripts/setup-ci-deploy.sh
#
# Also add the GitHub Actions SSH public key to:
#   /home/$DEPLOY_USER/.ssh/authorized_keys
set -euo pipefail

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash deploy/scripts/setup-ci-deploy.sh"
  exit 1
fi

DEPLOY_USER="${DEPLOY_USER:-deploy}"

if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  echo "User '$DEPLOY_USER' does not exist. Create it first, e.g.:"
  echo "  sudo adduser $DEPLOY_USER"
  exit 1
fi

SUDOERS_FILE="/etc/sudoers.d/fleet-manager-deploy"
cat >"$SUDOERS_FILE" <<EOF
# Fleet Manager — passwordless sudo for CI deploy (dedicated deploy user only)
${DEPLOY_USER} ALL=(ALL) NOPASSWD: ALL
EOF
chmod 440 "$SUDOERS_FILE"
visudo -cf "$SUDOERS_FILE"

usermod -aG www-data "$DEPLOY_USER" 2>/dev/null || true

APP_PATH="${APP_PATH:-/var/www/Fleet-Manager}"
if [[ -d "$APP_PATH" ]]; then
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$APP_PATH"
  echo "Set ownership: ${DEPLOY_USER}:${DEPLOY_USER} on $APP_PATH"
fi

DEPLOY_HOME="$(getent passwd "$DEPLOY_USER" | cut -d: -f6)"
if [[ -n "$DEPLOY_HOME" && -d "$DEPLOY_HOME" ]]; then
  chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "$DEPLOY_HOME"
  echo "Set ownership: ${DEPLOY_USER}:${DEPLOY_USER} on $DEPLOY_HOME"
fi

sudo -u "$DEPLOY_USER" git -c safe.directory="$APP_PATH" status >/dev/null 2>&1 || true

echo "Sudoers configured for user: $DEPLOY_USER"
echo ""
echo "Next steps:"
echo "  1. Add GitHub Actions SSH *public* key to ~${DEPLOY_USER}/.ssh/authorized_keys"
echo "  2. Run as ${DEPLOY_USER}: bash deploy/scripts/setup-git-deploy-key.sh"
echo "  3. Add GitHub repo secrets: SSH_PRIVATE_KEY, VM_HOST, VM_USER=${DEPLOY_USER}"
echo "  4. Push to main (or run workflow manually)"
echo ""
echo "Verify as ${DEPLOY_USER}: sudo -n systemctl status fleet-api"
