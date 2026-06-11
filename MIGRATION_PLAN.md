# MIGRATION_PLAN.md — GitHub Pages → Ghost (rootdrifter.io)

Prepared 2026-06-11 (Stage 0). **Executes in Stage 1 when the VPS is live.** This session
prepares everything; nothing here changes the live GitHub Pages sites until cutover
(see `deploy/MIGRATION_CUTOVER.md` for the step-by-step procedure).

## Architecture

### BEFORE (current)

```
rootdrifter.github.io            → hub (static HTML)            [LIVE]
rootdrifter.github.io/ironveil   → spec page (static HTML)      [LIVE]   ×6 project pages
rootdrifter.io                   → Ghost blog                   [NOT YET LIVE — local dev only]
github.com/rootdrifter           → repos link to github.io pages
```

### AFTER (post-migration, Stage 1)

```
rootdrifter.io                       → Ghost homepage
rootdrifter.io/blog                  → Ghost posts (collection)
rootdrifter.io/portfolio             → Ghost portfolio index (template: portfolio-index.hbs)
rootdrifter.io/portfolio/ironveil    → Ghost project page (template: portfolio-project.hbs)
   …×6: ironveil, nullbyte, spectre, oracle, mirage, gauntlet
rootdrifter.github.io                → meta-refresh redirect → rootdrifter.io
rootdrifter.github.io/<project>      → meta-refresh redirect → rootdrifter.io/portfolio/<project>/
github.com/rootdrifter               → profile/repo links updated to rootdrifter.io
```

## Routing strategy

### Ghost routes (corrected syntax)

The directive's `page: <slug>` shorthand is **not valid Ghost routing YAML** (same defect the
original routes directive had — it would stop Ghost from starting). The valid form, now in
`routes.yaml`, is:

```yaml
/portfolio/:
  template: portfolio-index
/portfolio/ironveil/:
  data: page.portfolio-ironveil
  template: portfolio-project
```

`data: page.<slug>` binds the route to the Ghost page with that slug and suppresses the page's
default `/{slug}/` URL. The six pages are created via the Admin API from
`content/pages/portfolio-*.md` (mobiledoc markdown cards — same mechanism as the seeded posts).

### GitHub Pages redirects

GitHub Pages cannot serve HTTP 301s, so redirects are meta-refresh + JS + `rel=canonical`
pages (prepared in `rootdrifter.github.io/redirect-ready/`, **not yet active**):

| From | To |
|------|----|
| rootdrifter.github.io | https://rootdrifter.io |
| rootdrifter.github.io/ironveil | https://rootdrifter.io/portfolio/ironveil/ |
| rootdrifter.github.io/nullbyte | https://rootdrifter.io/portfolio/nullbyte/ |
| rootdrifter.github.io/spectre | https://rootdrifter.io/portfolio/spectre/ |
| rootdrifter.github.io/oracle | https://rootdrifter.io/portfolio/oracle/ |
| rootdrifter.github.io/mirage | https://rootdrifter.io/portfolio/mirage/ |
| rootdrifter.github.io/gauntlet | https://rootdrifter.io/portfolio/gauntlet/ |

The `rel=canonical` on each redirect page passes SEO signal to the Ghost URL; the per-project
repos' `docs/` pages are replaced by their redirect page at cutover (the originals stay in git
history for rollback).

## Content migration

Each static spec page is converted to Ghost-compatible markdown in `content/pages/`:

| Conversion rule | Static page component | Ghost markdown |
|----------------|----------------------|----------------|
| Status blocks | `.status-pill` rows | blockquote with bold label |
| Info/warn panels | `.info-block`/`.warn-block` | blockquote callouts (`> **// label**`) |
| Command blocks | `.cmd`/`pre` | fenced code blocks with language |
| Section breaks | `.section-break` | `---` + `## heading` |
| MANUAL INPUT blocks | flagged comment blocks | explicit `> **MANUAL INPUT PENDING**` callouts |
| Interactive components | inline `<script>` | standalone `theme/assets/js/<project>-*.js`, self-mounting |

**Accuracy invariants carry over verbatim** (oracle 93.97/0.9390 vs 99.11/0.9916 — never
swapped; mirage 88,647 / ICC 0.98; spectre Apache 2.4.58 / CWE-548; nullbyte nine profiles incl.
Ghost / Titan M2; ironveil Nitrokey 3A NFC / fw 1.8.3 / tunnels `wg-CH-FI-2` + `wg-SE-FI-1` /
AdGuard Quad9 DoH).

## Interactive components

Each component ships as a self-contained JS file (data embedded, injects its own scoped
styles, mounts into a `<div id="<project>-component">` the page markdown provides):

| File | Component | Mount id |
|------|-----------|----------|
| ironveil-checklist.js | hardening checklist | `#ironveil-component` |
| nullbyte-matrix.js | profile isolation matrix | `#nullbyte-component` |
| spectre-timeline.js | attack path timeline | `#spectre-component` |
| oracle-chart.js | accuracy comparison chart | `#oracle-component` |
| mirage-stepper.js | causal vs correlational stepper | `#mirage-component` |
| gauntlet-radar.js | skills radar SVG | `#gauntlet-component` |

`portfolio-project.hbs` loads the matching file by slug via `{{#match}}` + `{{asset}}`.

## What does NOT change

- The six project **repos** stay on GitHub (code, READMEs, evidence) — only the *spec page
  hosting* moves to Ghost.
- `watchtower` joins the portfolio index when its repo goes public (card prepared, commented out).
- The static hub repo is kept intact until cutover; redirects activate only in Stage 1.

## Open items at cutover time

See `deploy/MIGRATION_CUTOVER.md` — DNS, redirect activation, verification matrix, rollback.
