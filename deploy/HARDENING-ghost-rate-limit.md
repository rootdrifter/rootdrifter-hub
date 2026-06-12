# Hardening — Ghost admin login rate limiting (J1)

Adds nginx rate limiting to the Ghost **login endpoint** to blunt password brute-forcing, scoped so it
does **not** touch the rest of the admin panel/API. Prepared as a reviewed, version-controlled change
rather than hot-applied — apply it from the console where you can immediately confirm your own
`/ghost/` login still works (and ideally at the same time you fix the Admin-API auth issue below and
enable admin 2FA).

## What changed (in `nginx/rootdrifter.io.conf`)
1. **http-scope zone** (top of file): `limit_req_zone $binary_remote_addr zone=ghost_login:10m rate=10r/m;`
2. **A dedicated location** for the auth endpoint only:
   ```nginx
   location = /ghost/api/admin/session/ {
       limit_req zone=ghost_login burst=5 nodelay;
       limit_req_status 429;
       proxy_pass http://127.0.0.1:2368;
       # + the standard proxy_set_header lines
   }
   ```

### Why scoped to `/ghost/api/admin/session/` and **not** all of `/ghost/`
The admin panel fires dozens of API requests per page load. A `limit_req` on the whole `/ghost/`
prefix would 429 the panel itself and break the UI. Login (`POST .../session/`) is the only endpoint a
brute-forcer hits repeatedly, so that is the only thing throttled. `burst=5 nodelay` lets a human fat-
finger their password a few times; sustained guessing is capped at 10/min.

## Apply (from the bastion, as root)
```bash
# 1. Back up the live config FIRST
cp /etc/nginx/sites-available/rootdrifter.io /root/rootdrifter.io.nginx.bak.$(date +%F)

# 2. Add the two pieces (copy from this repo's deploy/nginx/rootdrifter.io.conf):
#    - the limit_req_zone line at http scope (paste above the first `server {`)
#    - the `location = /ghost/api/admin/session/ { ... }` block (paste just above `location /ghost/`)

# 3. Validate BEFORE reloading — nginx refuses a bad config, so the site stays up
nginx -t

# 4. Reload only if the test passed
systemctl reload nginx

# 5. VERIFY immediately
curl -s -o /dev/null -w "%{http_code}\n" https://rootdrifter.io           # expect 200
curl -s -o /dev/null -w "%{http_code}\n" https://rootdrifter.io/ghost/    # expect 200/302
#    then log into /ghost/ in a browser and confirm the panel loads normally
```

## Rollback (if anything misbehaves)
```bash
cp /root/rootdrifter.io.nginx.bak.<date> /etc/nginx/sites-available/rootdrifter.io
nginx -t && systemctl reload nginx
```

## Note: Cloudflare already fronts this origin
A WAF/rate-limit rule at the Cloudflare edge (Security → WAF → Rate limiting rules, on the
`/ghost/api/admin/session/` path) is an even better place for this, because it stops the traffic before
it reaches the origin. The nginx rule is defence-in-depth for the case where someone reaches the origin
directly. Consider doing both.

---

## ⚠ Operator action required — Ghost Admin API integration auth is currently failing

Discovered 2026-06-12 while attempting content automation. Symptom, precisely:
- A correctly-signed admin JWT (HS256, `kid` set, `aud=/admin/`, 5-min expiry) built from **any** of the
  7 admin API keys in the DB — including the `REMOTE` custom integration, which has the correct
  **"Admin Integration"** role — returns **HTTP 403 "Authorization failed — Unable to determine the
  authenticated user or integration"** on every authenticated endpoint (`GET/POST /ghost/api/admin/...`).
- The **public** `/ghost/api/admin/site/` returns 200, confirming the API is up and reachable; only
  *integration-authenticated* calls fail.
- Token signature and audience both validate (an unsigned/wrong-audience token returns 401, not 403),
  so this is an **authorization** failure, not a bad key.

**Impact:** all Admin-API content automation is blocked — creating/updating posts and pages, settings
writes, newsletter/portal config. (This is why the 2 new drafts below are version-controlled but not
yet live in Ghost, and why the H/I portfolio-page updates and J2–J4 settings tasks could not run.)

**Likely fixes to try (operator, ~5 min):**
1. In `/ghost/` → **Settings → Advanced → Integrations**, delete the `REMOTE` custom integration and
   **create a fresh Custom Integration**; copy its new Admin API key and test with the
   migration client / a quick `curl`. A freshly-created integration usually resolves this.
2. Confirm the instance isn't mid-upgrade and `ghost ls` shows `running (production)` (it does as of
   this session — 6.44.1).
3. While you're in there: **rotate** the old admin key (it appeared in a prior chat transcript) and
   **enable admin 2FA** — both already on the morning list.
