# TS06 — Operator Actions (rootdrifter.io)

Generated 2026-06-19 (TS06 platform session). These items require the Ghost admin UI or a human
decision; they cannot be done with the `claude-code` Admin Integration API token (settings endpoints
return `403 NoPermissionError`).

---

## 1. Set `members_support_address` → `hello@rootdrifter.io`  (recommended)

**Current value:** `noreply`  ·  **Desired:** `hello@rootdrifter.io`

The Admin API token cannot write settings (verified this session: `PUT /settings/` → 403
`NoPermissionError`). Change it in the UI:

1. Ghost admin → **Settings → Membership** (or **Settings → Email newsletter** depending on Ghost
   6.x layout) → **Support email address**.
2. Set to `hello@rootdrifter.io`.
3. Save.
4. (Optional) Send a test member email / trigger a magic link to confirm Resend SMTP still delivers
   from the new address.

> Why it matters: this is the reply-to/support address members see on account and newsletter emails.
> `hello@rootdrifter.io` is the address used everywhere else on the site (contact page, About,
> challenges submission), so the `noreply` default is inconsistent.

---

## 2. TRANSMISSION LOG (`/blog/`) index — add a social card / meta description

`/blog/` is a Ghost **collection route** (defined in `routes.yaml`), not a backing page, so it has no
editable Ghost post/page to carry a custom Open Graph/Twitter card or meta description. It currently
falls back to the site-level title/description and the default social image. To give the
TRANSMISSION LOG index its own social card:

**Option A — site-level (simplest, affects the default card site-wide):**
1. Ghost admin → **Settings → Design & branding** (or **Settings → General → Publication identity**).
2. Set/confirm the **Site description** and upload a **Social/Twitter image** (use the branded
   1200×630 card in `content/images/` if not already set).
3. This becomes the fallback card for routes without their own meta — including `/blog/`.

**Option B — dedicated index meta (more work, exact control):**
- Convert `/blog/` to a routed page (mirror the proven `/portfolio/` pattern: create a published
  Ghost page with the desired title/description/OG/Twitter image, then bind `data: page.<slug>` for
  the collection's index in `routes.yaml`). This is a routing change and should be snapshot + gscan
  gated; defer unless the site-level card is insufficient.

> Recommendation: Option A. The collection index rarely needs a bespoke card distinct from the site
> card; a strong site-level social image covers `/blog/` and every other route without a dedicated page.

---

## 3. Nav optics — SUPPORT / CHALLENGES top-nav vs footer-only  (DEFERRED — your call)

**Status: not changed this session** (decision left to you).

Current top nav: `PORTFOLIO · START · TRANSMISSION LOG · ABOUT · CHALLENGES · SUPPORT · CONTACT · GITHUB`.
Both **CHALLENGES** and **SUPPORT** already appear in the **footer** as well, so moving them to
footer-only loses no navigation — it just leans the recruiter-facing top bar to:
`PORTFOLIO · START · TRANSMISSION LOG · ABOUT · CONTACT · GITHUB`.

If you want this, say so and it's a ~2-line change to `theme/partials/navigation.hbs` (remove the
CHALLENGES + SUPPORT `<a>` lines), deployed with a theme snapshot + `gscan` + route re-verification.
Until confirmed it stays as-is (a live recruiter-facing nav change shouldn't be made on an
unconfirmed aesthetic preference).
