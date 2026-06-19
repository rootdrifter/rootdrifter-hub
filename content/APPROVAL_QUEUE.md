# Content Approval Queue

Every post on rootdrifter.io is gated behind the teaser system (Ghost tag `teaser`) until it has
been manually reviewed and approved. Teaser posts appear in the blog index with full card
visibility plus an INCOMING indicator; opening one shows an 80-word preview, a gradient cutoff,
and the `// TRANSMISSION INCOMING` overlay with a subscribe form.

## How to approve a post

1. Review the post in Ghost admin: http://localhost:2368/ghost
2. Read the full content — check accuracy, privacy, quality
3. If approved: remove the `teaser` tag in Ghost admin (post → Tags → remove `teaser` → Update)
4. The post immediately shows full content to all visitors
5. Mark it APPROVED below (date + initials in Reviewed)
6. Update the hard-coded teaser count in `theme/index.hbs` (the `transmission-count` line) and redeploy

## Content status taxonomy (Ghost tags)

| Tag | Meaning |
|-----|---------|
| `teaser` | Published but gated — pending review |
| `approved` | Reviewed and de-teased — full content live |
| `featured` | Flagship content — pinned/highlighted |

## Queue Status

> **2026-06-19 (TS06) correction:** the three published posts below were found **already de-teased**
> (the `teaser` tag had been removed) and serving full content live — verified by fetching the live
> HTML (zero teaser markers, full `post-content`). Status updated from the stale "PENDING REVIEW" to
> reflect verified ground truth. Note: the de-tease gate on this theme is the Ghost **`teaser` tag**
> (`{{#has tag="teaser"}}` in `theme/post.hbs`), **not** member `visibility` — all posts are
> `visibility:public`; removing the tag is what publishes full content.

| Post | Status | Reviewed | Notes |
|------|--------|----------|-------|
| Enumeration Methodology Framework | APPROVED — LIVE | 2026-06-19 (TS06 verify) | De-teased; full content public at `/blog/methodology-enumeration-framework/` (1795 words, no teaser overlay) |
| Sec+ Domain 2: Threats | APPROVED — LIVE | 2026-06-19 (TS06 verify) | De-teased; full content public at `/blog/sec-plus-domain-2-threats/` |
| nmap: Beyond the Basics | APPROVED — LIVE | 2026-06-19 (TS06 verify) | De-teased; full content public at `/blog/tool-spotlight-nmap/` |
| SIEM Alert Fatigue: Why Tuning Matters More Than Rules | DRAFT — READY FOR REVIEW | - | Practitioner post (D4 + Wazuh lab); no operational values |
| Verified Boot and Secure Elements: What GrapheneOS Gets Right | DRAFT — READY FOR REVIEW | - | nullbyte-grounded; verification workflow explained, hash value NOT included |
| WireGuard vs OpenVPN: A Practical Comparison | DRAFT — READY FOR REVIEW | - | ironveil-grounded; no endpoints/IPs/tunnel names |
| The Case for Causal Detection Engineering | PENDING LIVE CREATION | - | mirage-grounded (DoWhy/DAG/adversarial evasion) → SOC + watchtower; body version-controlled, **not yet in Ghost** (Admin-API auth blocked, see deploy/HARDENING-ghost-rate-limit.md) |
| How CTF Practice Builds Real Security Skills | PENDING LIVE CREATION | - | gauntlet-grounded (methodology + ATT&CK + offence→detection); body version-controlled, **not yet in Ghost** (Admin-API auth blocked) |
| WriteUp: Blue — TryHackMe (Windows) | DRAFT | - | From gauntlet stub — publish when the room is completed under account |
| WriteUp: Kenobi — TryHackMe (Linux) | DRAFT | - | From gauntlet stub — publish when completed |
| WriteUp: Steel Mountain — TryHackMe (Windows) | DRAFT | - | From gauntlet stub — publish when completed |
| WriteUp: Alfred — TryHackMe (Windows) | DRAFT | - | From gauntlet stub — publish when completed |
| WriteUp: Basic Pentesting — TryHackMe (Linux) | DRAFT | - | From gauntlet stub — publish when completed |
| WriteUp: Jerry — HackTheBox (Windows) | DRAFT | - | From gauntlet stub — Tomcat default-creds → WAR shell; publish when completed |
| WriteUp: Lame — HackTheBox (Linux) | DRAFT | - | From gauntlet stub — Samba CVE-2007-2447; publish when completed |
| Sec+ Domain 4: Security Operations (study notes) | DRAFT | - | Blog-toned SOC overview; publish when reviewed |
| Sec+ Domain 1: General Security Concepts (study notes) | DRAFT | - | Blog-toned foundations overview; publish when reviewed |

Count rule: "transmissions in preparation" on the homepage = real machine-writeup / study-note /
practitioner drafts still in prep. Currently **15 live in Ghost** (3 published — now de-teased/live —
plus 12 drafts: 5 THM + 2 HTB + 2 Sec+ + 3 practitioner). **+2 practitioner bodies are version-controlled but
NOT yet created in Ghost** (causal-detection-engineering, ctf-practice-real-skills) — blocked by the
Admin-API auth issue; create them once the integration is fixed, which will take the count to 17.

> Notes: a Sec+ Domain 2 post is already **published** (teaser-gated), so the Sec+ drafts are
> Domain 4 (the SOC-critical domain) and Domain 1 (foundations) to avoid duplication. All 7
> gauntlet stubs have draft posts (5 THM + 2 HTB). The 3 practitioner drafts (2026-06-12) are
> the strongest de-tease candidates after review — written for working practitioners, not exam
> candidates, and grounded in the portfolio projects. The two placeholder CTF templates were
> removed from the queue (never in production; POST_TEMPLATE.md covers the format).

## Approval criteria

- No real operational values (IP addresses, hostnames, configs)
- No daemon names or hierarchy references
- Technical accuracy verified (cross-check figures against CLAUDE.md §5 invariants)
- Quality meets professional standard
- Privacy scan passed

See `POST_TEMPLATE.md` for the full per-post gate checklist.
