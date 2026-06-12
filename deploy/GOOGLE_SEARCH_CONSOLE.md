# Google Search Console — submission runbook

> **OPERATOR ACTION REQUIRED.** This is a dashboard/manual task — it is not automated. ~15 minutes.
> Pre-checked from production 2026-06-12: JSON-LD schema present site-wide, per-page canonicals
> correct, `sitemap.xml` returns 200. The site is technically ready to index.

## Why

Google will eventually crawl `rootdrifter.io` on its own, but Search Console (a) gets it indexed
faster, (b) confirms the sitemap is being read, (c) surfaces crawl/coverage errors, and (d) lets you
request indexing of key pages (portfolio, blog) the day they should appear in results. For a
recruiter-facing portfolio, being findable by name/handle is worth the 15 minutes.

## Steps

1. **Open** [search.google.com/search-console](https://search.google.com/search-console) and sign in
   with the project Google account (not a personal one).
2. **Add property → URL prefix →** `https://rootdrifter.io`
   *(URL-prefix, not Domain property — simpler, and it scopes to the canonical https origin.)*
3. **Verify via DNS TXT** (most robust; survives theme/host changes):
   - Google shows a token like `google-site-verification=XXXXXXXXXXXXXXXXXXXX`.
   - In **Cloudflare → DNS → Records → Add record**:
     - Type: `TXT` · Name: `@` (i.e. `rootdrifter.io`) · Content: the full
       `google-site-verification=...` string · TTL: Auto.
   - Wait for propagation (usually < 5 min behind Cloudflare), then click **Verify**.
   - *(Alternative: the HTML-file or meta-tag method via the theme — DNS is preferred so verification
     doesn't depend on the theme.)*
4. **Submit the sitemap:** Search Console → **Sitemaps** → enter `sitemap.xml` → Submit.
   (Full URL: `https://rootdrifter.io/sitemap.xml` — Ghost generates and keeps it current.)
5. **Request indexing** for the highest-value URLs (URL Inspection → Request indexing), in order:
   - `https://rootdrifter.io/`
   - `https://rootdrifter.io/portfolio/`
   - `https://rootdrifter.io/blog/`
   - each `https://rootdrifter.io/portfolio/<project>/` as it matters.

## After submission

- **Coverage** (Pages report): check back in 2–3 days; expect the portfolio + blog index indexed
  first. Investigate anything under "Not indexed".
- **Don't** index thin/teaser-gated content prematurely — once the published posts are de-teased,
  request indexing for those specific post URLs.
- **Bing:** optionally repeat at [bing.com/webmasters](https://www.bing.com/webmasters) (it can import
  directly from Search Console). Low effort, some EU recruiters use Bing.

## Privacy note

The verification token is **not** a secret (it only proves domain control) — fine to keep in
Cloudflare. Do **not** add the optional Search Console *email* to any public page.
