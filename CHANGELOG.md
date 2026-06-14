# Changelog — rootdrifter Ghost theme

All notable changes to the `rootdrifter` theme and the rootdrifter.io platform.

## v1.1.1 — 2026-06-14 — nav consistency, portfolio SEO, polish

### Navigation & voice
- Renamed the **Blog** nav item to **TRANSMISSION LOG** (top nav + footer), matching the site's
  "transmission" voice; the `/blog/` route is unchanged. Updated the remaining visible "Blog"
  strings to match (hero CTA, 404 page, project-page footer link, empty-state labels).
- Raised the nav's mobile-collapse breakpoint to 900px so the longer label can never overflow the
  fixed-height nav bar on small-laptop widths.

### Portfolio index SEO
- `/portfolio/` is a template route with no backing page, so it carried no social/SEO metadata.
  Added a bound Ghost page (`data: page.portfolio` in `routes.yaml`) holding title/description/OG/
  Twitter + the branded social card, so shared links render a proper card and `/portfolio/` enters
  the sitemap.

### Fixes
- Removed a stray "← Blog" back-link hardcoded at the bottom of the portfolio index template.

## v1.1.0 — 2026-06-13 — platform expansion

- Civilian on-ramp (`/start/`) plus a homepage civilian lede and manifesto strip.
- `/support/` (transparent running costs) and `/challenges/` (CTF index) pages, with matching
  nav and footer entries.
- CTF Challenge 0 (a view-source flag on the homepage).
- JSON-LD `author.url` fix — re-enabled the `author` taxonomy so the author entity validates
  instead of resolving to `/404/`.

## v1.0.0 — 2026-06-12 — production launch

First production release. rootdrifter.io is live on Ghost 6.44.1 behind Cloudflare, serving
the full portfolio, blog, and membership flow.

### Platform go-live polish
- Routed every PORTFOLIO link to `rootdrifter.io/portfolio/` (nav, hero, footer, homepage
  strip cards, error page, subscribe, about page) — previously pointed at the now-redirecting
  `rootdrifter.github.io` hub, causing an extra redirect hop.
- Removed the pre-launch "platform status" banner and the `[UNIVERSITY]` / `[YOUR NAME]`
  placeholder text from the public homepage; the Active-work board now reads "Live".
- Removed the unused `portfolio_url` custom setting (the portfolio is now internal).

### SEO & social
- Replaced Ghost's default site description ("Thoughts, stories and ideas.") with a proper
  SEO/social description; set og/twitter title, description, and image.
- Added a branded 1200×630 social card; removed Ghost's stock cover image and the default
  `@ghost` social handles. Brand accent colour set to `#00e5ff`.

### Content
- Restored the body content for all 12 blog posts (the production migration had carried
  titles/excerpts but not bodies); the 3 published posts remain teaser-gated.
- Rewrote the Contact page (was empty) with direct `hello@rootdrifter.io` + GitHub; made the
  About page's project list clickable to the internal portfolio pages.
- Removed Ghost's default "Coming soon" placeholder post.

### Theme features
- **Dark/light theme toggle** — dark remains the default; light mode is opt-in via a nav
  control, persisted in `localStorage`, applied before first paint (no flash), with a
  theme-aware hero rain canvas. Token-based (`html.light`), so every component adapts.
- Per-page `<title>`, SEO/OG/Twitter meta via `{{ghost_head}}`, JSON-LD Person.
- Six self-mounting interactive components (ironveil checklist, nullbyte isolation matrix,
  spectre attack timeline, oracle accuracy/F1 chart, mirage causal stepper, gauntlet radar).
- Teaser gate for pending-review posts; membership/subscribe flow; code-copy buttons; TOC;
  reading-progress bar; reduced-motion, print, and accessibility (skip link, ARIA) support.

### Design system
- Canonical tokens shared with `rootdrifter.github.io`; Share Tech Mono + Barlow; scanline
  overlay; per-project accent palettes.
