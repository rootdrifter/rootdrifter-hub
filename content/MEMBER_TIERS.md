# Membership tiers

The plan of record for rootdrifter.io membership. **Only the free tier is active.** Paid tiers are a
Stage-4 idea (once there is a real audience) — documented here so the structure is decided, not
improvised, but **not** advertised on the site until they exist. Don't promise content you aren't
publishing.

## Free tier — ACTIVE (now)

- All published posts (CTF writeups, methodology, study notes).
- Newsletter updates — sent only when something worth reading goes up (no schedule, no filler).
- Full portfolio access (`/portfolio`).
- Subscribe via `/subscribe/` (magic-link membership; requires Mailgun for the email send — pending).

Access setting: members **open** (free sign-up), newsletter enabled. From: `rootdrifter`,
reply-to `hello@rootdrifter.io`.

## Member tier — PLANNED (Stage 4, not active)

Only stand this up when the free list is established and there is a backlog of genuinely premium
material to justify it. Candidate value (deliver before charging, never the reverse):

- Exclusive deep-dives (full lab build logs, extended detection-engineering writeups).
- Detection-engineering playbooks (tuned Wazuh rules + the reasoning, from watchtower).
- Tooling/releases that come out of active security work.
- Direct Q&A access.

Indicative price point: **£5–8 / month** (revisit against actual demand).

## Sequencing guard

1. Establish weekly-ish cadence on the free tier.
2. Grow the list (even ~tens of engaged subscribers).
3. Accumulate 3–4 premium pieces *ready to ship* on day one of the paid tier.
4. *Then* enable the paid tier — not before. An empty paid tier reads worse than no paid tier.

> Keep this file in sync with the actual Ghost **Settings → Membership / Tiers** configuration. If the
> two disagree, the live Ghost config wins and this doc is updated to match.
