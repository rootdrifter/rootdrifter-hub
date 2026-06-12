<!-- ghost-page
slug: portfolio-gauntlet
title: GAUNTLET — CTF Writeups
excerpt: METHODOLOGY-FIRST · RECONNAISSANCE TO ROOT · ONGOING — UPDATED AS CHALLENGES ARE COMPLETED
-->

> **// ● ACTIVE · rev 2026-06-12** — 11 methodology stubs · TryHackMe + HackTheBox · live / growing

> **// Methodology First — What This Repository Is** — The deliverable here is **method, not
> flags**. Each entry documents how a target is approached — what was observed, what was
> inferred, what was tried, what failed, and what worked — because the reasoning is the part
> that transfers to a real engagement. The current eleven entries are **preparation stubs**:
> structured from publicly documented information about well-known retired rooms, they capture
> the attack path and methodology without reproducing live flag values or claiming an original
> solve. They are study scaffolds that become full writeups as each room is worked under
> account. Failure paths are documented deliberately — understanding why a technique did not
> apply matters as much as knowing when it does.

---

## Platforms

**TryHackMe** — Structured learning paths and guided rooms. Used for building systematic
knowledge of specific techniques — privilege escalation, web exploitation, SMB, Active
Directory. Immediate feedback loop.

**HackTheBox** — Competitive CTF environment with harder, less guided machines. Closer to
realistic engagements — the attack surface is defined, but the path from recon to root is not
signposted. Builds independent methodology.

---

## Writeup Index

| Machine | Platform | Difficulty | Status | Attack path | Tools |
|---------|----------|------------|--------|-------------|-------|
| Blue | THM | Easy | Stub | EternalBlue (MS17-010) → SMBv1 → SYSTEM shell → Hashdump | nmap, metasploit, hashdump |
| Kenobi | THM | Easy | Stub | SMB + NFS enumeration → ProFTPD path traversal → SUID privilege escalation | nmap, enum4linux, smbclient, netcat |
| Steel Mountain | THM | Easy | Stub | HFS 2.3 RCE → CVE-2014-6287 → msfvenom shell → PowerUp unquoted service path PE | nmap, metasploit, msfvenom, PowerUp.ps1 |
| Alfred | THM | Easy | Stub | Jenkins default credentials → Groovy script console RCE → token impersonation | nmap, jenkins, nishang, metasploit |
| Basic Pentesting | THM | Easy | Stub | SMB enumeration → Samba username disclosure → SSH brute-force → SUID + sudo PE | nmap, enum4linux, hydra, linpeas |
| Relevant | THM | Medium | Stub | Anonymous SMB share → base64 creds in `passwords.txt` → writable share served by IIS → `.aspx` web shell uploaded over SMB / executed over HTTP → SeImpersonatePrivilege → SYSTEM | nmap, smbclient, PrintSpoofer/RoguePotato |
| Skynet | THM | Easy | Stub | Anonymous SMB password list → SquirrelMail login → Samba password in inbox → hidden Cuppa CMS → RFI → www-data → tar wildcard checkpoint injection in a root cron → root | nmap, enum4linux, smbclient, cuppa RFI |
| Lame | HTB | Easy | Stub | Samba 3.0.20 username-map command injection (CVE-2007-2447) → direct root; vsftpd banner ruled out as a rabbit hole | nmap, enum4linux, smbclient, metasploit |
| Jerry | HTB | Easy | Stub | Tomcat Manager default credentials → malicious WAR deploy → JSP shell as NT AUTHORITY\SYSTEM | nmap, whatweb, msfvenom, curl |
| Bashed | HTB | Easy | Stub | phpbash web shell left reachable under `/dev/` → www-data (no exploit) → `sudo -l` to scriptmanager → writable script run by a root cron → root | nmap, gobuster, phpbash, linpeas |
| Beep | HTB | Easy | Stub | Elastix vtigerCRM `graph.php` LFI → `/etc/amportal.conf` discloses admin password → password reused on root SSH → root (canonical LFI → cred disclosure → reuse chain) | nmap, curl, LFI, ssh |

