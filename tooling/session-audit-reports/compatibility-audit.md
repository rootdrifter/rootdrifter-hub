# Cross-Browser Compatibility Audit — Ghost theme

Date: 2026-06-11 · Session S0-07 · Target support: current Chrome, Firefox, Safari, Edge
(security professionals run modern browsers — IE11 is explicitly out of scope).

## Verdict

**No compatibility blockers.** Every modern feature used has either universal support in the
target browsers or a graceful fallback. The conservative choice throughout (CSS custom
properties + fl/grid with simple fallbacks, ES5 component JS) means the theme degrades to
readable content even where a feature is unsupported.

## CSS

| Feature | Usage (count) | Support | Fallback / note |
|---------|---------------|---------|-----------------|
| CSS Custom Properties (`var(--…)`) | 199 | All target browsers (not IE11) | IE11 unsupported — acceptable; the site is content-readable without the custom palette anyway |
| Flexbox (`display:flex`) | ~19 | Universal | — |
| CSS Grid (`display:grid` + `grid-template`) | 4 grids | Universal in target browsers | `.project-grid` / `.det-cols` collapse to single column under 768/640px via media query |
| `@keyframes` (2: `blink`, `pulse-border`) | 2 | Universal | Disabled under `prefers-reduced-motion` |
| `transform` | 31 | Universal | Hover-only lift effects; no vendor prefix needed for target set |
| `position: sticky` (TOC desktop) | 1 | All target browsers | Falls back to static flow if unsupported — TOC still renders |
| `clip-path: inset(50%)` (sr-only label) | 1 | Universal | Paired with legacy `clip` for older engines |

- **Reduced motion:** a global `@media (prefers-reduced-motion: reduce)` rule zeroes all
  animations/transitions; the hero typewriter and rain canvas also have explicit reduced-motion
  paths. (2 reduced-motion blocks in screen.css + per-component guards.)
- **Print:** dedicated `@media print` stylesheet (ink-on-paper, nav/motion stripped).
- **Colour scheme:** dark-first by design; the `prefers-color-scheme: light` block intentionally
  keeps the terminal aesthetic (documented in the CSS) rather than forcing a light theme.

## JavaScript

| File | Features | Support | Note |
|------|----------|---------|------|
| default.hbs inline | `querySelectorAll`, `addEventListener`, `classList`, `navigator.clipboard` | Universal; clipboard has a `.catch` fallback | Code-copy degrades to no-op on failure |
| toc.js | `matchMedia`, `querySelectorAll` | Universal | Skips entirely if <3 headings |
| 6 component JS files | `forEach`, `addEventListener`, `IntersectionObserver`, `matchMedia`, `requestAnimationFrame` | Universal in target browsers | **Written in ES5** (no arrow functions, `const`/`let`, `async`/`await` — verified 0 occurrences) for maximum compatibility |

- **No `fetch`, no ES modules, no async/await** anywhere — deliberately conservative.
- **IntersectionObserver** (gauntlet radar reveal) has an explicit fallback: if unsupported, the
  shape renders immediately rather than staying hidden.
- **Progressive enhancement:** every interactive component mounts *on top of* a static markdown
  fallback (table / list) that it hides only once the JS successfully runs. If JS is disabled or
  fails, the reader still sees all the data — verified by reading the page source.

## Minimum supported browsers (documented)

Chrome/Edge 90+, Firefox 88+, Safari 14+ (2021-era and newer) — covers custom properties,
grid, IntersectionObserver, and `clip-path` universally. Older browsers get readable,
unstyled-palette content with static (non-interactive) data tables.
