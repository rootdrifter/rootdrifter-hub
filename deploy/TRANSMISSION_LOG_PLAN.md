# TRANSMISSION LOG — implementation plan (ready to ship post-deadline)

A concrete, sequenced, de-risked plan to ship the dual-audience content architecture the three
max-effort directives specified — the "Blog → TRANSMISSION LOG" rename, the SIGNAL / BASELINE /
DISPATCH tracks, and the supporting theme work (footer, error page, favicon, homepage civilian
entry). It is **deliberately deferred** from the 2026-06-12 session and captured here as an
executable plan instead.

## Why this was deferred, not done

The portfolio is the operator's evidence for a hard career deadline (21 June, 0 applications sent at
time of writing). The site is already 9/10 and every route returns 200. A sweeping theme change —
new nav label, three content tracks, new templates, footer/typography/favicon/error-page overhaul —
is the **highest-risk, lowest-marginal-value** change possible on a live recruiter-facing site during
the application crunch: it can only break what already works, and a hiring manager who opens the site
today already sees a strong, distinctive, working portfolio. The right time to ship it is **after the
applications are out**, when the site is not under a recruiter spotlight and the Hetzner egress block
(which currently breaks cert renewal and would complicate any urgent rollback-and-redeploy) is fixed.

## Pre-flight (do these first, in order)

1. **Fix the Hetzner egress block** (open outbound 443/80/53) so cert renewal + `apt` work and an
   emergency redeploy isn't fighting a half-broken box.
2. Confirm `git -C rootdrifter-hub status` clean and `origin/main` in sync.
3. Snapshot the live theme: `ssh bastion-ghost "sudo tar czf /tmp/theme-pre-tlog.tgz -C /var/www/rootdrifter/content/themes rootdrifter"`.
4. Back up the DB (the rename touches no DB, but the post tagging in step 4 does):
   `ssh bastion-ghost "sudo cp /var/www/rootdrifter/content/data/ghost.db /var/www/rootdrifter/content/data/ghost.db.bak-$(date +%F-%H%M)"`.

## Sequenced changes (each independently shippable + verifiable)

### Stage A — the rename (lowest risk, do first)
- `theme/` nav partial + any hardcoded "Blog" strings → **"TRANSMISSION LOG"** as the *display* label.
  **Keep the `/blog/` route unchanged** (SEO continuity, existing inbound links, sitemap stability).
- Files to touch: `default.hbs` (nav), `index.hbs`, `subscribe.hbs`/`page.hbs` if they say "Blog".
- **Verify:** `gscan` clean → deploy → nav shows TRANSMISSION LOG → `/blog/` still 200 → all 14 routes
  200 (loopback). Rollback = redeploy the snapshot. This stage alone delivers most of the brand value.

### Stage B — the three tracks (taxonomy, then display)
- Tags (create via Admin API, internal names): `signal` (technical), `baseline` (civilian),
  `dispatch` (cross-audience platform/portfolio updates).
- Tag existing posts: the 3 published + technical drafts → `signal`; the 2 BASELINE drafts (when
  written, see voice guides) → `baseline`; platform-update posts → `dispatch`.
- Post-card badge in `post-card` partial: `// SIGNAL` in `--accent`, `// BASELINE` in `--green`,
  `// DISPATCH` in `--warn`. A reader sees at a glance which track a post is.
- Optional filter UI on `index.hbs`: `ALL | // SIGNAL | // BASELINE | // DISPATCH` as data-attribute
  CSS/JS filters (no API call). Ship the badges first; the filter is additive and can follow.
- **Verify:** each track badge renders in the right colour; filter (if shipped) toggles correctly;
  contrast ratios still pass WCAG AA.

### Stage C — supporting theme polish (each optional, independent)
- **Footer** → three columns (NAVIGATE / TRANSMISSION LOG / ELSEWHERE) + a one-line manifesto. No
  social links (deliberate). Pure markup + tokens.
- **Error page** (`error.hbs`) → on-brand "// SIGNAL LOST" with links to home/portfolio/TRANSMISSION
  LOG. Verify at a non-existent URL.
- **Favicon** → a simple SVG mark (`//` or a terminal cursor in `--accent` on `--bg`). Verify
  `/favicon.ico` + `/favicon.png` resolve.
- **Homepage civilian entry** → a "// WHAT IS THIS?" block with a "→ Start with the basics" CTA to the
  BASELINE track, styled distinctly from the technical sections. (The portfolio pages already gained
  "IN PLAIN TERMS" openers in the 2026-06-12 session — the homepage block is the matching front door.)
- **Typography** → if elevating, load a code-optimised mono (JetBrains/Fira) for code blocks only;
  keep Barlow body. Test multi-line code legibility before/after.

## Risk controls (apply to every stage)
- `gscan` must pass before any deploy (warnings like custom-fonts are acceptable; errors abort).
- Deploy assets with **correct ownership** (`install -o ghost -g ghost -m 644`) or
  `rsync --chown=ghost:ghost` — **not** a bare `scp -r` that leaves files owned by the deploy user.
- After every deploy: `ghost restart` then verify **all routes 200 via loopback**
  (`--resolve rootdrifter.io:443:127.0.0.1`), not through Cloudflare (edge 000s are not your bug).
- Each stage is independently revertible to the `theme-pre-tlog.tgz` snapshot.

## Design tokens (the palette is fixed — no colour outside this list)
`--bg #090d12` · `--surface #0d1520` · `--border #1a2a3a` · `--accent #00e5ff` (SIGNAL) ·
`--accent2 #ff4081` · `--warn #ffaa00` (DISPATCH/pending) · `--green #00ff88` (BASELINE/success) ·
`--text #c8d8e8` · `--muted #4a6a7a` · `--code-bg #060a0f`. Verify with
`grep -roh '#[0-9a-fA-F]\{3,8\}' theme/assets/css/ | sort -u` and reconcile any stray value.

## What's already done (don't redo)
- Portfolio pages carry dual-audience "IN PLAIN TERMS" openers (2026-06-12).
- `/welcome/` page exists ("// TRANSMISSION RECEIVED") as the Free-tier `welcome_page_url`.
- Accent `--accent #00e5ff` is already the portal/brand colour.
- Voice guides for both tracks: `content/BASELINE_VOICE.md`, `content/SIGNAL_VOICE.md`.

**Estimated time, post-deadline, with egress fixed:** Stage A ~30 min; Stage B ~1–2 h; Stage C
~1–2 h. All reversible. Ship A first for the brand win, then B/C as appetite allows.
