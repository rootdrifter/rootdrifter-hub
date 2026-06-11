# Post-Deployment Security Checklist

Run every item after the VPS goes live (Stage 1), before announcing the domain. Pairs with
`nginx/rootdrifter.io.conf` (headers) and `GHOST_ADMIN_HARDENING.md` (admin lockdown).

## TLS / transport

- [ ] **SSL Labs** (`ssllabs.com/ssltest`) → target grade **A** or A+. Fix any incomplete chain
      or weak protocol/cipher (TLS 1.2+ only, no TLS 1.0/1.1).
- [ ] HSTS active and `includeSubDomains` (header is in the nginx config) — confirm with
      `curl -sI https://rootdrifter.io | grep -i strict-transport`.
- [ ] HTTP → HTTPS 301 redirect works (no content served on :80).
- [ ] Certificate auto-renewal (certbot/acme) tested with a dry run.

## Security headers

- [ ] **securityheaders.com** → target **A**. All present in nginx config; verify they actually
      serve:
      `curl -sI https://rootdrifter.io | grep -iE 'x-frame|x-content|referrer|permissions|content-security|strict-transport'`
- [ ] CSP serves without breaking Ghost: open the site + `/ghost/` admin, check the browser
      console for **CSP violation** errors. Ghost needs `script-src 'self' 'unsafe-inline'` and
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com` (both already in the config).

## Content / mixed-content

- [ ] No **mixed content**: browser console shows zero `http://` asset loads on any page
      (home, blog, about, subscribe, all 6 portfolio pages).
- [ ] All fonts load over HTTPS from `fonts.gstatic.com` (already preconnected).
- [ ] Subscribe (Members) flow works end-to-end over HTTPS (magic-link email arrives).

## Ghost admin exposure

- [ ] `/ghost/` admin is **not** openly reachable from the internet — restrict by Cloudflare
      Access, IP allow-list, or tunnel (see `GHOST_ADMIN_HARDENING.md`). Verify from an
      unauthorised network that `/ghost/` is blocked.
- [ ] Ghost admin account has a strong unique password + **2FA / staff device verification** on.
- [ ] No default/demo staff accounts remain.

## Application / data

- [ ] `config.production.json` is **gitignored** and contains the only copy of Mailgun creds —
      confirm it is not in any repo (`git -C <repo> ls-files | grep production.json` → empty).
- [ ] Database file permissions are owner-only (`ghost-prod.db` not world-readable).
- [ ] Automated backup running (`scripts/backup-ghost.sh` via cron/systemd timer); restore tested
      once.
- [ ] Ghost version current; subscribe to the Ghost security advisory channel.

## Privacy / brand integrity

- [ ] Full-site privacy scan on the live domain: no daemon codenames, no `passmail`, no
      `rootdrift` without "er", no key material. (Re-run the standing scan against fetched HTML.)
- [ ] Accuracy invariants intact on the live portfolio pages (oracle 93.97/99.11 not swapped;
      mirage 88,647/ICC 0.98; spectre Apache 2.4.58/CWE-548; nullbyte nine profiles/Titan M2;
      ironveil Nitrokey 3A NFC).

## Verification one-liner

```
for p in "" blog/ about/ subscribe/ portfolio/ portfolio/ironveil/ portfolio/nullbyte/ \
  portfolio/spectre/ portfolio/oracle/ portfolio/mirage/ portfolio/gauntlet/; do
  printf "%-45s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://rootdrifter.io/$p)"
done
```
All lines must be `200`.
