# Performance Baseline — rootdrifter.io

Date: 2026-06-12 · Server: Hetzner CPX22 (Nuremberg) + Cloudflare CDN · Ghost 6.44.1 (SQLite) ·
nginx reverse proxy. Measured through Cloudflare from an external host.

## Response times (through Cloudflare)

| Path | Total | TTFB | Code |
|------|-------|------|------|
| / | 0.39s | 0.39s | 200 |
| /blog/ | 0.38s | 0.38s | 200 |
| /about/ | 0.39s | 0.39s | 200 |
| /portfolio/ | 0.27s | 0.26s | 200 |
| /portfolio/ironveil/ | 0.29s | 0.28s | 200 |
| /subscribe/ | 0.28s | 0.28s | 200 |

`cf-cache-status: DYNAMIC` — Ghost pages are served dynamically (not edge-cached), which is the
expected default for a CMS. Static assets (CSS/JS/fonts) are cacheable at the edge.

## Notes

- Cloudflare CDN in front (orange cloud); origin behind it.
- Ghost on SQLite (single-author scale; ample headroom on 2 vCPU / 3.7 GB).
- nginx reverse proxy → Ghost on 127.0.0.1:2368 (loopback only).
- All times sub-400ms total from an external host — healthy for a dynamic CMS behind a CDN.

## Follow-ups (optional optimisation)

- Cloudflare: enable Brotli, Auto Minify (CSS/JS/HTML), HTTP/3 (dashboard — operator).
- Consider a Cloudflare cache rule for `/assets/*` (long TTL) if asset load becomes a factor.
- Re-baseline after the first real traffic to confirm under load.
