# VM deployment assets

See **[docs/deploy-vm.md](../docs/deploy-vm.md)** for the full guide.

```bash
sudo bash deploy/scripts/setup-server.sh
sudo FLEET_DB_PASSWORD='...' bash deploy/scripts/setup-database.sh
sudo bash deploy/scripts/configure-nginx.sh 169.58.28.189
bash deploy/scripts/deploy.sh --init
```
