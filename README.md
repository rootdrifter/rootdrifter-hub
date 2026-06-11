# rootdrifter-hub

The **Ghost theme** for **rootdrifter.io** — the writing/content half of the RootDrifter security
portfolio. This repo holds the theme source, the privacy directives, and the local sample content.
It does **not** contain the Ghost runtime, database, config, or any operational data (see
`.gitignore` and `directives/CONSTITUTION.md`).

> Read `directives/CONSTITUTION.md` and `directives/DENYLIST.md` before contributing. Two namespaces;
> they never resolve to each other. Fail-closed on anything uncertain.

## Architecture — two systems, one design language

| Property | rootdrifter.github.io | rootdrifter.io |
|----------|-----------------------|----------------|
| What | Static portfolio hub (project pages, clearance, skills) | Ghost CMS blog (CTF writeups, methodology) |
| Host | GitHub Pages | Ghost (self-hosted — VPS, pending) |
| Source | `rootdrifter.github.io` repo | this repo (`rootdrifter-hub`) |
| Design | canonical tokens + Share Tech Mono / Barlow | **the same tokens, same components** |

The two sites share one visual system on purpose: a visitor moving between the portfolio and the blog
should not perceive a seam. `theme/assets/css/tokens.css` mirrors the static site's core palette
exactly; `screen.css` reproduces the scanline, nav, status tags, info blocks, and footer.

## Local development

Ghost requires Node 18.x or 20.x LTS (this machine has Node 22 — use `nvm install 20`).

```bash
# one-time prerequisites the local Ghost install needs on this box:
corepack enable && corepack prepare pnpm@latest --activate   # or: npm i -g pnpm
sudo dnf install -y python3-setuptools                        # SQLite native build (Python 3.12+)
nvm install 20 && nvm use 20                                  # Ghost-supported LTS

npm install -g ghost-cli
mkdir -p /home/exiled/ghost/rootdrifter-dev && cd $_
ghost install local        # creates content/, SQLite DB, admin
ghost start                # http://localhost:2368  (admin: /ghost)
```

The theme lives at `content/themes/rootdrifter/` (mirrored here under `theme/`). After editing:

```bash
cd /home/exiled/ghost/rootdrifter-dev && ghost restart
npx gscan content/themes/rootdrifter/      # validate (target: 0 errors)
```

Sample content for visual testing is in `sample-content/` — import `ghost-import.json` via
**Ghost Admin → Settings → Labs → Import**. Delete the samples before launch.

## Theme structure

```
theme/
  package.json            # ghost-theme manifest (engines, image sizes, card_assets)
  routes.yaml             # -> content/settings/routes.yaml (home + /blog/ collection + tag taxonomy)
  default.hbs             # base layout: nav, skip-link, scroll bar, footer, ghost_head/foot
  index.hbs               # homepage ({{#is "home"}}) + /blog/ listing ({{else}})
  post.hbs                # single post (reading view + subscribe)
  page.hbs                # static pages (About, Contact)
  tag.hbs                 # tag archive
  error.hbs              # on-brand 404 / error
  partials/
    navigation.hbs        # fixed top nav (PORTFOLIO / BLOG / ABOUT / CONTACT / GITHUB)
    footer.hbs            # site footer + nav strip
    post-card.hbs         # reusable post card (index + tag)
    subscribe.hbs         # members email form (renders only if membership enabled)
  assets/css/
    tokens.css            # design tokens (palette parity with the static site)
    screen.css            # full design system + accessibility + print
```

## Deployment notes

**Task 10 — VPS provisioning is pending.** The theme is built and validated; going live needs a host
and DNS cutover. Nothing here publishes automatically.

## Manual actions required before going live

1. **Ghost admin setup** — visit `http://localhost:2368/ghost` and create the admin account.
2. **Activate the `rootdrifter` theme** in Ghost Admin → Settings → Design.
3. **Create the `rootdrifter-hub` repo on GitHub** and push (`rootdrifter/rootdrifter-hub`).
4. **Provision a Hetzner CX22 VPS** (or equivalent) and install Ghost in production mode.
5. **Configure DNS** — point the `rootdrifter.io` A record at the VPS IP once it is live.
6. **Set up Mailgun** for Ghost's transactional + member email sends.
7. **Configure `hello@rootdrifter.io` routing** (e.g. via Cloudflare Email Routing) to a real inbox.

> Until all seven are done, `rootdrifter.io` does not resolve and must **not** be linked from the
> public static portfolio (a dead link degrades the live site). See session notes.
