<!-- ghost-page
slug: portfolio-spectre
title: SPECTRE — Grey-Box Penetration Test
excerpt: APACHE 2.4.58 TARGET · POSTGRESQL 16 DEFENDED · PTES METHODOLOGY · QUALITY GATE — CLEAR
-->

> **// ENGAGEMENT STATUS — COMPLETE · rev 2026-06-12**

> **// IN PLAIN TERMS** — Before you can defend a system, you need to understand how it's attacked.
> This is a controlled, authorised break-in attempt against a web server, documented to the standard
> a paid engagement would require — including a tamper-proof evidence trail proving exactly what
> happened, and the point where I deliberately stopped rather than cross an ethical line.

> **// Overview** — Grey-box penetration test of a peer-supplied Apache 2.4.58 host on Ubuntu
> 24.04.2 LTS, conducted against a self-hardened PostgreSQL 16 server built to CIS Level 1
> Benchmark. Full methodology documented: reconnaissance, host enumeration, two exploitation
> attempts, a reproducible SHA-256 evidence chain, and countermeasures mapped to ISO/IEC
> 27002:2022 and CIS Apache HTTP Server 2.4 Benchmark v1.4.0 — then closed with a **detection
> perspective** that maps every offensive step to the log source and Wazuh rule that would
> catch it, turning a one-sided test into a purple-team artefact.

---

## Attack Path

The engagement unfolded as a single connected chain. A full-port SYN scan surfaced only two
services — SSH on 22 and Apache 2.4.58 on 80 — but the server banner disclosed its exact
version and OS unprompted: the first information leak. HTTP fingerprinting confirmed an active
`Index of /` at the web root before any directed probing, and Gobuster narrowed the surface
further — `/server-status` returned 403, proving `mod_status` was loaded but only
access-controlled, partial hardening rather than removal. Two unauthenticated GET requests then
tested the two strongest leads: `/server-status` held at 403, but the web root returned 200
with a live directory listing (CWE-548) — the finding that would expose any future backup
archive, source file, or credential string to anonymous enumeration and seed SQL-injection
reconnaissance. Authenticated local enumeration with LinPEAS closed the picture: an
over-privileged sudo account and services irrelevant to the web stack widened the host's attack
surface well beyond HTTP.

The control case ran in parallel. The self-hardened PostgreSQL 16 server — same Ubuntu base,
same hypervisor — returned *nothing* enumerable: only SSH reachable, the database
loopback-bound, every CIS Level 1 control satisfied, no escalation path found. Same OS,
opposite outcome — configuration, not platform, decided breach resistance. That contrast is the
engagement's headline finding and the way these results would be framed for a client.

---

## Attack Path Timeline

<div id="spectre-component" aria-label="Interactive attack path timeline"></div>

1. **Reconnaissance** — `nmap -sS -sV -O -p-`: full-port SYN scan with service and OS
   fingerprinting surfaced exactly two services: SSH on 22/tcp and Apache 2.4.58 on 80/tcp.
   Key observation: the server banner disclosed its exact version and OS unprompted — the
   engagement's first information leak (feeds F4).
