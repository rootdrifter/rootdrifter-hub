# Phase 1 — platform build notes (2026-06-13)

Civilian on-ramp, manifesto, `/support` + `/challenges` scaffolds, CTF Challenge 0, and the
structured-data/settings hygiene pass. Theme `v1.1.0`. All routes 200 (loopback + Cloudflare),
gscan clean (1 acceptable custom-fonts warning), privacy scan 0 hits.

## What shipped (agent side, live + verified)
- **T2 structured data:** JSON-LD `author.url` was `{site}/404/` because `routes.yaml` `taxonomies`
  omitted `author`. Re-enabled `author: /author/{slug}/` → author entity now valid
  (`/author/rootdrifter/` 200; theme has no `author.hbs` → falls back to the `index.hbs` post-list).
  Homepage Person `sameAs` now includes `https://rootdrifter.io`. Hardcoded "12 transmissions in
  preparation" → drift-proof "More transmissions incoming" (theme can't count drafts — Content API
  is published-only).
- **T3 civilian on-ramp:** `/start/` page (plain language) + homepage `.civilian-lede` ("Not
  technical? Start here →") + nav/footer entry.
- **T4 `/support`:** scaffold page (transparent £13/mo running costs, investigation fund,
  supporter ledger; donate CTAs marked "coming soon" — no payment wiring) + nav/footer entry.
- **T5 manifesto:** `/about` replaced with the manifesto; homepage `.manifesto-strip` band.
  **⚠ OPERATOR REVIEW REQUIRED on the wording** (positions are load-bearing; voice is editable).
- **T6 CTF Challenge 0:** `flag{w3lc0me_t0_r00tdrift3r}` as an HTML comment in the homepage `<head>`
  source (homepage-only; invisible in render) + `/challenges/` index + nav/footer entry.
- **Ext C:** 404 page now carries "Some signals are hidden intentionally → // challenges".
- **Ext D:** branded 1200×630 OG cards for `/support` and `/challenges` (design palette), `og_image`
  set per page.
- **Ext E:** `/welcome/` page augmented with `/start/` + `/challenges/` links (operator copy kept).

## Operator actions (could not be done by the agent)
1. **`members_support_address` → `hello@rootdrifter.io`.** Currently `"noreply"`. Settings writes
   are **403 for API tokens**, so: Ghost admin → Settings → Membership → *Support email address*.
2. **(Optional) Ghost `navigation` setting.** It is `[Home, About]`, inconsistent with the rendered
   nav — but **the theme hardcodes its nav** (`partials/navigation.hbs`), so the setting is
   **not rendered** (cosmetic-only, admin consistency). The theme nav is authoritative. If you want
   them to match: Ghost admin → Settings → Navigation (Portfolio · Start · Blog · About · Challenges
   · Support · Contact).
3. **Approve the manifesto** (`/about` + the homepage manifesto strip line). See T5 above.
4. **De-tease posts** (still pending from prior phases) — unblocks the blog.
5. **Optics check (your call):** `SUPPORT` and `CHALLENGES` now sit in the **top nav** a recruiter
   sees first (per the Phase-1 brief). If you'd rather keep the professional surface leaner, they can
   be moved to footer-only — both are already in the footer too.

## Ready for Phase 2 — Ext B (robots.txt for Challenge 1 / T10)
Ghost serves `/robots.txt` from core and **auto-maintains it** (adds new disallows on Ghost
updates). Overriding it via nginx would freeze it, so this is **deferred until Challenge 1 exists**.
When `/challenge/01/` ships (T10), add to the nginx server block (then `nginx -t && systemctl reload
nginx`), serving a copy of the current Ghost robots.txt **plus**:

```
# /etc/nginx/… (rootdrifter.io server block) — only once /challenge/ exists
location = /robots.txt {
    default_type text/plain;
    return 200 "User-agent: *\nSitemap: https://rootdrifter.io/sitemap.xml\nDisallow: /ghost/\nDisallow: /email/\nDisallow: /r/\nDisallow: /challenge/\n";
}
```
`Disallow: /challenge/` then becomes the recon breadcrumb for Challenge 1 (standard robots.txt recon).
