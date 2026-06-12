# Monthly Maintenance Checklist — rootdrifter.io

Run on the first of each month. SSH alias `bastion` (root) / `bastion-ghost` (deploy user).
The origin IP is intentionally not recorded here (Cloudflare hides the origin).

## Server

- [ ] Ghost version: `ssh bastion-ghost "cd /var/www/rootdrifter && ghost update --check"` (update if available — backup first).
- [ ] SSL certificate: `ssh bastion "certbot certificates"` (check expiry; auto-renews via `certbot.timer`).
- [ ] Backup verification: `ssh bastion-ghost "ls -lh ~/backups/"` (daily at 03:00, keeps 7).
- [ ] Disk space: `ssh bastion "df -h /"`.
- [ ] fail2ban: `ssh bastion "fail2ban-client status sshd"` (review bans).
- [ ] Health log: `ssh bastion "sudo tail -100 /var/log/ghost-health.log"`.
- [ ] Security headers: `curl -I https://rootdrifter.io` (HSTS / X-Frame / CSP present).
- [ ] Node.js: confirm still on a supported major for the installed Ghost.

## Content

- [ ] Subscriber count: Ghost admin → Members.
- [ ] Analytics review: Cloudflare → Web Analytics.
- [ ] Content calendar: plan next month; de-tease any reviewed posts.
- [ ] Privacy scan: run the canonical denylist over the repos.

## Security

- [ ] Ubuntu updates: `ssh bastion "apt list --upgradable"` (unattended-upgrades handles security).
- [ ] Ghost admin 2FA: verify still enabled.
- [ ] SSH key audit: `ssh bastion "cat ~/.ssh/authorized_keys"` (remove stale keys).
- [ ] Backup restore test: extract one file from the latest backup to confirm integrity.
- [ ] Cloudflare: confirm SSL mode Full (strict), Always Use HTTPS on.

## Quick command reference

```
ssh bastion                                   # root
ssh bastion-ghost "cd /var/www/rootdrifter && ghost ls"   # Ghost status
ssh bastion-ghost "sudo tail -50 /var/www/rootdrifter/content/logs/*.log"
ssh bastion-ghost "~/backup-ghost.sh"         # manual backup
ssh bastion "ufw status verbose"              # firewall
```
