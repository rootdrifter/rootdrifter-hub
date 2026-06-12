# Internal linking map

A coherent content web keeps visitors moving between the blog and the portfolio, and gives Google a
clear topical structure. This is the canonical map of which posts link to which portfolio pages and
back. Apply links when a post is published/edited (Ghost editor), not retroactively in bulk.

Portfolio page URLs (live): `https://rootdrifter.io/portfolio/<project>/` —
`ironveil`, `nullbyte`, `spectre`, `oracle`, `mirage`, `gauntlet`. `watchtower` is **coming-soon**
(don't link until it's live, or the link 404s on a recruiter-facing page).

## Post → portfolio page (each post links out to its anchor project)

| Post topic / pillar | Links to portfolio page |
|---------------------|-------------------------|
| CTF writeups (THM/HTB) | `gauntlet` (primary) + `spectre` (methodology) |
| Pentest methodology / enumeration framework | `spectre` (primary) + `gauntlet` |
| Tool spotlight (nmap, etc.) | `spectre` + `gauntlet` |
| Detection engineering / SIEM / Wazuh | `watchtower` *(when live)* + `gauntlet` (offence→detection) |
| SIEM alert fatigue & tuning | `watchtower` *(when live)* |
| WireGuard vs OpenVPN | `ironveil` (the routing architecture in practice) |
| Verified boot / secure elements / GrapheneOS | `nullbyte` (Titan M2, verified boot) |
| LLM / causal detection / phishing | `mirage` (primary) + `oracle` |
| ML model assurance / adversarial robustness | `oracle` (primary) + `mirage` |
| Sec+ domain notes | the closest applied project (e.g. D4 SecOps → `watchtower`/`gauntlet`) |

## Portfolio page → post ("Related reading" block, added once the post is published)

| Portfolio page | Related post(s) to surface |
|----------------|----------------------------|
| `ironveil` | "WireGuard vs OpenVPN — a practical comparison" |
| `nullbyte` | "Verified boot and secure elements: what GrapheneOS gets right" |
| `spectre` | latest pentest-methodology post |
| `gauntlet` | latest CTF writeup |
| `oracle` | ML assurance / adversarial-robustness post |
| `mirage` | causal-vs-correlational detection post |
| `watchtower` *(when live)* | "SIEM alert fatigue" + the first build-session writeup |

## Rules of thumb

- **2–4 internal links per post**, in context, with descriptive anchor text (not "click here").
- Every post links to **at least one portfolio page** and **at least one other post** where natural.
- Don't link to teaser-gated or draft content from a published page (dead-end for the reader).
- Don't link `watchtower` anywhere public until the repo + portfolio page are live.
- The theme already renders a Related-posts block by primary tag — internal *body* links are the
  manual layer on top of that.
