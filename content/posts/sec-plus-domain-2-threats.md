---
title: "Sec+ SY0-701: Domain 2 — Threats, Vulnerabilities and Mitigations"
slug: sec-plus-domain-2-threats
status: draft
tags: [sec-plus, security-notes]
excerpt: "Study notes for Security+ Domain 2 (22% of the exam): threat actors, attack surfaces, vulnerability types, malicious activity, and mitigations."
---

> Study-note format. Condensed from my full SY0-701 notes (the complete five-domain set lives in the
> portfolio's `sec-plus-notes` repo). Domain 2 is 22% of the exam and the most concept-dense.

Domain 2 is where the exam tests whether you can reason about *who* attacks, *what* they target, *which*
weaknesses they exploit, and *how* you reduce the exposure. It rewards being able to distinguish
near-synonyms under time pressure — the questions are frequently "which of these four very similar terms
is the precise one." These notes are organised around the official objectives.

## 2.1 — Threat actors and motivations

Know the actor types and the attributes that separate them. The exam loves to give you a scenario and
ask which actor it describes.

| Actor | Sophistication | Resources | Typical motivation |
|-------|----------------|-----------|--------------------|
| Nation-state | High | High | Espionage, disruption, strategic advantage |
| Organised crime | High | High | Financial gain |
| Hacktivist | Variable | Low–medium | Ideological / political |
| Insider threat | Variable | Has legitimate access | Revenge, financial, accidental |
| Unskilled attacker ("script kiddie") | Low | Low | Notoriety, opportunism |
| Shadow IT | n/a (internal) | Internal | Convenience — unsanctioned tools/systems |

**Attributes to map to actors:** internal vs external; resources/funding; level of sophistication;
intent/motivation. **Motivations** to know: data exfiltration, espionage, service disruption,
financial gain, blackmail, ideology, revenge, war, ethical (authorised testing).

## 2.2 — Threat vectors and attack surfaces

The routes in. Message-based (email, SMS, IM); image-based and file-based payloads; voice call
(vishing); removable media (the dropped-USB classic); vulnerable software (client- vs agentless);
unsupported systems/apps; unsecure networks (wired, wireless, Bluetooth); open service ports; default
credentials; supply chain (MSPs, vendors, hardware). **Human vectors / social engineering:** phishing,
spear phishing, whaling, vishing, smishing, pretexting, BEC, watering-hole, piggybacking/tailgating,
impersonation, brand impersonation, typosquatting, and disinformation campaigns.

## 2.3 — Vulnerability types (high-density objective)

This objective is a vocabulary test. Know each category and one concrete example.

- **Application:** memory injection; **buffer overflow**; **race conditions (TOC/TOU** — time-of-check
  to time-of-use); malicious update.
- **Web-specific:** **SQL injection (SQLi)**; **cross-site scripting (XSS)**.
- **Operating system:** unpatched OS-level flaws.
- **Hardware:** **firmware** vulnerabilities; **end-of-life / legacy** (no longer patched).
- **Virtualisation:** **VM escape**; resource reuse (data left in reallocated memory/storage).
- **Cloud-specific:** misconfiguration, insecure APIs, over-permissive IAM.
- **Supply chain:** compromised **service provider**, **hardware provider**, or **software provider**
  (the SolarWinds-shaped risk).
- **Cryptographic:** weak/deprecated ciphers, poor key management.
- **Misconfiguration:** the single most common real-world cause — default settings left in place.
- **Mobile:** **sideloading**, **jailbreaking/rooting**.
- **Zero-day:** exploited before a patch exists.

## 2.4 — Indicators of malicious activity (know the malware types cold)

| Malware | One-line tell |
|---------|---------------|
| Ransomware | Files encrypted; ransom note; extension changes |
| Trojan | Legitimate-looking program with a hidden payload |
| Worm | Self-propagates across the network with no user action |
| Rootkit | Hides at OS/kernel level; subverts detection |
| Spyware / Keylogger | Captures activity / keystrokes |
| Logic bomb | Triggers on a condition (date, event) |
| Virus | Attaches to a file; needs execution to spread |

**Attack indicators to recognise:** account lockouts, concurrent session usage, impossible travel,
blocked content, resource consumption/inaccessibility, out-of-cycle logging, missing logs, published
data, and documented IoCs. **Password attacks:** brute force, password spraying, dictionary. **Other
attacks to identify:** DDoS (volumetric/amplified/reflected), DNS attacks, on-path (MITM), credential
replay, privilege escalation, forgery, directory traversal, and the injection family.

## 2.5 — Mitigation techniques

The defensive toolkit the exam expects you to apply to a scenario:

- **Segmentation** — limit lateral movement (relevant to the medium-box internal-service pivot writeup).
- **Access control** — ACLs and least-privilege permissions.
- **Application allow list** (vs deny/block list).
- **Isolation / sandboxing** — contain untrusted code.
- **Patching** and **configuration enforcement** (hardening to a benchmark, e.g. CIS).
- **Decommissioning** — remove EOL/legacy systems.
- **Hardening:** encryption, endpoint protection (EDR), host-based firewall, HIPS, disabling unused
  ports/protocols, changing default passwords, removing unnecessary software.

## Scenario drills

1. *A vendor's software update ships a backdoor that runs in every customer's environment.* → **Supply
   chain (software provider)** vulnerability. Mitigation: vendor due diligence, code signing, staged
   rollout, monitoring.
2. *A web form lets an attacker read arbitrary database rows by altering a parameter.* → **SQL
   injection**. Mitigation: parameterised queries, input validation, least-privilege DB account.
3. *Login succeeds from London and Tokyo eight minutes apart.* → **Impossible travel** indicator.
   Response: trigger step-up MFA / lock and investigate.
4. *A finance employee wires funds after an email "from the CEO."* → **Business Email Compromise** via
   social engineering. Mitigation: out-of-band verification, DMARC, awareness training.

## Cross-reference

This domain underpins the offensive work in the portfolio: the [pentest methodology](/blog/) writeups
exercise 2.4 (recognising the attacker's own indicators) and the SIEM-lab detection content exercises
2.5 from the defender's side. The full, deeper notes for all five domains are in the `sec-plus-notes`
repo on the [portfolio](https://rootdrifter.io/portfolio/).
