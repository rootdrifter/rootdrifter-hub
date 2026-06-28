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
| What | Static portfolio hub (project pages, clearance, skills) | Blog — CTF writeups, methodology |
| Host | GitHub Pages (now a redirect layer → rootdrifter.io) | Ghost (self-hosted — Hetzner VPS, **LIVE**) |
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

`routes.yaml` (repo root → `content/settings/routes.yaml`) defines: home + `/subscribe/`,
the `/portfolio/` index + six `/portfolio/<project>/` pages, the `/blog/` collection, and the tag
taxonomy. Static pages (About, Contact) serve implicitly at `/{slug}/`.

```
theme/
  package.json            # ghost-theme manifest (engines, image sizes, card_assets, custom settings)
  default.hbs             # base layout: <title>{{meta_title}}</title>, nav, skip-link, scroll bar, footer, ghost_head/foot
  index.hbs               # homepage ({{#is "home"}}) + /blog/ listing ({{else}})
  post.hbs                # single post (teaser gate + TOC + related + subscribe)
  page.hbs                # static pages (About, Contact)
  portfolio-index.hbs     # /portfolio/ — six-project card grid
  portfolio-project.hbs   # /portfolio/<project>/ — migrated spec page + per-slug component
  tag.hbs                 # tag archive
  error.hbs               # on-brand 404 / error
  partials/
    navigation.hbs        # fixed top nav (PORTFOLIO / BLOG / ABOUT / CONTACT / GITHUB)
    footer.hbs            # site footer + nav strip
    post-card.hbs         # reusable post card (index + tag)
    subscribe.hbs         # members email form (renders only if membership enabled)
  assets/css/
    tokens.css            # design tokens (palette parity with the static site)
    screen.css            # full design system + accessibility + print
  assets/js/
    toc.js                # post table-of-contents (3+ headings, non-teaser)
    <project>-*.js         # six self-mounting portfolio components (checklist/matrix/timeline/chart/stepper/radar)
```

## Tag taxonomy

The full machine-readable taxonomy is `content/tags.json`. Two tiers:

**Primary tags** define the content pillars and are the ones surfaced in navigation and on cards. Every
post must carry **exactly one** primary tag as its *primary* tag (the first one listed in the post
front-matter), which drives the card accent and the "Related Portfolio" cross-link in `post.hbs`:

| Primary tag | Use for |
|-------------|---------|
| `ctf-writeup` | TryHackMe / HackTheBox writeups |
| `pentest-methodology` | Technique and process breakdowns |
| `osint-recon` | Reconnaissance and OSINT tooling/technique |
| `security-notes` | General concepts, tools, reference |
| `sec-plus` | SY0-701 study notes |
| `detection-engineering` | Blue-team detection content from the Wazuh lab |

**Secondary tags** are meta and stack freely on top of the primary: platform (`tryhackme`,
`hackthebox`), difficulty (`easy`/`medium`/`hard`), category (`linux`/`windows`/`web`/`network`,
`tool-spotlight`, `wazuh`/`siem`/`blue-team`). They exist for filtering, not for defining a pillar.

**Rule of thumb:** one primary tag (the pillar), then as many secondary tags as accurately describe the
post. A CTF writeup of an easy Linux THM box is `ctf-writeup` (primary) + `tryhackme`, `easy`, `linux`.

Draft posts live in `content/posts/` as front-matter Markdown; the publishing cadence is in
`content/CONTENT_CALENDAR.md`.

## Deployment

Everything needed to self-host on a VPS lives in `deploy/` (placeholder secrets only — nothing here
publishes automatically, and `config.production.json` is gitignored).