2. **Enumeration** — WhatWeb -a 3 · Gobuster (common.txt, 4,615 paths) · Nikto v2.5.0
   (8,102 requests): HTTP fingerprinting confirmed an active *Index of /* at the web root
   before any directed probing. `/server-status` returned 403 — proving mod_status was loaded
   but only access-controlled (partial hardening, F5). Nikto returned 15 findings including
   missing security headers (F3).
3. **Exploitation** — curl / manual HTTP, two unauthenticated GET requests: `GET /server-status`
   held at 403; `GET /` returned 200 with a live directory listing — **CWE-548**, the
   engagement's primary finding (F1).
4. **Post-Exploitation** — LinPEAS (PEASS-ng v0.2.0), scoped to /home/, halted
   pre-token-harvest: an over-privileged sudo account with no command restrictions (F6) and
   services irrelevant to the web stack — snapd, ModemManager — widening the attack surface (F7).
5. **Reporting** — OWASP risk scoring · ISO/IEC 27002:2022 · CIS Apache 2.4 Benchmark v1.4.0:
   seven findings, each severity-rated and mapped to a concrete countermeasure. Evidence:
   24 files (4.1 MiB), every artefact SHA-256 hashed, dual session logs.

---

## Engagement Scope

| Aspect | Detail |
|--------|--------|
| Target | **Apache 2.4.58 on Ubuntu 24.04.2 LTS** — peer-operated host |
| Model | **Grey-box** — authenticated console access available; disruptive exploits out of scope |
| Environment | Two VirtualBox guests (2 vCPUs / 2 GB RAM) on isolated 192.168.0.0/24 host-only subnet. Kali Linux workstation as attack platform. |
| Constraint | Unauthenticated HTTP vectors only. No command injection, LFI/RFI, or brute-force. All actions logged and SHA-256 verified. |
| Defended Asset | **PostgreSQL 16 server** — built to CIS Level 1 standard. Exposed no enumerable attack surface. |

---

## PTES Phase Map

| PTES Phase | Activity | Reference |
|------------|----------|-----------|
| Pre-engagement | Grey-box scope, rules of engagement, lab topology agreed | engagement-scope.md |
| Intelligence gathering | Full-port SYN scan, HTTP fingerprinting, directory enumeration | reconnaissance.md |
| Threat modelling | Risk questions and defended-asset definition | README §2 |
| Vulnerability analysis | Findings cross-referenced to CWE, CIS Apache 2.4, OWASP | vulnerability-report.md |
| Exploitation | Two unauthenticated HTTP GET attempts | exploitation.md |
| Post-exploitation | LinPEAS privilege/service enumeration (scoped, halted pre-token-harvest) | README §3.3 |
| Reporting | Findings, severity, ISO/IEC 27002-mapped countermeasures | countermeasures.md |

---

## Toolchain

| Tool | Use |
|------|-----|
| `nmap -sS -sV -O -p-` | Full-port SYN scan with service and OS fingerprinting. Identified open ports 22/tcp (SSH) and 80/tcp (Apache 2.4.58). |
| Gobuster dir | Directory brute-force with common.txt (4,615 paths). Confirmed /server-status access-controlled (403) and web-root indexing active. |
| WhatWeb -a 3 | HTTP fingerprinting at aggression level 3. Resolved Apache[2.4.58], HTTPServer[Ubuntu Linux], Index-Of — version and indexing disclosure. |
| Nikto v2.5.0 | 8,102 requests, 15 findings. Confirmed missing security headers, directory indexing at multiple paths, permitted OPTIONS methods. |
| LinPEAS (PEASS-ng v0.2.0) | Host privilege and service enumeration. Scoped to /home/, halted pre-API-key phase. Identified unrestricted sudo, unnecessary services, autoindex config. |
| curl / manual HTTP | Two unauthenticated exploitation attempts: GET /server-status (403 returned) and GET / (200 — directory listing confirmed, CWE-548). |

---

## Findings

| # | Finding | Severity | CWE / Control | Remediation |
|---|---------|----------|---------------|-------------|
| F1 | Directory auto-indexing enabled at web root — `Options Indexes` active; web root returned HTTP 200 with auto-generated listing. Any future file drops exposed to unauthenticated enumeration. | Medium-High | CWE-548 · CIS Apache 2.4 control 2.5 | `a2dismod autoindex`; `Options -Indexes` in virtualhost config |
| F2 | Cleartext HTTP only — no TLS virtual host, no redirect from 80 to 443 | Medium | CWE-319 | HTTP→HTTPS 301 redirect; TLS virtual host with valid certificate |
| F3 | Security headers absent — X-Frame-Options, X-Content-Type-Options (X-XSS-Protection also absent) on all responses | Medium | CWE-1021 · CWE-693 | `Header always set X-Frame-Options DENY`; `X-Content-Type-Options nosniff` |
| F4 | Service version and OS disclosure — banner returned `Apache/2.4.58 (Ubuntu)` | Low | CWE-200 | `ServerTokens Prod`; `ServerSignature Off` |
| F5 | mod_status loaded — GET /server-status 403 confirms module present (partial CIS compliance) | Low | CWE-200 | `Require ip 127.0.0.1` on /server-status; `a2dismod status` if unused |
| F6 | Host user in sudo group with unrestricted command execution | Medium | CWE-250 | Remove from sudo; least-privilege; key-only SSH; scoped sudoers |
| F7 | Unnecessary services running (snapd, ModemManager) | Low | CIS minimisation control | `systemctl disable --now snapd ModemManager` |

> **// PostgreSQL Server — Baseline Posture** — All CIS PostgreSQL 16 Benchmark v2.0.0 Level 1
> controls satisfied. Port scan: only 22/tcp reachable externally; 5432/tcp loopback-bound. No
> world-writable data directories. No privilege escalation paths identified by LinPEAS.
> scram-sha-256 authentication for all host connections. The same Ubuntu base, hardened
> correctly, produces zero enumerable findings.

