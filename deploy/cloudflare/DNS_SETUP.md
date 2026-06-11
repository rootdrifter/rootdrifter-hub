# Cloudflare DNS — rootdrifter.io

DNS plan for `rootdrifter.io`, covering the **temporary GitHub Pages** state, the **production Ghost
VPS** state, **email routing** (Mailgun), Cloudflare hardening, and a **zero-downtime switchover**.

> No secrets here. `[HETZNER_VPS_IP]` and Mailgun selector/values are filled in the Cloudflare
> dashboard, not in this repo. As of 2026-06-11 `rootdrifter.io` does **not** resolve yet — nothing
> below is live; this is the apply-when-ready plan.

## A. Current / interim — point the apex at GitHub Pages (optional bridge)

Use this only if you want `rootdrifter.io` to serve the existing static portfolio (currently at
`rootdrifter.github.io`) *before* the Ghost VPS is ready. Otherwise skip straight to section B.

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `@` | `185.199.108.153` | DNS only (grey) |
| A | `@` | `185.199.109.153` | DNS only (grey) |
| A | `@` | `185.199.110.153` | DNS only (grey) |
| A | `@` | `185.199.111.153` | DNS only (grey) |
| CNAME | `www` | `rootdrifter.github.io` | DNS only (grey) |

- Add a `CNAME` file containing `rootdrifter.io` to the `rootdrifter.github.io` repo root, enable
  **Enforce HTTPS** in the repo's Pages settings. **Keep these records DNS-only** (grey cloud) — GitHub
  serves its own cert; proxying can fight Pages' cert issuance.
- ⚠️ Do **not** add the `CNAME` file or switch DNS until you have decided to go live on this domain —
  see the standing safety note (dead links on the live portfolio).

## B. Production — point the apex at the Ghost VPS

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| A | `@` | `[HETZNER_VPS_IP]` | Proxied (orange) |
| CNAME | `www` | `rootdrifter.io` | Proxied (orange) |

- Orange-cloud (proxied) gives Cloudflare's edge TLS, caching, and DDoS protection. The origin VPS
  still needs its own Let's Encrypt cert (see `deploy/nginx/`) because SSL mode is **Full (Strict)**.

## C. Email routing (Mailgun) — see `deploy/mailgun/MAILGUN_SETUP.md`

Sending subdomain `mg.rootdrifter.io` keeps the apex reputation isolated. All **DNS only** (grey):

| Type | Name | Value |
|------|------|-------|
| MX | `mg` | `mxa.mailgun.org` (priority 10) |
| MX | `mg` | `mxb.mailgun.org` (priority 10) |
| TXT | `mg` | `v=spf1 include:mailgun.org ~all` |
| TXT | `<selector>._domainkey.mg` | `k=rsa; p=[DKIM_PUBLIC_KEY]` (from Mailgun) |
| CNAME | `email.mg` | `mailgun.org` (open/click tracking — optional) |
| TXT | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@rootdrifter.io` |

## D. Cloudflare settings (SSL/TLS + Speed)

- **SSL/TLS mode:** Full (Strict) — edge↔origin encrypted *and* origin cert validated.
- **Always Use HTTPS:** On (edge-level redirect; nginx also redirects as defence-in-depth).
- **Minimum TLS Version:** 1.2.
- **Automatic HTTPS Rewrites:** On.
- **Brotli:** On. **HTTP/3 (with QUIC):** On. **0-RTT:** optional.
- **Auto Minify:** legacy/deprecated in the new dashboard — if present, leave JS/CSS minify Off (the
  theme assets are already terse and Ghost fingerprints them; double-minify risks breaking inline JS).
- **Caching:** Standard. Add a cache rule to **bypass cache** for `/ghost/*` and `/members/*` so admin
  and member auth are never cached.

## E. Zero-downtime switchover (Pages → Ghost)

1. Stand the Ghost VPS up fully and verify it over its raw IP / a temporary hostname (`health-check.sh`).
2. Lower the apex `A` record TTL to ~2 min a day ahead (if records already exist).
3. Cut over: change the apex `A` from the GitHub IPs to `[HETZNER_VPS_IP]`, set proxy to orange.
4. Watch `health-check.sh https://rootdrifter.io` and Cloudflare analytics; Ghost serves immediately
   on propagation. Because both states can serve the same content, visitors never hit an error.
5. Once stable, enable HSTS (nginx already sends it) and raise TTL back to ~1 h.
6. Run `source-material/activate-blog-links.sh` to flip the portfolio's blog links live (only now).
