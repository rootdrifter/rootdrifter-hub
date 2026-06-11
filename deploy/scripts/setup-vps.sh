#!/usr/bin/env bash
# setup-vps.sh — documented fresh-VPS provisioning runbook for a self-hosted Ghost (rootdrifter.io).
# Target: a clean Hetzner Cloud VPS (Ubuntu 24.04 LTS, CX22 or larger). Run as root, step by step —
# read each block before running it. This is a runbook, not a fire-and-forget installer.
set -euo pipefail

DOMAIN="rootdrifter.io"
GHOST_USER="ghost-mgr"
GHOST_DIR="/var/www/ghost"
NODE_MAJOR="22"   # Ghost 6 supports Node 20 and 22 LTS

echo "== 1. Base system =="
apt update && apt -y upgrade
apt -y install build-essential nginx ufw fail2ban unattended-upgrades curl

echo "== 2. Firewall (open SSH, HTTP, HTTPS only) =="
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== 3. Node $NODE_MAJOR via NodeSource =="
curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash -
apt -y install nodejs
node -v && npm -v

echo "== 4. Ghost-CLI =="
npm install -g ghost-cli@latest

echo "== 5. Non-root Ghost manager user =="
adduser --disabled-password --gecos "" "$GHOST_USER" || true
usermod -aG sudo "$GHOST_USER"
# Ghost-CLI refuses to install as root: the remaining steps run as $GHOST_USER.

echo "== 6. Ghost install dir =="
mkdir -p "$GHOST_DIR"
chown "$GHOST_USER:$GHOST_USER" "$GHOST_DIR"
chmod 775 "$GHOST_DIR"

cat <<EOF

== 7. Manual steps (run as $GHOST_USER, NOT root) ==
  su - $GHOST_USER
  cd $GHOST_DIR
  ghost install --db sqlite3 --url https://$DOMAIN --process systemd --no-setup-nginx --no-setup-ssl
  # Then drop in deploy/config.production.template.json -> config.production.json and fill placeholders.

== 8. Nginx + TLS ==
  cp deploy/nginx/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN.conf
  ln -s /etc/nginx/sites-available/$DOMAIN.conf /etc/nginx/sites-enabled/
  mkdir -p /var/www/certbot
  apt -y install certbot python3-certbot-nginx
  certbot --nginx -d $DOMAIN -d www.$DOMAIN --redirect
  nginx -t && systemctl reload nginx

== 9. Deploy theme + verify ==
  deploy/scripts/deploy-theme.sh $GHOST_DIR
  deploy/scripts/health-check.sh https://$DOMAIN

== 10. Ongoing ==
  - deploy/scripts/backup-ghost.sh in cron (daily)
  - systemctl enable ghost_${DOMAIN//./-}  (Ghost-CLI sets this up)
  - unattended-upgrades already enabled for security patches
EOF
echo "Runbook complete — perform the manual steps above."
