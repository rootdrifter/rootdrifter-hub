---
title: "WriteUp: [Machine] — TryHackMe | Easy | Linux"
slug: thm-example-linux-easy
status: draft
tags: [ctf-writeup, tryhackme, easy, linux]
excerpt: "An easy Linux box from enumeration to root — the methodology is the point, not the box."
---

> Sample / template post. Every value is a placeholder; no real machine names, IP addresses, or flag
> values appear. Documentation ranges only (RFC 5737: 192.0.2.0/24). This demonstrates the exact shape
> a real writeup takes.

## Executive summary

A Linux target exposing a web service on port 80 and SSH on 22. The path to compromise runs through
a misconfigured web application that leaks credentials, which are then reused for SSH. Root falls to a
misconfigured `sudo` entry. Nothing here is novel — the value is the discipline: read the version off
the scan, map it to a known issue, and take the cleanest path.

## 1. Reconnaissance

```
nmap -sC -sV -p- -oA nmap/target 192.0.2.10
```

**Flag rationale** — `-p-` scans all 65,535 TCP ports (services on high ports are the classic miss);
`-sV` reads service versions (the version string is what maps to a known issue); `-sC` runs the default
NSE scripts for cheap banner and config hints; `-oA` saves all three output formats as engagement
evidence.

| Port | Service | Version       | Note            |
|------|---------|---------------|-----------------|
| 22   | SSH     | [version]     | Note for reuse  |
| 80   | HTTP    | [server/ver]  | The vector      |

**What to look for:** an old service banner that predates a known fix, and any non-standard high port.
On easy boxes, one legacy or misconfigured service is usually the whole path.

## 2. Enumeration

```
whatweb http://192.0.2.10
feroxbuster -u http://192.0.2.10 -w /usr/share/wordlists/dirb/common.txt -o ferox.txt
```

**What to look for:** hidden directories, source comments, and default or backup files. Record what
you *rule out* — "admin panel present but no default creds" is evidence that narrows the path.

| Finding            | Evidence                          | Lead?     |
|--------------------|-----------------------------------|-----------|
| `/[path]` exposed  | Directory listing enabled         | Yes       |
| Backup file        | `[file].bak` readable             | Yes       |
| Login form         | No default creds, no obvious inj. | Ruled out |

## 3. Exploitation

- **Chosen vector and why:** credential leak in an exposed backup file, over brute-forcing the login —
  cleaner, quieter, and deterministic.
- **[ATT&CK T1078 — Valid Accounts]** for the foothold: leaked credentials reused against SSH.

```
ssh [user]@192.0.2.10        # credentials recovered from the exposed backup
```

- **User flag:** `[REDACTED — placeholder]`

## 4. Privilege escalation

```
sudo -l ; find / -perm -4000 -type f 2>/dev/null    # highest-yield checks first
```

- **Vector:** a `sudo` rule permitting a binary that can shell out (GTFOBins pattern).
- **[ATT&CK T1548.003 — Abuse Elevation Control Mechanism: Sudo and Sudo Caching]**.

```
sudo [binary] [gtfobins-escape]   # spawn a root shell via the permitted binary
```

- **Root flag:** `[REDACTED — placeholder]`

## 5. Flags

| Flag | Location              | Value             |
|------|-----------------------|-------------------|
| User | `/home/[user]/user.txt` | `[placeholder]` |
| Root | `/root/root.txt`        | `[placeholder]` |

## 6. Tools used

| Tool         | Purpose                                  |
|--------------|------------------------------------------|
| `nmap`       | Port and service/version discovery        |
| `whatweb`    | Web stack fingerprinting                  |
| `feroxbuster`| Content/directory discovery               |
| `ssh`        | Authenticated foothold                    |
| GTFOBins     | Reference for the sudo-binary escape      |

## 7. ATT&CK mapping

| Stage          | Technique                                       | ID         |
|----------------|-------------------------------------------------|------------|
| Recon          | Active Scanning                                 | T1595      |
| Initial Access | Valid Accounts                                  | T1078      |
| Privilege Esc. | Abuse Elevation Control Mechanism: Sudo          | T1548.003  |

## 8. Key learnings

- Exposed backup/`.bak` files are a recurring easy-box giveaway — always content-discover before
  attacking a login form.
- `sudo -l` is the single highest-yield privesc check; run it before anything noisy.
- Credential reuse across services (web → SSH) is realistic and worth checking every time.

## 9. Defender perspective — logs & detection

What this looks like from a monitored SOC, and the rule that would catch it.

- **Log artefacts:** a burst of HTTP 404s during content discovery (web access log); a successful SSH
  login from an unusual source IP (auth log / `lastlog`); a `sudo` invocation of an unusual binary
  (auth log, `COMMAND=` field).
- **Detection logic:** alert on a single source producing a high rate of 404s, then a successful auth
  shortly after, from the same IP. Separately, alert on `sudo` execution of interpreters/pager/editor
  binaries outside an allowlist.
- **Why it fires:** the exploit *requires* the noisy discovery step and *requires* a sudo binary that
  can shell out — both are the behaviour the rules key on.
- **Defensive control:** remove backup files from the web root; least-privilege the `sudo` entry;
  alert on anomalous successful SSH sources.
