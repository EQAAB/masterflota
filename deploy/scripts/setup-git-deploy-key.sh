#!/usr/bin/env bash
# Generate a read-only deploy key on the VM so 'git fetch' works during CI deploy.
# Run as the deploy user (not root):
#   bash deploy/scripts/setup-git-deploy-key.sh
#
# Then add the printed public key in GitHub:
#   Repo → Settings → Deploy keys → Add deploy key (read-only)
set -euo pipefail

KEY_PATH="${HOME}/.ssh/github_fleet_manager_deploy"
SSH_CONFIG="${HOME}/.ssh/config"

mkdir -p "${HOME}/.ssh"
chmod 700 "${HOME}/.ssh"

if [[ ! -f "$KEY_PATH" ]]; then
  ssh-keygen -t ed25519 -f "$KEY_PATH" -N "" -C "fleet-manager-vm-git-pull"
fi
chmod 600 "$KEY_PATH"
chmod 644 "${KEY_PATH}.pub"

if [[ ! -f "$SSH_CONFIG" ]] || ! grep -q "Host github.com" "$SSH_CONFIG" 2>/dev/null; then
  cat >>"$SSH_CONFIG" <<'EOF'

Host github.com
  IdentityFile ~/.ssh/github_fleet_manager_deploy
  IdentitiesOnly yes
EOF
  chmod 600 "$SSH_CONFIG"
fi

KNOWN_HOSTS="${HOME}/.ssh/known_hosts"
if ! grep -q '^github.com' "$KNOWN_HOSTS" 2>/dev/null; then
  echo "==> Adding github.com to known_hosts"
  ssh-keyscan -t rsa,ecdsa,ed25519 github.com >>"$KNOWN_HOSTS" 2>/dev/null
fi
chmod 600 "$KNOWN_HOSTS" 2>/dev/null || true

echo "==> Add this deploy key in GitHub (Settings → Deploy keys, read-only):"
echo ""
cat "${KEY_PATH}.pub"
echo ""
echo "==> Point origin at SSH (if still HTTPS):"
echo "  cd /var/www/Fleet-Manager"
echo "  git remote set-url origin git@github.com:YOUR_ORG/Fleet-Manager.git"
echo ""
echo "==> Test:"
echo "  ssh -T git@github.com"
echo "  cd /var/www/Fleet-Manager && git fetch origin main"
