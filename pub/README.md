# `pub/` — publicly-accessible content (target structure)

This tree is the **intended home** for everything in this repo that is public by design:

```
pub/
├── theme/      Ghost theme (rootdrifter)
├── content/    Ghost content (pages, posts, routing source)
├── deploy/     deployment docs + scripts
└── tools/      public-facing tools
```

It is the public counterpart to `src/`, which holds private source material and tooling
(the social pipeline, etc.) and is **never pushed** (git-ignored).

## Status: scaffold only — live deploy NOT yet relocated

The authoritative, live copies currently remain at the **repo top level** — `theme/`,
`content/`, `deploy/`, `routes.yaml`, `directives/` — because:

- The **live Ghost deploy reads them from the top-level paths.** `routes.yaml`, the deploy
  scripts under `deploy/`, and the Ghost theme path all reference those locations.
- Relocating them (`git mv` into `pub/`) is an **outward-facing, breaking change to a live
  site** — it would invalidate those paths until every reference is updated and the deploy is
  re-pointed and re-verified.
- Copying them (`cp` into `pub/`) would commit a **duplicate** of a live, public site into the
  same repo — bloat, drift, and ambiguity about which copy is authoritative.

So the relocation is **deferred for an operator decision**, with the migration steps and the
trade-off recorded in `logs/checkpoint-ts01-20260619.md`. The core goal of the restructure —
separating private source (`src/`) from public content so the social pipeline can never leak —
is already fully achieved by the `src/` split and the fail-closed `.gitignore`.

When the operator approves relocation: `git mv` each top-level public dir into `pub/`, update
`routes.yaml` + the `deploy/` scripts + the Ghost theme path, then re-verify all routes return
200 and `gscan` passes before pushing.
