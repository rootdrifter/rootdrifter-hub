---
title: "WriteUp: [Machine] — HackTheBox | Medium | Linux"
slug: thm-example-linux-medium
status: draft
tags: [ctf-writeup, hackthebox, medium, linux]
excerpt: "A medium Linux box with a multi-stage exploitation chain and a pivot through an internal service."
---

> Sample / template post. Every value is a placeholder; no real machine names, IPs, or flag values
> appear. Documentation ranges only (RFC 5737: 192.0.2.0/24). Medium boxes reward chaining — this
> template shows the shape of a two- to three-stage path.

## Executive summary

A Linux target where the foothold is a web application vulnerability that yields a low-privilege shell,
followed by lateral movement to a second account through reused credentials found in a config file, and
finally root via an exploitable internal service bound to localhost that was only reachable after the
foothold. The lesson of medium boxes is the **pivot**: the win is rarely one bug; it is the chain.

## 1. Reconnaissance

```
nmap -sC -sV -p- -oA nmap/target 192.0.2.20
```

| Port | Service | Version      | Note                         |
|------|---------|--------------|------------------------------|
| 22   | SSH     | [version]    | Note for credential reuse    |
| 80   | HTTP    | [app/ver]    | Foothold — web app           |
| —    | (internal) | —         | Discovered post-foothold      |

**What to look for:** the externally visible surface is deliberately thin. Assume the real escalation
service is internal and only enumerable *after* the first shell.

## 2. Enumeration

```
whatweb http://192.0.2.20
feroxbuster -u http://192.0.2.20 -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt
```

**What to look for:** application name and version → known-CVE lookup; parameters that reach the
filesystem or a template engine; any API path that trusts client input.

| Finding              | Evidence                       | Lead?     |
|----------------------|--------------------------------|-----------|
| App version banner   | Footer / HTTP header           | Yes (CVE) |
| Upload endpoint      | `/[path]/upload`               | Yes       |
| Verbose error        | Stack trace leaks app path     | Yes       |

## 3. Exploitation — stage 1 (foothold)

- **Vector:** the identified application version maps to a documented vulnerability class (e.g. an
  authenticated file-write or template injection). Confirm the version first; do not fire blind.
- **[ATT&CK T1190 — Exploit Public-Facing Application]**.

```
# request crafted against the vulnerable endpoint; payload referenced, not pasted wholesale
curl -s -X POST "http://192.0.2.20/[endpoint]" --data '[crafted]'
```

Result: code execution as the web service account ([www-data] / [app]). Stabilise the shell:

```
python3 -c 'import pty; pty.spawn("/bin/bash")'    # then background, stty raw -echo, fg
```

## 4. Post-exploitation & lateral movement — stage 2

```
cat /var/www/[app]/config.* 2>/dev/null     # credentials live in config more often than anywhere else
sudo -l ; id ; ss -tlnp                       # what can this account reach that I couldn't from outside?
```

- **Finding:** a database or service credential in an application config file, reused for a local user.
- **[ATT&CK T1078 — Valid Accounts]** / **[T1552.001 — Unsecured Credentials: Credentials In Files]**.

```
su [user2]            # or ssh [user2]@localhost — credential reuse
```

- **User flag:** `[REDACTED — placeholder]`

## 5. Privilege escalation — stage 3 (the pivot pays off)

The internal service seen in `ss -tlnp` (bound to `127.0.0.1`) is now reachable. It runs as root and
exposes an exploitable interface.

```
ss -tlnp | grep 127.0.0.1          # confirm the localhost-only service
ssh -L 9000:127.0.0.1:[port] [user2]@192.0.2.20   # or exploit it directly from the box
```

- **Vector:** the internal service's version maps to a privilege-relevant issue; exploited locally it
  yields a root context.
- **[ATT&CK T1068 — Exploitation for Privilege Escalation]**.

- **Root flag:** `[REDACTED — placeholder]`

## 6. Flags

| Flag | Location                | Value           |
|------|-------------------------|-----------------|
| User | `/home/[user2]/user.txt`| `[placeholder]` |
| Root | `/root/root.txt`        | `[placeholder]` |

## 7. Tools used

| Tool          | Purpose                                     |
|---------------|---------------------------------------------|
| `nmap`        | External port/service discovery              |
| `feroxbuster` | Web content discovery                        |
| `curl`        | Crafting the foothold request                |
| `ss`          | Discovering the internal localhost service   |
| `ssh -L`      | Port-forwarding the internal service         |

## 8. ATT&CK mapping

| Stage          | Technique                              | ID         |
|----------------|----------------------------------------|------------|
| Initial Access | Exploit Public-Facing Application      | T1190      |
| Credential Acc | Unsecured Credentials: Credentials In Files | T1552.001 |
| Lateral Move   | Valid Accounts                         | T1078      |
| Privilege Esc. | Exploitation for Privilege Escalation  | T1068      |

## 9. Key learnings

- Config files are the highest-yield place to look after any foothold — credentials live there.
- `ss -tlnp` immediately after a shell reveals the localhost-only services that are the real target.
- Medium difficulty is a *chaining* test: confirm each stage's version-to-issue mapping before acting.

## 10. Defender perspective — logs & detection

- **Log artefacts:** an anomalous POST to a rarely-used endpoint followed by an outbound or local shell
  (web/app log + process telemetry); a `su`/`ssh` to a second local account; a new local connection to
  a previously dormant localhost service.
- **Detection logic:** alert when a web service account spawns an interactive shell (parent =
  web server, child = `bash`/`sh`); alert on first-seen process connecting to an internal service port.
- **Why it fires:** the chain *requires* the web account to execute a shell and *requires* a new local
  connection to the internal service — both are anomalous for that account.
- **Defensive control:** patch the public app; never store reusable plaintext credentials in configs;
  restrict and monitor the internal service; apply egress and process allowlisting to the web account.
