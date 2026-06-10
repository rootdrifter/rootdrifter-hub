# RootDrifter Hub — Claude Code Session Instructions

## Read first, every session:
1. directives/CONSTITUTION.md — privacy rules, two namespaces
2. directives/DENYLIST.md — forbidden patterns
3. This file

## Standing rules:
- git -C /home/exiled/github/rootdrifter-hub for all git ops
- Never git commit --no-verify
- Fail-closed on anything uncertain re: privacy

## Ghost dev instance:
- Location: /home/exiled/ghost/rootdrifter-dev
- Start: ghost start (from that directory)
- Admin: http://localhost:2368/ghost
- Theme path: /home/exiled/ghost/rootdrifter-dev/content/themes/

## Theme development:
- Theme name: rootdrifter
- Theme path: content/themes/rootdrifter/  (mirrored in this repo at theme/)
- After theme changes: ghost restart or use symlink to live-reload
- gscan validation: npx gscan content/themes/rootdrifter/

## Session close:
- Run privacy scan before any commit
- Write summary to session-progress.md
- Never push config.*.json files