---

## Detection Perspective — The Defender's View

A finding is only half the story. The other half — and the one a SOC cares about — is *would
anyone have noticed?* Every offensive action in the engagement maps to the log evidence it
generates and the detection logic that would surface it, mirroring the offence→detection
discipline practised in [gauntlet](https://github.com/rootdrifter/gauntlet) and feeding the
Wazuh rules in the watchtower SIEM lab.

The defining characteristic of this engagement's recon is that **it was loud**. Nikto alone
issued 8,102 requests and Gobuster tested 4,615 paths — that volume is trivially detectable,
and the honest defensive finding is that the target had *no* logging pipeline that would have
raised an alert.

| Offensive action | Log source | ATT&CK | Detection logic |
|------------------|-----------|--------|-----------------|
| Full-port SYN scan (`nmap -sS -p-`) | Firewall / NetFlow / Suricata | T1595.001 / T1046 | Many SYNs to many (mostly closed) ports from one source in a short window — connection-rate anomaly per source |
| Directory brute-force (Gobuster, 4,615 paths) | Apache `access.log` | T1595.003 | A burst of 404/403 responses to non-existent paths from a single IP — the canonical web-enumeration signature |
| Vulnerability scan (Nikto, 8,102 requests) | Apache `access.log` | T1595.002 | High request volume + the default Nikto User-Agent + probes to `/.hta`, `/.htpasswd`, test CGI paths |
| Directory-index discovery (CWE-548) | Apache `access.log` | T1083 | `GET /` returning HTTP 200 with `Index of` titles — repeated listing requests = active enumeration |
| `/server-status` probe | Apache `access.log` | T1592 | Requests to status/admin endpoints; the 403 is logged and is itself the indicator |
| LinPEAS host enumeration | `auditd` (execve) | T1059 / T1083 / T1082 | A single process rapidly reading `/etc/passwd`, running `find / -perm -4000`, `sudo -l`, and crontab — a textbook local-recon execve burst |
| `sudo` privilege use (F6) | `auditd` / `auth.log` | T1548.003 | Privileged command execution by the host user — baseline and alert on anomalous sudo |

**Two detections worth writing** — the loudest, highest-fidelity signals:

**1. Web reconnaissance — 404/403 burst per source.** Gobuster and Nikto generate
hundreds-to-thousands of failed requests from one IP. A Wazuh correlation rule keyed on the
Apache access log catches this with almost no false positives, because legitimate users do not
request 4,000 non-existent paths:

```xml
<group name="apache,web,recon,attack,">
  <!-- Many 404/403s from one source in a short window = directory/vuln scanning -->
  <rule id="100600" level="10" frequency="50" timeframe="30">
    <if_matched_sid>31108</if_matched_sid>   <!-- Apache 4xx access-log rule -->
    <same_source_ip />
    <description>Web reconnaissance: 404/403 burst from one source (Gobuster/Nikto-class scan) — T1595</description>
    <mitre><id>T1595.003</id></mitre>
  </rule>
</group>
```

**2. Host enumeration — the LinPEAS execve pattern.** Once on the host, the enumeration
script's behaviour is high-signal: a single parent rapidly invoking `find … -perm`, `sudo -l`,
and `cat /etc/passwd`. An auditd-backed Wazuh rule on that execve cluster catches
privilege-escalation recon:

```xml
<group name="linux,audit,privesc,attack,">
  <rule id="100601" level="12">
    <if_group>audit</if_group>
    <field name="audit.command" type="pcre2">(find .*-perm|sudo -l|linpeas)</field>
    <description>Local privilege-escalation enumeration (LinPEAS-class behaviour) — T1083/T1548</description>
    <mitre><id>T1083</id><id>T1548.003</id></mitre>
  </rule>
</group>
```

> **// The honest defensive finding** — The Apache host had **no detection pipeline at all**:
> no IDS, no log shipping, `auditd` not forwarding. The noisy scans above would have gone
> entirely unobserved. The countermeasures harden the *attack surface*, but a host with this
> exposure also needs the *monitoring* layer — a SIEM integration would turn every row in the
> table above into an alert, closing the loop from "exploitable" to "exploitable **and**
> detected."

---

## Evidence Chain

Every artefact is integrity-protected so a reviewer can prove nothing was altered between
acquisition and reporting — the same chain-of-custody discipline a court or a client audit
would require.

| Type | Detail |
|------|--------|
| Session logs | external_session.log (all external commands) + internal_session.log (concurrent enumeration) — timestamped, append-only during the engagement |
| Artefacts | apache_full.nmap, gobuster.txt, whatweb.txt, nikto.html, linpeas_out.txt, status.txt, listing_root.html |
| Integrity | All 24 files in apache_pentest.zip (4.1 MiB) SHA-256 hashed into a single reproducible manifest |
| Screenshots | status_403.png (F5 — 403 Forbidden), listing_root.png (F1 — directory listing confirmed) |

The manifest is itself the verification instrument — any reviewer can re-verify the whole
evidence set with one command, and a single changed byte in any artefact fails its line:

```bash
# At acquisition — one manifest over the whole evidence set
sha256sum external_session.log internal_session.log status.txt status_403.png \
          listing_root.html listing_root.png nmap/* gobuster.txt whatweb.txt \
          nikto.html linpeas_out.txt  > evidence.sha256

# At reporting / by any reviewer — must print "OK" for every line
sha256sum -c evidence.sha256

# Archive-level digest — verify the bundle as a unit before unpacking
sha256sum apache_pentest.zip > apache_pentest.zip.sha256
```

---

## Skills Demonstrated

| Skill | Evidence |
|-------|----------|
| Network Reconnaissance | Full-port SYN scan with nmap -sS -sV -O -p-. Service and OS fingerprinting. |
| Web Application Enumeration | Directory brute-force (Gobuster), HTTP fingerprinting (WhatWeb, Nikto v2.5.0). |
| Host Privilege Analysis | LinPEAS privilege escalation enumeration — sudo, SUID/SGID, cron, service audit. |
| Vulnerability Identification | CWE-548 directory listing; mod_status exposure; absent security headers; least-privilege violation. |
| Risk Quantification | OWASP qualitative likelihood × impact risk scoring across 7 findings. |
| Database Hardening | PostgreSQL 16 built to CIS Level 1 Benchmark v2.0.0; scram-sha-256 auth; UFW isolation. |
| Evidence Integrity | Reproducible SHA-256 manifest (`sha256sum -c`); dual session logs; structured evidence archive (24 files, 4.1 MiB). |
| Control Framework Mapping | Findings and countermeasures mapped to ISO/IEC 27002:2022 and CIS Apache 2.4 Benchmark v1.4.0. |
| Detection Engineering (Purple-Team) | Each offensive step mapped to its log source, ATT&CK technique, and a Wazuh detection rule — feeds the watchtower SIEM lab. |

---

## Repository

> **// GitHub** — Full methodology, findings, countermeasures, and research references:
> [github.com/rootdrifter/spectre](https://github.com/rootdrifter/spectre) — one repository in
> the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.
