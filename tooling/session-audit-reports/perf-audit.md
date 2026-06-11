# Performance Baseline — Ghost theme (local dev)

Date: 2026-06-11 · Session S0-02 Task 5 · Measured with `curl` against the local Ghost
instance after the teaser-system deploy. Local numbers exclude network latency and TLS —
they baseline the *render + payload* cost, not production response times.

## Response times and payload sizes

| URL | TTFB | Total | HTML size |
|-----|------|-------|-----------|
| / (home) | 0.018s | 0.018s | 20.4 KB |
| /blog/ | 0.022s | 0.022s | 9.7 KB |
| /about/ | 0.013s | 0.013s | 12.5 KB |
| /subscribe/ | 0.008s | 0.008s | 10.2 KB |

## Asset weight

- `screen.css` + `tokens.css`: well under 100 KB combined (no optimisation needed).
- `toc.js`: ~1.5 KB, loaded `defer` and only on non-teaser posts with `show_toc` enabled.
- No image payloads in the theme itself; post images are Ghost-managed (lazy-loaded via
  `loading="lazy"` in post.hbs).
- Fonts: Google Fonts with `preconnect` ×2 and `display=swap` — render is not blocked.

## Verdict

PASS — no optimisation candidates. All pages render in ~20ms locally with 10–20 KB HTML.
The heaviest client-side work is the hero rain canvas, already throttled to ~15fps,
paused when `document.hidden`, and disabled under reduced motion.

## Production follow-ups (Stage 1)

- Re-baseline with TLS + network on the VPS (target: TTFB < 200ms EU).
- nginx gzip/brotli for HTML/CSS/JS (config already in `deploy/nginx/`).
- Cloudflare caching for static assets.
