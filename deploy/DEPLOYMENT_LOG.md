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

## S1 go-live — COMPLETE (2026-06-12)

**Ghost first-run (operator):** owner account created, **rootdrifter theme activated**, members
enabled.

**Content migrated to production (via Admin API):** 6 portfolio pages + about/contact + **12 posts**
(3 published + 9 content drafts) copied from the local dev Ghost — preserving the corrected hardware
values (ironveil wg-CH-FI-2/Quad9/aes-xts; nullbyte Ghost-not-Wraith/boot-hash/Titan M2). The 2
placeholder templates + Ghost's default "coming soon" were intentionally not migrated. All
`/portfolio/...`, `/blog/`, `/about/`, `/contact/` routes verified **200 through Cloudflare**, theme
confirmed active (not Casper).
> Migration note: Cloudflare returned error 1010 for the default Python-urllib User-Agent — the
> migration client sets a normal UA to pass CF bot detection.

**GitHub Pages redirect cutover (S1-03) — ACTIVATED.** All 7 redirects live (verified by serving the
meta-refresh content — curl does not follow client-side redirects):
`rootdrifter.github.io/` → `rootdrifter.io`; each `rootdrifter.github.io/<project>/` →
`rootdrifter.io/portfolio/<project>/`. Per-project redirects replace each project repo's
`docs/index.html` (the hub-subdir approach in the directive would have been shadowed by the project
repos' own Pages). Originals preserved in git history (rollback = `git revert`).

**S1-04 hardening pass:** logrotate for Ghost logs (`su ghost ghost`, copytruncate, 14-day);
`server_tokens off`; performance baseline (`deploy/PERFORMANCE_BASELINE.md` — sub-400ms via CF);
monthly maintenance checklist (`deploy/MONTHLY_MAINTENANCE.md`). Security audit: ports 22/80/443 +
loopback 2368/53 only; **fail2ban actively banning** (5 IPs banned, real SSH attacks blocked); UFW
active; auto-updates on.

### Remaining operator actions (dashboard-only — cannot be automated)
- **Cloudflare:** confirm SSL/TLS = **Full (strict)**, Always Use HTTPS on; enable Brotli / Auto
  Minify / HTTP/3 (optional perf); set up **Email Routing** for `hello@rootdrifter.io`; add
  **Web Analytics**.
- **Mailgun:** create account, verify domain, add the SPF/DKIM/DMARC DNS records
  (`deploy/mailgun/`), then put the SMTP creds in `config.production.json` (never commit) and
  `ghost restart` for transactional email (member magic-links / newsletters).
- **Ghost admin:** Email newsletter → from: rootdrifter; review + de-tease posts when ready.