```
deploy/
  nginx/rootdrifter.io.conf          # reverse proxy: HTTP→HTTPS, www→apex, TLS, security headers + CSP, /ghost/ block
  config.production.template.json    # Ghost prod config template (copy → config.production.json, fill [PLACEHOLDERS])
  scripts/setup-vps.sh               # fresh Hetzner/Ubuntu runbook (Node 22, Ghost-CLI, Nginx, UFW, certbot, systemd)
  scripts/deploy-theme.sh            # gscan → copy theme+routes → ghost restart → health-check
  scripts/backup-ghost.sh            # timestamped tar.gz of content/ (db, images, themes) + retention prune
  scripts/health-check.sh            # HTTP 200 + <title> assertion (cron/monitoring-friendly)
  cloudflare/DNS_SETUP.md            # interim Pages + production VPS records, email DNS, CF settings, zero-downtime cutover
  scripts/configure-resend.sh        # wire Ghost to Resend SMTP (boolean secure:false gotcha documented)
  EMAIL_TEST.md                      # verified end-to-end email test procedure (Resend)
  mailgun/                           # superseded Mailgun guides (Resend is live; kept for reference)
```

**`config.production.json` keys** (template in `deploy/config.production.template.json`):

| Key | Purpose |
|-----|---------|
| `url` | Public canonical URL — `https://rootdrifter.io`. Ghost builds every link from this. |
| `server.host` / `server.port` | `127.0.0.1:2368` — loopback only; Nginx is the sole public listener. |
| `database.client` / `.connection.filename` | `sqlite3` + the prod DB path under `content/data/`. |
| `mail.transport` / `.options` | `SMTP` via **Resend** (`smtp.resend.com:587`, `secure: false` as a JSON **boolean**); `auth.pass` is the API key, filled on the box only. |
| `mail.from` | Default sender — `rootdrifter <hello@rootdrifter.io>`. |
| `logging.level` / `.transports` | `info`, to file + stdout (systemd journal). |
| `process` | `systemd` — Ghost-CLI manages the service. |
| `paths.contentPath` | Absolute path to `content/` (themes, images, data, settings). |

**Go-live order:** `setup-vps.sh` (provision) → fill `config.production.json` → `ghost install`/start →
Nginx + `certbot` → `deploy-theme.sh` → `configure-resend.sh` → `DNS_SETUP.md` cutover → `health-check.sh`.
The human checklist is the section below.

## Production status — LIVE

`rootdrifter.io` is live and serving from a self-hosted Ghost instance (Ghost 6.44, Node 20 LTS) on the
Hetzner bastion VPS, behind Cloudflare + nginx (TLS, security headers, CSP, `/ghost/` protected). All
primary routes return 200: `/`, `/portfolio/` + the six `/portfolio/<project>/` pages, `/blog/`, `/about/`,
`/contact/`, `/start/`, `/challenges/`, `/support/`. Transactional + member email is live on Resend SMTP.
The GitHub-Pages portfolio (`rootdrifter.github.io`) is now a **redirect layer** into `rootdrifter.io` —
link the Ghost site, not the old Pages URLs.

### Go-live history (done)
1. ✅ Ghost admin account created; `rootdrifter` theme activated.
2. ✅ `rootdrifter/rootdrifter-hub` repo created and pushed.
3. ✅ Hetzner VPS provisioned; Ghost installed in production mode.
4. ✅ DNS cut over — `rootdrifter.io` resolves to the VPS behind Cloudflare.
5. ✅ Resend wired for transactional + member email (`secure: false` boolean gotcha documented).
6. ✅ `hello@rootdrifter.io` routing live.

### Operating notes (current)
- **Theme changes** ship via `deploy/scripts/deploy-theme.sh` (gscan → copy theme + routes → `ghost restart`
  → health-check). Target: gscan 0 errors.
- **Content** is authored in Ghost admin; draft bodies are mirrored in `content/posts/` and gated by the
  Ghost `teaser` **tag** until reviewed (see `content/APPROVAL_QUEUE.md`). All posts are `visibility:public`.
- **Known open items** (operator): see `deploy/DEPLOYMENT_LOG.md` — the Hetzner egress-block issue and the
  admin-2FA / API-key-rotation follow-ups.
