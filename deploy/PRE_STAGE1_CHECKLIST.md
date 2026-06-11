# Pre-Stage-1 Checklist

Everything that must be true before the Stage 1 VPS deployment + GitHub Pages → Ghost cutover.
Status reflects actual state as of 2026-06-11. Companion to `MIGRATION_CUTOVER.md` (the runbook)
and `SECURITY_CHECKLIST.md` (post-deploy verification).

## Migration content & theme (agent-doable — all done)

- [x] **Hub migration copies synced to confirmed hardware values** — `portfolio-ironveil.md` +
      `ironveil-checklist.js` (wg-CH-FI-2/wg-SE-FI-1, Quad9 DoH, `*:53`, aes-xts-plain64/512-bit,
      dracut-sshd 0.7.1-5.fc44); `portfolio-nullbyte.md` + `nullbyte-matrix.js` (boot hash, Titan M2
      + Trusty TEE + Tensor G5 core, Android 16/build 2026060601, corrected third-profile codename
      to Ghost). **Synced 2026-06-11.**
- [x] **Six portfolio content pages** present in `content/pages/portfolio-*.md`.
- [x] **Six interactive components** present in `theme/assets/js/` (checklist, matrix, timeline,
      chart, stepper, radar).
- [x] **Portfolio templates** — `theme/portfolio-index.hbs` + `theme/portfolio-project.hbs`.
- [x] **routes.yaml** carries the `/portfolio/` + six project routes (valid Ghost YAML).
- [x] **Ghost theme gscan: 0 errors** (1 acceptable warning — custom fonts, intentional; the theme
      ships its own typography).
- [x] **All seven portfolio routes return 200 locally** (`/portfolio/` + six projects).
- [x] **Privacy scan clean** — 0 hits across the hub (no stale tunnel name, no superseded profile
      codename, no private codenames / key material). "Ghost CMS" (platform) and "Ghost" (profile
      codename) both legitimately present.

## Deployment artefacts (agent-doable — done; live test happens in Stage 1)

- [x] **Nginx config** — `deploy/nginx/rootdrifter.io.conf` (TLS, all 7 security headers,
      Ghost-correct CSP, security.txt).
- [x] **Production config template** — `deploy/config.production.template.json` (valid JSON,
      bracketed placeholders, no real secrets, Ghost bound to loopback).
- [x] **Provisioning + ops scripts** — `setup-vps.sh`, `deploy-theme.sh`, `backup-ghost.sh`,
      `health-check.sh`.
- [x] **Mailgun setup guide** — `deploy/mailgun/MAILGUN_SETUP.md` + `ACTIVATION_CHECKLIST.md`.
- [x] **DNS cutover procedure** — `deploy/cloudflare/DNS_SETUP.md`.
- [x] **Migration cutover runbook** — `deploy/MIGRATION_CUTOVER.md` (DNS, redirect activation,
      verification matrix, rollback).
- [x] **GitHub redirect pages** — `rootdrifter.github.io/redirect-ready/` (hub + 6 projects;
      NOT active — activated in Stage 1).
- [x] **Admin hardening + security checklists** — `GHOST_ADMIN_HARDENING.md`,
      `SECURITY_CHECKLIST.md`.

## Stage 1 — operator actions (cannot be done by the agent)

- [ ] Register VPS provider account + provision the server (see `source-material/STAGE1_KICKOFF.md`).
- [ ] Run `setup-vps.sh`: Node 20 + Ghost-CLI, nginx, TLS (certbot), `ghost install` with the
      production config (fill Mailgun creds — never commit the filled file).
- [ ] Cloudflare DNS for rootdrifter.io → server IP (`DNS_SETUP.md`).
- [ ] Mailgun domain verification + SMTP creds (`ACTIVATION_CHECKLIST.md`).
- [ ] Ghost first-run admin setup at `https://rootdrifter.io/ghost/`; activate the `rootdrifter`
      theme; restrict `/ghost/` per `GHOST_ADMIN_HARDENING.md`; enable 2FA.
- [ ] Upload `routes.yaml`; create the 6 portfolio pages + seed content (reuse the Admin-API
      scripts).
- [ ] Run `SECURITY_CHECKLIST.md` against the live domain (SSL Labs, securityheaders.com,
      mixed-content + CSP console check).
- [ ] Review + de-tease approved posts (`content/APPROVAL_QUEUE.md`); update the homepage count.
- [ ] Execute the cutover (`MIGRATION_CUTOVER.md`) — activate redirects only after the production
      routes verify at 200.

## Verdict

**Agent-side: COMPLETE.** Theme, content (with confirmed hardware values), components, routes,
redirects, and all deployment documentation are in place and verified. The remaining items are
operator actions that require the live VPS, DNS, and admin credentials.
