# Deployment Log — rootdrifter.io

## S1-01 — VPS provisioning (2026-06-12) — INFRASTRUCTURE COMPLETE

**Server:** bastion · `[origin IP — recorded privately, hidden behind Cloudflare]` · Hetzner CPX22 · Nuremberg (nbg1) · Ubuntu 26.04 LTS
(kernel 7.0.0) · 2 vCPU / 3.7 GB RAM / 75 GB disk.

**Stack versions (as deployed):**
| Component | Version |
|-----------|---------|
| Ghost | 6.44.1 (production, systemd `ghost_rootdrifter-io.service`) |
| Ghost-CLI | 1.29.3 |
| Node.js | v22.22.3 (system-wide via NodeSource) |
| nginx | 1.28.3 |
| certbot | 4.0.0 |
| fail2ban | 1.1.0 |
| Database | SQLite (`content/data`) |

**Deviations from the directive (documented):**
- **Node via NodeSource (system-wide), not nvm.** Ghost-CLI's production install runs the Ghost
  process under a dedicated `ghost` system user, which cannot reach an nvm node in
  `ghost-runner`'s home without world-readable home perms. System-wide node at `/usr/bin/node`
  resolves this cleanly (and is what Ghost's own production docs use). Home perms left at 750.
- **`ghost install` flags:** added `--db sqlite3 --no-setup-nginx --no-setup-ssl` — without
  `--db sqlite3` it defaults to MySQL (no server present) and would fail; nginx/SSL are managed
  separately.
- **SSL via `certbot certonly --webroot`, not `--nginx`.** The ACME challenge path proved
  reachable through Cloudflare's proxy (tested before issuing), so **no grey-cloud was needed** —
  the orange cloud stayed on throughout.

**Hardening:**
- UFW: deny incoming / allow outgoing; only 22, 80, 443 open. Ghost `:2368` is loopback-only and
  externally unreachable (verified: external `:2368` → no response).
- fail2ban: sshd jail enabled (systemd backend, maxretry 3, bantime 3600).
- SSH: `/etc/ssh/sshd_config.d/99-hardening.conf` — `PermitRootLogin prohibit-password`,
  `PasswordAuthentication no`, `MaxAuthTries 3`, keepalive. Validated with `sshd -t`; connectivity
  re-verified after restart.
- Unattended security upgrades enabled.
- Deploy user `ghost-runner` (NOPASSWD sudo — broad, required by Ghost-CLI for systemd/perm setup;
  can be tightened post-install). SSH alias `bastion-ghost`.

**TLS / origin:**
- Let's Encrypt cert for `rootdrifter.io` + `www.rootdrifter.io`. Valid **2026-06-11 → 2026-09-09**.
- Auto-renewal: `certbot.timer` active; **`certbot renew --dry-run` succeeded**.
- nginx: HTTP→HTTPS 301; HSTS, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff,
  Referrer-Policy, Permissions-Policy, and a Ghost-correct CSP — verified present at origin **and**
  through Cloudflare.

**Cloudflare:** orange-cloud proxy on; `rootdrifter.io` resolves to CF IPs (188.114.x). CF→origin
SSL works (origin 443 with the LE cert), so the effective mode is Full/Full-strict-compatible.

**Backups & monitoring:**
- `~ghost-runner/backup-ghost.sh` — daily 03:00 cron; keeps 7; first backup OK (96K).
- `~ghost-runner/health-check.sh` — every 5 min; restarts Ghost via systemd if down.

**Verification (Task 10):**
- `https://rootdrifter.io/` → **200** (through Cloudflare). `http://` → 301.
- Origin `:443` → 200. Ghost `:2368` external → blocked.
- Ports listening: 22, 80, 443 (public) + 127.0.0.1:2368 (loopback).

### IMPORTANT — current served state
The production Ghost is a **fresh install**: the **default Casper theme is active** (the rootdrifter
theme files are deployed but not yet activated) and **no content is imported** (so `/portfolio/`
and project pages currently 404/400). `https://rootdrifter.io/ghost/` shows the **first-run setup
screen**.

### Operator actions to complete go-live (Ghost first-run — cannot be automated)
1. Visit `https://rootdrifter.io/ghost/` → create the owner account (your email + password) →
   **enable 2FA**. (The admin credentials are yours to set; I did not create the account.)
2. Settings → Design → activate the **rootdrifter** theme.
3. Settings → Membership → enable members; Email newsletter → from: rootdrifter.
4. Import content: either re-run the page/post creation scripts against production (preferred —
   recreates the 6 portfolio pages + 12 posts from `content/`), or import a Ghost export. Provide an
   Admin API integration key and this can be scripted.
5. Cloudflare dashboard: confirm SSL/TLS = **Full (strict)**; Always Use HTTPS on; email routing for
   `hello@rootdrifter.io`. Mailgun for transactional email (`deploy/mailgun/`).

### HELD — GitHub Pages redirect cutover (S1-03)
**Not activated.** `rootdrifter.io` returns 200, but it currently serves the empty default Ghost.
Activating the redirects now would point the live recruiter-facing portfolio at an empty "Ghost"
page. The cutover should run **only after** the theme is activated and the portfolio pages are
imported (so `/portfolio/...` serve 200). This honours the migration's intent, not just the literal
200-check.
