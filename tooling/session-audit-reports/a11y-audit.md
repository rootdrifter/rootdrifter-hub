# Accessibility Audit — Ghost theme (local dev)

Date: 2026-06-11 · Session S0-02 Task 5 · Pages fetched live from http://localhost:2368
(home, /blog/, /about/, /subscribe/) after the teaser-system deploy.

## Summary

No critical issues. One minor fix applied this session. The theme was built with a11y in
mind from the start (skip link, landmarks, ARIA on interactive components, reduced-motion
handling) and that holds after the teaser additions.

## Checks and evidence

| Check | Result | Evidence |
|-------|--------|----------|
| Skip-to-content link | PASS | `.skip-link` present on all 4 pages, `:focus` reveals it |
| Main landmark | PASS | `<main id="main" role="main">` on all 4 pages |
| Nav landmarks labelled | PASS | `aria-label="Primary navigation"` / `"Footer"` / `"Adjacent posts"` |
| Headings | PASS | Single h1 per page; real `<h2>` section headings (3–5 aria-labels per page) |
| Images alt text | PASS | 0 `<img>` without `alt` on any fetched page |
| Form labels | PASS (fixed) | Subscribe input has `<label for="subscribe-email">`; label had no CSS rule and rendered as stray visible text — now a screen-reader-only class (fix applied to `screen.css`) |
| Link text quality | PASS | 0 "click here"/"read more" instances; CTAs are descriptive ("View portfolio →", "All posts →") |
| Mobile nav toggle | PASS | `aria-expanded` toggled by JS; `aria-controls="pnavLinks"` |
| Motion | PASS | Global `prefers-reduced-motion` rule kills all animations incl. the new `pulse-border`; typewriter + rain canvas have explicit reduced-motion paths |
| Teaser overlay | PASS | Overlay is plain DOM text (no aria-hidden trap); subscribe form inside it keeps its label/status roles (`role="status"` / `role="alert"` on messages) |
| Focus visibility | PASS | `:focus-visible` outline rule applies theme-wide |
| noscript fallback | PASS | Typed hero line has a `<noscript>` equivalent |

## Notes

- The `// TRANSMISSION INCOMING` label is decorative-styled but informative text — left as
  real text (correct for screen readers).
- The TOC (`toc.js`) uses native `<details>/<summary>` — keyboard and SR behaviour comes free.
- Colour contrast: muted text `--muted` on `--bg` is used only for meta/secondary text;
  body text uses `--text`. No change made; flag for a full contrast pass post-launch
  with real tooling (axe/Lighthouse) on the production URL.
