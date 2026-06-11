# Navigation spec — the rootdrifter web system

Four layers, one identity. Every page must let a visitor reach every other layer in **≤ 2 clicks**.

| Layer | Where | Status |
|-------|-------|--------|
| **Hub** (static portfolio) | `rootdrifter.github.io` | live |
| **Projects** ×6 | `rootdrifter.github.io/{ironveil,nullbyte,spectre,oracle,mirage,gauntlet}/` | live |
| **Blog** (Ghost) | `rootdrifter.io` | local/dev — domain pending |
| **Source** | `github.com/rootdrifter` | live |

## Blog theme link graph (this repo)

Every Ghost page renders the shared **top nav** (`partials/navigation.hbs`) and **footer**
(`partials/footer.hbs`):

- **Top nav:** brand → blog home · `PORTFOLIO ↗` → hub · `BLOG` → `/blog/` · `ABOUT` → `/about/` ·
  `CONTACT` → `/contact/` · `GITHUB ↗` → github.com/rootdrifter.
- **Footer:** `PORTFOLIO` · `BLOG` · `ABOUT` · `GITHUB`.
- **Homepage** additionally links the three featured project cards (ironveil/spectre/mirage → live
  project pages) and "Full portfolio →".
- **Posts** carry the subscribe form and (when present) related-post links; tags link to `/tag/{slug}/`.

## 2-click reachability (from any blog page)

| To → | Hub | a project | Blog | About | Contact | GitHub |
|------|-----|-----------|------|-------|---------|--------|
| clicks | 1 (nav) | 2 (nav→Hub→card) | 1 | 1 | 1 | 1 (nav) |

From the **homepage** a project is **1 click** (featured cards). All targets ≤ 2 clicks ✔.

## Hub → blog (the one deferred edge)

The hub and project pages do **not** yet link to the blog: `rootdrifter.io` does not resolve, so a
blog link would be dead on the live portfolio. The link is **prepared, not applied** —
`source-material/activate-blog-links.sh` flips pending-live placeholders to live in one run once the
domain resolves. Until then the blog→hub direction is fully wired; hub→blog waits on DNS.

## Verification (2026-06-11, local Ghost)

`/` `/blog/` `/about/` `/contact/` `/subscribe/` and `/tag/{slug}/` all return HTTP 200; nav + footer
render on each; `CONTACT` now resolves to the `/contact/` page (previously an orphaned page — the nav
pointed at a `mailto:`). External targets (hub, six project pages, github.com/rootdrifter) are live.
