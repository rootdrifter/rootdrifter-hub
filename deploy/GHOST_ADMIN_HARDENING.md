# Ghost Admin Hardening Guide (production)

Steps to harden the Ghost admin surface on the VPS. The admin panel (`/ghost/`) is the highest-
value target on the platform — a compromise there is full content control. Locking it down is
the single most important post-deploy security task.

## 1. Restrict admin access (do this first)

The admin panel should **not** be openly reachable from the internet. Pick one:

- **Cloudflare Access (recommended):** put `/ghost/` behind a Cloudflare Access policy (email
  OTP or IdP). Zero open admin surface; no VPN to manage.
- **IP allow-list in nginx:** in a `location ^~ /ghost/ { allow <your-ip>; deny all; … }` block,
  restrict to known admin IPs. Simple, but breaks on dynamic IPs.
- **Cloudflare Tunnel / WireGuard:** expose `/ghost/` only over a private tunnel; the public
  nginx never proxies it.

Verify from an unauthorised network: `curl -I https://rootdrifter.io/ghost/` should be blocked
(403/connection refused), not a login page.

## 2. Account security

- Strong, unique password (password manager) on the owner account.
- Enable **staff device verification / 2FA** (Ghost emails a verification code for new devices).
- One owner account only; no shared logins. If contributors are added later, give them the
  **lowest role** that works (Contributor < Author < Editor < Administrator).
- Audit staff accounts quarterly: remove anyone who no longer needs access; check no unexpected
  invites are pending.

## 3. Custom admin path (optional, defence-in-depth)

Ghost's admin path is `/ghost/` by default. Changing it is *obscurity, not security* — do it only
in addition to step 1, never instead of it. (Requires `admin.url` config + nginx location update.)

## 4. Secrets & config

- `config.production.json` holds the only copy of the Mailgun SMTP credentials. It is gitignored
  and must never be committed (verify: `git ls-files | grep production.json` is empty).
- File permissions: `chmod 600 config.production.json`, owned by the ghost service user.
- Rotate Mailgun credentials if they are ever exposed; regenerate from the Mailgun dashboard.

## 5. Backups

- `scripts/backup-ghost.sh` on a cron/systemd timer (DB + content/images + theme).
- Store at least one copy off the VPS.
- **Test a restore** once before relying on it — an untested backup is a hope, not a control.

## 6. Update procedure

- Track Ghost releases; security patches land in point releases.
- Update flow: backup → `ghost update` → smoke-test (home, a post, subscribe, `/ghost/` login) →
  if broken, `ghost update --rollback`.
- Keep the host OS patched (`unattended-upgrades` for security updates).

## 7. Monitoring

- nginx access/error logs reviewed for repeated `/ghost/` probing.
- Optional: fail2ban on the nginx auth log to throttle brute-force against the admin path.
- Health check (`scripts/health-check.sh`) on a timer to alert if the site goes down.

## Quick post-deploy verification

- [ ] `/ghost/` blocked from an unauthorised network
- [ ] 2FA / device verification enabled on the owner account
- [ ] `config.production.json` mode 600, not in git
- [ ] backup timer active + one restore tested
- [ ] `ghost update --rollback` path understood before the first update is needed
