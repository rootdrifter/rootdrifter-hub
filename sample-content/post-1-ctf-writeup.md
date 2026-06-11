# WriteUp: [Machine Name] — [Platform] [Difficulty]

> Sample post — demonstrates the CTF-writeup content model. All values are placeholders; no real
> machine names, IPs, or flag values appear. Documentation IPs only (RFC 5737: 192.0.2.x).
> Tags: ctf-writeup, [platform]

## Executive summary

A [Linux/Windows] target exposing [service] on port [N]. The path to compromise runs through
[vulnerability class] — [one-sentence description]. The service account context is [user], so
[privilege escalation required / foothold is root]. The methodology, not the tooling, is the point:
read the version off the scan, map it to a known issue, and choose the cleanest path.

## 1. Reconnaissance

```
nmap -sC -sV -p- -oA nmap/target 192.0.2.10
```

**nmap flag rationale** — `-p-` scans all 65,535 TCP ports (services on high ports are the classic
miss); `-sV` reads service versions (the version string is what maps to a known issue); `-sC` runs the
default NSE scripts for cheap banner/config hints; `-oA` saves all output formats as evidence.

**What to look for in the scan:** old service banners that predate a known fix, and any non-standard
high port. One legacy service is usually the whole path.

| Port | Service | Version | Note |
|------|---------|---------|------|
| [N] | [service] | [version] | The vector |

## 2. Enumeration

```
[service-specific enumeration commands]
```

**What to look for:** [the one load-bearing fact this box turns on]. Document what you *ruled out* —
a dead end is evidence that narrows the path.

## 3. Exploitation

- **Chosen vector and why:** [vector] over [alternative] — [reason it is cleaner].
- **[ATT&CK Txxxx — technique name]** for the foothold.

```
[foothold command(s) — payload referenced, not pasted wholesale]
```

- **User flag:** `[captured]`

## 4. Privilege escalation

```
sudo -l ; find / -perm -4000 2>/dev/null    # highest-yield checks first
```

- **[ATT&CK Txxxx — technique name]** for the escalation.
- **Root flag:** `[captured]`

## 5. Defender perspective — logs & detection

What this looks like from a monitored SOC, and the rule that would catch it.

- **Log artefacts:** [which logs / Event IDs the activity generates].
- **Detection logic:** [a Sigma- or Splunk-style rule keyed on the malicious behaviour].
- **Why it fires:** [the exploit *requires* the behaviour the rule keys on].
- **Defensive control:** [patch / least privilege / segmentation / alert].

## 6. Key learnings

- [Transferable technique this box demonstrated.]
- [Tooling note / faster alternative.]
- [Blue-team transfer — the detection lesson.]
