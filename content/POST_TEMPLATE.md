# Post Template — the gate every post passes before going live

Copy this template for each new post. A post is not de-teased (the `teaser` tag removed) until
every checklist below is complete and signed off. Honest gaps beat invented completeness — if a
section can't be verified, it stays gated.

---

## 1. Metadata

| Field | Value |
|-------|-------|
| Title | |
| Slug | |
| Tags | (`teaser` until approved; plus topic tags, e.g. `ctf-writeup`, `methodology`, `sec-plus`) |
| Custom excerpt | (shown in the transmission overlay while gated, and in cards/SEO after) |
| Status | draft / published+teaser / published |
| Target publish date | |
| Source material | (which repo/notes the content derives from) |

## 2. Privacy checklist (fail-closed — any unchecked box keeps the gate shut)

- [ ] No real name, university, supervisor, or personal email anywhere
- [ ] No private codenames or hierarchy/linkage phrasing (run the standing denylist scan)
- [ ] No real operational values: home IPs, hostnames, live configs, key material
- [ ] Lab/CTF IPs are room-supplied or RFC 5737/1918 documentation ranges, stated as such
- [ ] No screenshots containing usernames, paths, or browser chrome with identifying detail
- [ ] `rootdrifter` spelled in full in every link (dropping the trailing "er" yields a 404)

## 3. Technical review

- [ ] Every command shown was actually run (or explicitly marked as illustrative)
- [ ] Versions, CVEs, figures, and tool output are real — nothing invented
- [ ] Figures cross-checked against the portfolio accuracy invariants where they overlap
- [ ] Claims match what the linked repo actually documents
- [ ] Code blocks carry the right language label

## 4. Quality checklist

- [ ] Structure: intro states what the reader gets; sections follow the methodology spine
- [ ] No marketing language; evidence-led, first person where appropriate
- [ ] Reads correctly at card level: title + custom excerpt make sense standalone
- [ ] Internal links resolve (blog + portfolio); external links use `rel="noopener"`
- [ ] Proofread once aloud — no filler sentences

## 5. Approval sign-off

| Step | Date | By |
|------|------|----|
| Privacy scan passed | | |
| Technical review passed | | |
| Quality review passed | | |
| `teaser` tag removed (live) | | |
| APPROVAL_QUEUE.md updated | | |
