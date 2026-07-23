# VM deployment assets

See **[docs/deploy-vm.md](../docs/deploy-vm.md)** for the full guide.

```bash
sudo bash deploy/scripts/setup-server.sh
sudo FLEET_DB_PASSWORD='...' bash deploy/scripts/setup-database.sh
sudo bash deploy/scripts/configure-nginx.sh 169.58.28.189
bash deploy/scripts/deploy.sh --init
```

## GitHub Actions

Secrets: `SSH_PRIVATE_KEY`, `VM_HOST`, `VM_USER` (optional: `VM_APP_PATH`, `VM_BRANCH`).

```bash
sudo DEPLOY_USER=deploy bash deploy/scripts/setup-ci-deploy.sh
bash deploy/scripts/setup-git-deploy-key.sh   # as deploy user on VM
```

Push to `main` or run `.github/workflows/deploy-vm.yml` manually.