> **// Active — More Writeups Loading** — This index grows as challenges are completed. Eleven
> structured stubs are in place (seven TryHackMe, four HackTheBox); pending additions include
> further TryHackMe rooms (RootMe, Ice, Lian Yu) and HackTheBox machines (Legacy, Devel). Each
> writeup follows the methodology template in README — from initial recon to root, with failure
> paths documented alongside successes, plus a box-specific Wazuh detection rule bridging each
> machine to the watchtower SIEM lab.

---

## Coverage Radar — Honest Self-Assessment

<div id="gauntlet-component" aria-label="Radar chart of CTF category coverage"></div>

| Category | Score (/5) | What the eleven stubs actually cover |
|----------|------------|-------------------------------------|
| NETWORK | 4 | SMB/NFS enumeration and exploitation across six machines (Blue, Kenobi, Basic Pentesting, Lame, Skynet, Relevant). |
| PRIVESC | 3.5 | SUID, sudo abuse, unquoted service paths, token impersonation (SeImpersonate), and writable-cron escalation (Bashed, Skynet). |
| WEB | 3.5 | Jenkins console RCE, HFS CVE-2014-6287, Tomcat WAR deploy, RFI (Skynet/Cuppa), LFI → credential disclosure (Beep), and an `.aspx` upload-to-execute chain (Relevant). |
| CRYPTO | 1 | Hash dumping and cracking only (hashdump → john/hashcat). |
| FORENSICS | 0.5 | Evidence-logging discipline, no dedicated forensics challenges yet. |
| PWN | 0.5 | Tooling familiarity (gdb, ghidra); no completed binary-exploitation writeups yet. |

Scores reflect the current stub set, not aspiration — the low axes are the practice roadmap,
and the chart gets redrawn as entries land.

---

## Methodology Notes

**Enumeration Order** — Full-port SYN scan → service + version fingerprinting → OS detection →
per-service deep enumeration. Web gets Gobuster/ffuf + Nikto. SMB gets enum4linux. Never skip
UDP where a UDP service is suspected.

**Privilege Escalation** — LinPEAS first pass → review SUID/SGID, sudo -l, cron jobs, writable
paths, kernel version, service permissions. GTFOBins for SUID/sudo vectors. Always check
service account permissions and unquoted service paths (Windows).

**Shell Stabilisation** — Python pty spawn → export TERM=xterm → stty raw -echo. Tab completion
and job control restored. Prevents accidental ctrl-C kills in reverse shells.

**Documentation Standard** — All commands logged with rationale. Failed attempts documented
with the reason they failed. Evidence screenshots where appropriate. Tools listed with purpose,
not just name.

---

## What CTF Practice Maps To

CTF categories are not abstract puzzles — each one rehearses a capability that a security role
uses in the field. This is how consistent practice translates into job-relevant skill.

| CTF capability | Real-world equivalent | Role |
|----------------|----------------------|------|
| Service enumeration & version triage | External attack-surface assessment; vulnerability validation | Pentester · SOC L2 |
| Web exploitation (SQLi, LFI, SSTI) | Application security testing; OWASP-aligned review | AppSec · Pentester |
| Privilege escalation (SUID / sudo / cron / token) | Post-compromise impact assessment; hardening review | Pentester · Red Team |
| SMB / Active Directory enumeration | Internal network assessment; lateral-movement analysis | Red Team · IR |
| Reading exploit code & mapping CVEs | Threat intelligence; exploit triage; patch prioritisation | Threat Intel · SOC |
| Evidence logging & SHA-256 integrity | Chain-of-custody discipline; defensible reporting | DFIR · Consultant |
| Documenting failed paths | Reproducible methodology; report writing | Every security role |

---

## Tool Stack

| Category | Tools |
|----------|-------|
| Recon / enumeration | nmap, gobuster, ffuf, whatweb, nikto, enum4linux, dig |
| Web exploitation | Burp Suite, sqlmap, manual injection, curl |
| Credentials | hashcat, john, hydra, credential wordlists (rockyou) |
| Privilege escalation | linpeas, winpeas, pspy, GTFOBins, PowerUp.ps1 |
| Post-exploitation | Metasploit (where appropriate), manual shell stabilisation |
| Binary / reversing | gdb, pwndbg, ghidra, objdump, strings |

---

## Repository

> **// GitHub** — Full writeups, methodology notes, and templates:
> [github.com/rootdrifter/gauntlet](https://github.com/rootdrifter/gauntlet) — one repository
> in the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.
