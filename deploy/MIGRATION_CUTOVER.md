# MIGRATION_CUTOVER.md — GitHub Pages → Ghost, zero-broken-links procedure

Executes in **Stage 1**, only after the VPS is live and serving rootdrifter.io over TLS.
Companion to `../MIGRATION_PLAN.md` (architecture) — this file is the runbook.
**Nothing below is executed in Stage 0.**

## Preconditions (all must be true before step 1)

- [ ] Ghost live at `https://rootdrifter.io` (VPS per `scripts/setup-vps.sh`, nginx per
      `nginx/rootdrifter.io.conf`, TLS valid)
- [ ] All 7 portfolio routes return 200 **on the production domain**:
      `/portfolio/` + 6 project pages (curl matrix below)
- [ ] Interactive components verified in a real browser on production (6 pages)
- [ ] Mailgun + Portal working (subscribe flow end-to-end)
- [ ] Content reviewed: teaser tags resolved per `../content/APPROVAL_QUEUE.md`

## Cutover sequence

### 1. DNS (Cloudflare)
Per `cloudflare/DNS_SETUP.md`: `rootdrifter.io` A/AAAA → VPS, proxied. Verify:
`curl -sI https://rootdrifter.io | head -1` → `HTTP/2 200`.

### 2. Activate the hub redirect
In `rootdrifter.github.io` (repo root):
```
git -C /home/exiled/github/rootdrifter.github.io mv index.html index.static-backup.html
git -C /home/exiled/github/rootdrifter.github.io cp redirect-ready/index.html index.html   # cp via shell, then git add
```
(Keep `index.static-backup.html` tracked for one release — it is the rollback.)

### 3. Activate the six project redirects
For each project repo (ironveil, nullbyte, spectre, oracle, mirage, gauntlet): replace
`docs/index.html` with the matching `redirect-ready/<project>/index.html` from the hub repo.
One commit per repo: `Fable: Stage 1 — redirect spec page to rootdrifter.io/portfolio/<name>/`.
The original page stays in git history — that is the rollback.

### 4. Update the GitHub profile layer
- `rootdrifter/README.md`: repo-table links → `rootdrifter.io/portfolio/...`; Website field
  already `https://rootdrifter.io`.
- Pinned-repo descriptions: leave (they point at repos, not pages).

### 5. Verification matrix (run all, expect every line PASS)
```
# production routes
for p in "" blog/ about/ contact/ subscribe/ portfolio/ portfolio/ironveil/ \
  portfolio/nullbyte/ portfolio/spectre/ portfolio/oracle/ portfolio/mirage/ \
  portfolio/gauntlet/; do
  printf "%-50s %s\n" "https://rootdrifter.io/$p" \
    "$(curl -s -o /dev/null -w '%{http_code}' https://rootdrifter.io/$p)"
done
# redirects land correctly (meta-refresh → check canonical)
for p in ironveil nullbyte spectre oracle mirage gauntlet; do
  curl -s https://rootdrifter.github.io/$p/ | grep -o 'canonical[^>]*'
done
```
Also: search-console canonical check after 48h; live browser pass on a phone.

### 6. Sitemap / SEO
Ghost serves its own `/sitemap.xml`. Remove the hub repo's static `sitemap.xml`/`robots.txt`
in the same commit as step 2 (Ghost's are authoritative on the new domain).

## Rollback (any step fails)

1. **Hub:** restore `index.static-backup.html` → `index.html`, push. Pages serves the old hub
   within minutes.
2. **Projects:** `git revert` the redirect commit per repo — the original `docs/index.html`
   returns.
3. **DNS:** point `rootdrifter.io` back to "parked" (or leave — the github.io sites are
   independent of it).
4. No data is destroyed at any step: every original file stays in git history, and the Ghost
   instance is additive.

## Known constraints

- GitHub Pages cannot serve HTTP 301s — meta-refresh + JS + canonical is the strongest
  available signal. Expect search engines to take days–weeks to migrate index entries.
- Do not delete the github.io repos after cutover: the redirects must keep serving while
  inbound links (CVs already sent, profile views) age out.
