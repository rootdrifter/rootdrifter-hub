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

| Post | Status | Reviewed | Notes |
|------|--------|----------|-------|
| Enumeration Methodology Framework | PENDING REVIEW | - | - |
| Sec+ Domain 2: Threats | PENDING REVIEW | - | - |
| nmap: Beyond the Basics | PENDING REVIEW | - | - |
| CTF Writeup Template 1 | DRAFT | - | Not published — admin pipeline only |
| CTF Writeup Template 2 | DRAFT | - | Not published — admin pipeline only |

## Approval criteria

- No real operational values (IP addresses, hostnames, configs)
- No daemon names or hierarchy references
- Technical accuracy verified (cross-check figures against CLAUDE.md §5 invariants)
- Quality meets professional standard
- Privacy scan passed

See `POST_TEMPLATE.md` for the full per-post gate checklist.
