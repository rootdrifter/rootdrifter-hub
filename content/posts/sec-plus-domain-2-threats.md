---
title: "Sec+ SY0-701: Domain 2 — Threats, Vulnerabilities and Mitigations"
slug: sec-plus-domain-2-threats
status: published
tags: [sec-plus, security-notes, teaser]
excerpt: "Study notes for Security+ Domain 2 (22% of the exam): threat actors, attack surfaces, vulnerability types, malicious activity, and mitigations."
published_at: 2026-06-11 01:34:00
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<blockquote>Study-note format. Condensed from my full SY0-701 notes (the complete five-domain set lives in the<br>portfolio's <code>sec-plus-notes</code> repo). Domain 2 is 22% of the exam and the most concept-dense.</blockquote><p>Domain 2 is where the exam tests whether you can reason about <em>who</em> attacks, <em>what</em> they target, <em>which</em><br>weaknesses they exploit, and <em>how</em> you reduce the exposure. It rewards being able to distinguish<br>near-synonyms under time pressure — the questions are frequently "which of these four very similar terms<br>is the precise one." These notes are organised around the official objectives.</p><h2 id="21-%E2%80%94-threat-actors-and-motivations">2.1 — Threat actors and motivations</h2><p>Know the actor types and the attributes that separate them. The exam loves to give you a scenario and<br>ask which actor it describes.</p>
<!--kg-card-begin: html-->
<table>
<thead>
<tr>
<th>Actor</th>
<th>Sophistication</th>
<th>Resources</th>
<th>Typical motivation</th>
</tr>
</thead>
<tbody>
<tr>
<td>Nation-state</td>
<td>High</td>
<td>High</td>
<td>Espionage, disruption, strategic advantage</td>
</tr>
<tr>
<td>Organised crime</td>
<td>High</td>
<td>High</td>
<td>Financial gain</td>
</tr>
<tr>
<td>Hacktivist</td>
<td>Variable</td>
<td>Low–medium</td>
<td>Ideological / political</td>
</tr>
<tr>
<td>Insider threat</td>
<td>Variable</td>
<td>Has legitimate access</td>
<td>Revenge, financial, accidental</td>
</tr>
<tr>
<td>Unskilled attacker ("script kiddie")</td>
<td>Low</td>
<td>Low</td>
<td>Notoriety, opportunism</td>
</tr>
<tr>
<td>Shadow IT</td>
<td>n/a (internal)</td>
<td>Internal</td>
<td>Convenience — unsanctioned tools/systems</td>
</tr>
</tbody>
</table>
<!--kg-card-end: html-->
<p><strong>Attributes to map to actors:</strong> internal vs external; resources/funding; level of sophistication;<br>intent/motivation. <strong>Motivations</strong> to know: data exfiltration, espionage, service disruption,<br>financial gain, blackmail, ideology, revenge, war, ethical (authorised testing).</p><h2 id="22-%E2%80%94-threat-vectors-and-attack-surfaces">2.2 — Threat vectors and attack surfaces</h2><p>The routes in. Message-based (email, SMS, IM); image-based and file-based payloads; voice call<br>(vishing); removable media (the dropped-USB classic); vulnerable software (client- vs agentless);<br>unsupported systems/apps; unsecure networks (wired, wireless, Bluetooth); open service ports; default<br>credentials; supply chain (MSPs, vendors, hardware). <strong>Human vectors / social engineering:</strong> phishing,<br>spear phishing, whaling, vishing, smishing, pretexting, BEC, watering-hole, piggybacking/tailgating,<br>impersonation, brand impersonation, typosquatting, and disinformation campaigns.</p><h2 id="23-%E2%80%94-vulnerability-types-high-density-objective">2.3 — Vulnerability types (high-density objective)</h2><p>This objective is a vocabulary test. Know each category and one concrete example.</p><ul><li><strong>Application:</strong> memory injection; <strong>buffer overflow</strong>; <strong>race conditions (TOC/TOU</strong> — time-of-check<br>to time-of-use); malicious update.</li><li><strong>Web-specific:</strong> <strong>SQL injection (SQLi)</strong>; <strong>cross-site scripting (XSS)</strong>.</li><li><strong>Operating system:</strong> unpatched OS-level flaws.</li><li><strong>Hardware:</strong> <strong>firmware</strong> vulnerabilities; <strong>end-of-life / legacy</strong> (no longer patched).</li><li><strong>Virtualisation:</strong> <strong>VM escape</strong>; resource reuse (data left in reallocated memory/storage).</li><li><strong>Cloud-specific:</strong> misconfiguration, insecure APIs, over-permissive IAM.</li><li><strong>Supply chain:</strong> compromised <strong>service provider</strong>, <strong>hardware provider</strong>, or <strong>software provider</strong><br>(the SolarWinds-shaped risk).</li><li><strong>Cryptographic:</strong> weak/deprecated ciphers, poor key management.</li><li><strong>Misconfiguration:</strong> the single most common real-world cause — default settings left in place.</li><li><strong>Mobile:</strong> <strong>sideloading</strong>, <strong>jailbreaking/rooting</strong>.</li><li><strong>Zero-day:</strong> exploited before a patch exists.</li></ul><h2 id="24-%E2%80%94-indicators-of-malicious-activity-know-the-malware-types-cold">2.4 — Indicators of malicious activity (know the malware types cold)</h2>
<!--kg-card-begin: html-->
<table>
<thead>
<tr>
<th>Malware</th>
<th>One-line tell</th>
</tr>
</thead>
<tbody>
<tr>
<td>Ransomware</td>
<td>Files encrypted; ransom note; extension changes</td>
</tr>
<tr>
<td>Trojan</td>
<td>Legitimate-looking program with a hidden payload</td>
</tr>
<tr>
<td>Worm</td>
<td>Self-propagates across the network with no user action</td>
</tr>
<tr>
<td>Rootkit</td>
<td>Hides at OS/kernel level; subverts detection</td>
</tr>
<tr>
<td>Spyware / Keylogger</td>
<td>Captures activity / keystrokes</td>
</tr>
<tr>
<td>Logic bomb</td>
<td>Triggers on a condition (date, event)</td>
</tr>
<tr>
<td>Virus</td>
<td>Attaches to a file; needs execution to spread</td>
</tr>
</tbody>
</table>
<!--kg-card-end: html-->
<p><strong>Attack indicators to recognise:</strong> account lockouts, concurrent session usage, impossible travel,<br>blocked content, resource consumption/inaccessibility, out-of-cycle logging, missing logs, published<br>data, and documented IoCs. <strong>Password attacks:</strong> brute force, password spraying, dictionary. <strong>Other<br>attacks to identify:</strong> DDoS (volumetric/amplified/reflected), DNS attacks, on-path (MITM), credential<br>replay, privilege escalation, forgery, directory traversal, and the injection family.</p><h2 id="25-%E2%80%94-mitigation-techniques">2.5 — Mitigation techniques</h2><p>The defensive toolkit the exam expects you to apply to a scenario:</p><ul><li><strong>Segmentation</strong> — limit lateral movement (relevant to the medium-box internal-service pivot writeup).</li><li><strong>Access control</strong> — ACLs and least-privilege permissions.</li><li><strong>Application allow list</strong> (vs deny/block list).</li><li><strong>Isolation / sandboxing</strong> — contain untrusted code.</li><li><strong>Patching</strong> and <strong>configuration enforcement</strong> (hardening to a benchmark, e.g. CIS).</li><li><strong>Decommissioning</strong> — remove EOL/legacy systems.</li><li><strong>Hardening:</strong> encryption, endpoint protection (EDR), host-based firewall, HIPS, disabling unused<br>ports/protocols, changing default passwords, removing unnecessary software.</li></ul><h2 id="scenario-drills">Scenario drills</h2><ol><li><em>A vendor's software update ships a backdoor that runs in every customer's environment.</em> → <strong>Supply<br>chain (software provider)</strong> vulnerability. Mitigation: vendor due diligence, code signing, staged<br>rollout, monitoring.</li><li><em>A web form lets an attacker read arbitrary database rows by altering a parameter.</em> → <strong>SQL<br>injection</strong>. Mitigation: parameterised queries, input validation, least-privilege DB account.</li><li><em>Login succeeds from London and Tokyo eight minutes apart.</em> → <strong>Impossible travel</strong> indicator.<br>Response: trigger step-up MFA / lock and investigate.</li><li><em>A finance employee wires funds after an email "from the CEO."</em> → <strong>Business Email Compromise</strong> via<br>social engineering. Mitigation: out-of-band verification, DMARC, awareness training.</li></ol><h2 id="cross-reference">Cross-reference</h2><p>This domain underpins the offensive work in the portfolio: the <a href="__GHOST_URL__/blog/">pentest methodology</a> writeups<br>exercise 2.4 (recognising the attacker's own indicators) and the SIEM-lab detection content exercises<br>2.5 from the defender's side. The full, deeper notes for all five domains are in the <code>sec-plus-notes</code><br>repo on the <a href="__GHOST_URL__/portfolio">portfolio</a>.</p>
