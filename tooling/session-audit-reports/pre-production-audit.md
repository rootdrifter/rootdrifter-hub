# Pre-Production Audit — rootdrifter.io Ghost platform

Date: 2026-06-11 · Session S0-07 · Instance: local dev (http://localhost:2368), Ghost 6.x,
theme `rootdrifter` v1.0.0. This is the ruthless pre-Stage-1 pass — every issue caught here is
cheaper than catching it in production.

## Verdict: PRODUCTION-READY (theme + docs)

The theme passes gscan with zero errors, every public route returns the expected status, no
render errors or privacy leaks appear in any rendered page, and the deployment documentation is
complete. The only remaining gates are **operational** (provision the VPS, restrict admin, run
the live-domain security scans) and **editorial** (resolve teaser tags after content review) —
neither is a theme defect.

## Task 1 — Full theme audit

**URL status matrix (15 URLs):** all as expected.

| Result | URLs |
|--------|------|
| 200 | home, /blog/, /about/, /contact/, /subscribe/, /portfolio/, all 6 /portfolio/<project>/, /sitemap.xml, /robots.txt |
| 404 (correct) | /this-404-test-page (301→ trailing-slash then 404 — Ghost default, correct) |

**Per-page checks (all 12 content pages):**
- Brand reference present on every page (12–30 `rootdrifter` refs each).
- Render errors (`undefined` / `NaN` / `>null<`): **0** on every page.
- CSS loads (`screen.css` + `tokens.css`) on every page.
- **Privacy content scan** (private codenames, mail-handle, malformed org handle, key material)
  across all 12 rendered pages: **0 hits**.
- **Accuracy invariants** verified in rendered portfolio output: oracle TerraCNN 93.97%/0.9390 vs
  ResNet-18 99.11%/0.9916 + ARI 0.6478 (not swapped); mirage 88,647 + ICC 0.98; nullbyte nine
  profiles incl. Ghost + Façade; spectre Apache 2.4.58 + CWE-548; ironveil tunnels wg-CH-FI-2 +
  wg-SE-FI-1, AdGuard Quad9 DoH, fw 1.8.3.

## Task 2 — Cross-browser compatibility

Full report: `compatibility-audit.md`. Summary: **no blockers.** CSS uses custom properties +
grid/flex with single-column fallbacks; 6 interactive components written in **ES5** (verified 0
arrow-function/`const`/`let`/`async`), each mounted over a static markdown fallback so data
survives JS-off. Reduced-motion + print + dark-first handled. Target: current
Chrome/Firefox/Safari/Edge; IE11 explicitly out of scope.

## Task 3 — Security headers (production-readiness)

nginx config (`deploy/nginx/rootdrifter.io.conf`) already sets all seven required headers:
HSTS, X-Frame-Options SAMEORIGIN, X-Content-Type-Options nosniff, X-XSS-Protection,
Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy (camera/mic/geo +
interest-cohort off), and a Ghost-correct CSP (`script-src 'self' 'unsafe-inline'`,
`style-src … fonts.googleapis.com`, `font-src … fonts.gstatic.com`, `connect-src 'self'`).
Post-deploy verification steps captured in the new `deploy/SECURITY_CHECKLIST.md`.

## Task 4 — Ghost configuration review

- **Dev config:** url localhost:2368 (correct), SQLite (correct for stage), mail transport Direct
  (dev default), Ghost bound to 127.0.0.1, no credentials present. Clean.
- **Prod template** (`deploy/config.production.template.json`): valid JSON, Ghost bound to
  loopback (nginx is the only public listener), Mailgun creds as clearly-bracketed
  `[MAILGUN_USER]`/`[MAILGUN_PASS]` placeholders, no real secrets, header comment flags it as
  gitignored. Clean.
- **New:** `deploy/GHOST_ADMIN_HARDENING.md` — admin-surface lockdown (Cloudflare Access / IP
  allow-list), 2FA, secrets handling, backup/restore, update/rollback, monitoring.

## Task 5 — Final theme polish

- **gscan:** 0 errors, **1 warning** — "Missing support for custom fonts". **Accepted:** this is
  an optional newer Ghost feature (admin font-picker); the theme ships its own typography
  (Share Tech Mono + Barlow) by design. Documented as intentional.
- **Asset sizes:** largest single file is screen.css at 24 KB; no JS file exceeds 12 KB; **nothing
  over 100 KB** — no optimisation candidates.
- **Creative review:** index.hbs and post.hbs re-read; teaser gate, related-posts, TOC, and
  custom-settings wiring are coherent. No further changes warranted pre-production.

## Outstanding before Stage 1 go-live (operational, not theme defects)

1. Provision VPS + nginx + TLS; run `SECURITY_CHECKLIST.md` against the live domain (SSL Labs,
   securityheaders.com, mixed-content + CSP console check).
2. Restrict `/ghost/` per `GHOST_ADMIN_HARDENING.md`; enable 2FA.
3. Resolve teaser tags after content review (`content/APPROVAL_QUEUE.md`).
4. Execute the GitHub Pages → Ghost cutover per `deploy/MIGRATION_CUTOVER.md`.
