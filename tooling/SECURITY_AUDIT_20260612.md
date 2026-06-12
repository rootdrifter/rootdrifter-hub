# Security & Privacy Audit — rootdrifter platform — 2026-06-12

Forensic sweep of all 11 public repositories, the production site, git history, and the
production server configuration. Method: extended-pattern content scan (credential material,
private-key blocks, cloud access keys, the private demonology codename set, the superseded
profile codename, the org-handle typo (the handle missing its trailing letters), private-repo/file
references, real-name fragments, and the operator's private email address), run against tracked files, rendered
production HTML, and full `--all` git history.

## Executive Summary

**Posture: CLEAN.** No critical, high, or medium findings. Zero credential material, private
keys, or cloud access keys in any repository, history, or production page. The operator's private
email address appears nowhere — not in any working tree, not in any commit, not on any live page.
The origin server IP is absent from every public file. One low/informational item (a benign
common noun in historical commit diffs) and two operational items (not content leaks) are
recorded below.

## Scope

| Surface | What was scanned |
|---|---|
| 11 public repos (tracked files) | ironveil, nullbyte, spectre, oracle, mirage, gauntlet, rootdrifter, sec-plus-notes, rootdrifter.github.io, rootdrifter-hub, watchtower |
| Git history | `git log --all -p` across every pushed repo |
| Production site | 13 routes, scanned via loopback (`--resolve …:127.0.0.1`) to bypass CDN-edge variance |
| Production server | `config.production.json` (secrets redacted), `.gitignore` coverage, tracked-file check |

## Findings

### Critical (fix immediately)
None.

### High (fix this session)
None.

### Medium (fix soon)
None.

### Low / Informational
- **L1 — the private mail-provider domain name appears in `rootdrifter-hub` git history.** Three
  historical commit diffs (audit/checklist docs, e.g. the pre-production audit) contain the
  provider-domain word as a *meta-reference* — the scan checklists list it as a pattern-to-scan-for
  to-do item. This is the scanner documenting itself, not a leaked address. **The operator's actual
  private email address (the full `local-part@provider` form) was never committed to any repo**
  (verified by a history scan for the address fragment — zero hits). Current tracked files contain
  zero hits for the provider word (the meta-references were reworded in a prior session, commit
  `5bf8a42`). Removing the word from
  history would require a history rewrite + force-push of a public repo; per standing policy
  (`CLAUDE.md` §7, prior sessions) this is **deferred to explicit operator authorization** and is
  not recommended for a benign common noun. **Risk: negligible.**

### Informational / Operational (not content leaks — recorded for completeness)
- **O1 — Hetzner egress block (availability/maintenance risk).** The production host can reach
  outbound only on 587/465 (verified 2026-06-12: outbound 443 and 53/tcp time out; UFW is clean,
  so the block is at the Hetzner Cloud-Firewall level). Email (Resend, 587) works. **Impact:**
  ACME/Let's Encrypt renewal (cert valid → 2026-09-08) and `apt`/unattended-upgrades cannot reach
  the network, so **TLS renewal and OS security patching will fail until egress is opened.** The
  cron health-check was hardened in the prior session to probe loopback so this does not trigger a
  restart loop. **Operator action: open outbound TCP 443 + 80 + 53 in the Hetzner Cloud Firewall.**
- **O2 — production config hardening confirmed.** `config.production.json` is gitignored
  (`config.*.json`, `*.db`, `.env*` all covered) and tracked in no repo; the mail credential lives
  only on the box; `mail.options.secure` is the correct JSON boolean `false`;
  `security.staffDeviceVerification` is **on**; Ghost binds loopback `127.0.0.1:2369` (nginx is the
  sole public listener). No change needed.

## Actions Taken
- Verified (did not need to change): zero credential/key/private-email exposure across tracked
  files, history, and production; origin IP absent from all public files; the daemon codename set and
  the superseded profile codename at zero raw hits; the org-handle typo at zero; private-repo
  references at zero.
- No fixes were required this session — the surface was already clean (the prior session's
  nullbyte threat-model privacy fix and the standing scan discipline are holding).

## Remaining Items (operator)
- **O1 egress** — open Hetzner outbound 443/80/53 (time-relevant for cert renewal + patching).
- **L1 history** — optional, not recommended: a history rewrite to scrub the benign mail-provider
  noun from old commit diffs. Defer unless there is a specific reason; the private address is not
  involved.

## Method Notes (reproducibility)
- Content scans use `git grep -InE` over **tracked** files (what is actually public), and the
  **raw** match list is inspected directly — never a filtered count — because a filter that
  suppresses known meta-reference false-positives can also mask a genuine leak sitting beside
  explanatory text (the lesson from the prior session's nullbyte finding).
- Production scans run from the box via `--resolve rootdrifter.io:443:127.0.0.1` so the result
  reflects what the origin actually serves, independent of CDN-edge caching or transient edge 000s.
