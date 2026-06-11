# Content Calendar — rootdrifter.io

A 12-week publishing plan for launch. The constraint is honesty: this is one person publishing
**alongside an active job-application sprint** (UK / NL / DE cleared roles), not a full-time content
operation. Cadence is set to be sustainable under that load — roughly **one substantial post per week**,
front-loaded where draft material already exists, with slack built in.

> Status: planning document. Posts marked **[drafted]** already exist as drafts in `content/posts/`.
> Everything else is a planned slot, not a commitment to a fixed date.

## Principles

- **Publish from a buffer, never to a deadline.** Keep 2–3 drafts ahead so a busy week never means a
  gap. The five existing drafts are that initial buffer.
- **Reuse, don't reinvent.** CTF writeups come from real `gauntlet` sessions; methodology posts
  generalise notes I already keep; Sec+ posts condense the `sec-plus-notes` domains. Each post should
  cost editing time, not net-new research time.
- **Every post earns its place against a content pillar.** No filler. If it doesn't map to a primary
  tag, it doesn't ship.

## The 12 weeks

| Week | Theme | Post(s) | Pillar (primary tag) | Source |
|------|-------|---------|----------------------|--------|
| 1 | Launch | About page goes live; **"Building a Repeatable Enumeration Framework"** **[drafted]** | pentest-methodology | existing draft |
| 2 | Launch | **"nmap: Beyond the Basics"** **[drafted]** | tool-spotlight | existing draft |
| 3 | CTF cadence | **THM writeup — Easy Linux** **[drafted]** | ctf-writeup | gauntlet session |
| 4 | CTF cadence | THM/HTB writeup — Easy/Medium | ctf-writeup | gauntlet session |
| 5 | CTF cadence | **HTB writeup — Medium Linux** **[drafted]** | ctf-writeup | gauntlet session |
| 6 | CTF cadence | CTF writeup — Windows or Web focus | ctf-writeup | gauntlet session |
| 7 | Tool series | Tool spotlight #2 (e.g. `ffuf`/`feroxbuster` content discovery) | tool-spotlight | methodology notes |
| 8 | Tool series | Tool spotlight #3 (e.g. `enum4linux` / SMB enumeration) | tool-spotlight | methodology notes |
| 9 | Sec+ notes | **Domain 2 — Threats & Vulnerabilities** **[drafted]** | sec-plus | sec-plus-notes |
| 10 | Sec+ notes | Domain 4 — Security Operations (the SOC-relevant domain) | sec-plus | sec-plus-notes |
| 11 | OSINT/recon | Passive recon & footprinting methodology | osint-recon | methodology notes |
| 12 | OSINT/recon | Subdomain & asset discovery workflow | osint-recon | methodology notes |

## After week 12 — steady state

Once the lab is built, the **detection-engineering** pillar opens up (see `WATCHTOWER_BRIDGE.md`): each
Wazuh detection scenario becomes one post. That is the content flywheel — lab work and writing feed each
other, and the blog stops depending on CTF cadence alone.

Steady-state target: **one post every 7–10 days**, drawn from whichever pillar has fresh material that
week. Quality and accuracy over frequency, always — a slower cadence of genuinely useful posts beats a
fast cadence of filler, especially for a security audience that can tell the difference.

## Reality check against the job sprint

Weeks 1–3 overlap the application deadline (21 June). Those slots are deliberately filled by the
**existing drafts** — editing-only, low effort — so the launch does not compete with applications for
the same hours. New-research posts (weeks 6+) land after the sprint eases.
