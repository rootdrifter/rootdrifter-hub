---
title: "Building a Repeatable Enumeration Framework"
slug: methodology-enumeration-framework
status: published
tags: [pentest-methodology, osint-recon, teaser]
excerpt: "Enumeration is where engagements are won or lost. The fix is not a better tool — it is a process you run identically every time."
published_at: 2026-06-11 01:34:00
format: html  # body is Ghost-ready HTML; restore via Admin API posts?source=html
---

<blockquote>Methodology post. Entirely generalised — no operational specifics, no real hosts. Documentation<br>ranges only (RFC 5737: 192.0.2.0/24, 198.51.100.0/24).</blockquote><p>Most boxes — and most real assessments — are not lost at exploitation. They are lost at enumeration: a<br>service on a high port that never got scanned, a version string that was read but never mapped to a<br>known issue, a share that was listed but never browsed. The instinct when you stall is to reach for a<br>new tool. That is almost always the wrong instinct. The thing that closes the gap is not tooling; it is<br>a <strong>framework you run the same way every time</strong>, so the result depends on the method and not on whether<br>you happened to be sharp that day.</p><p>This is a description of that framework. It is deliberately tool-light. Tools change; the discipline<br>underneath does not.</p><h2 id="the-governing-principle-breadth-before-depth">The governing principle: breadth before depth</h2><p>The single most common enumeration failure is committing to a vector before the surface is fully<br>mapped. You find one interesting service, you tunnel into it, and ninety minutes later you discover the<br>real path was a service you never scanned. So the order is fixed and non-negotiable:</p><ol><li><strong>Map the entire surface</strong> — find everything that listens.</li><li><strong>Identify everything you found</strong> — versions, not just ports.</li><li><strong>Then, and only then, go deep</strong> — enumerate each service in turn.</li></ol><p>Breadth is cheap and depth is expensive. Spend the cheap thing first.</p><h2 id="stage-one-the-full-sweep">Stage one: the full sweep</h2><p>The first scan exists to answer one question — <em>what listens?</em> — and it must answer it completely.</p><pre><code>nmap -p- --min-rate=1000 -oN nmap/allports 192.0.2.10
</code></pre><p><code>-p-</code> is the entire point. A default Nmap scan covers roughly the top 1,000 ports; services<br>deliberately placed on non-standard high ports are precisely where interesting things hide, and a<br>top-1,000 scan walks straight past them. <code>--min-rate</code> keeps the full sweep to a sensible duration.<br><code>-oN</code> writes the result to disk, because every scan is evidence and evidence gets saved.</p><p>Only once you know which ports are open do you spend time on the expensive scan:</p><pre><code>nmap -sC -sV -p22,80,443 -oN nmap/services 192.0.2.10
</code></pre><p><code>-sV</code> reads service versions — the version string is the most valuable single artefact in<br>reconnaissance, because it is what maps to a known, documented issue. <code>-sC</code> runs the default NSE<br>scripts for cheap configuration and banner hints. Scoping this to the ports you already know are open<br>keeps it fast and keeps the output readable.</p><h2 id="stage-two-per-service-discipline">Stage two: per-service discipline</h2><p>With the surface mapped, enumerate each service in turn. The goal is not to "try things"; it is to ask<br>the same first questions of every service, every time, and write down the answers — including the ones<br>that are dead ends.</p>
<!--kg-card-begin: html-->
<table>
<thead>
<tr>
<th>Service</th>
<th>First moves</th>
</tr>
</thead>
<tbody>
<tr>
<td>HTTP/S</td>
<td><code>whatweb</code> for the stack; read source, JS, and HTML comments; directory and vhost discovery; check <code>robots.txt</code>, <code>sitemap.xml</code>, default credentials and backup/<code>.bak</code> files</td>
</tr>
<tr>
<td>SMB</td>
<td><code>enum4linux -a</code>; list shares; attempt a null session; enumerate users</td>
</tr>
<tr>
<td>FTP</td>
<td>banner and version; attempt anonymous login; check the version against known issues</td>
</tr>
<tr>
<td>SSH</td>
<td>version only — rarely the foothold; record it for credential reuse later</td>
</tr>
<tr>
<td>NFS</td>
<td><code>showmount -e</code>; mount any exported shares; hunt for keys and configs</td>
</tr>
<tr>
<td>DNS</td>
<td>attempt a zone transfer; brute subdomains</td>
</tr>
<tr>
<td>SMTP</td>
<td><code>VRFY</code>/<code>EXPN</code> user enumeration; banner and version</td>
</tr>
</tbody>
</table>
<!--kg-card-end: html-->
<p>The table is small on purpose. The value is not in having a hundred commands memorised; it is in<br>asking the same handful of high-yield questions of every service without skipping any.</p><h2 id="stage-three-directory-and-content-discovery">Stage three: directory and content discovery</h2><p>For any web surface, content discovery is where most footholds actually originate, and it rewards<br>patience over speed. Start with a reasonable wordlist and escalate only if the surface looks<br>promising:</p><pre><code>feroxbuster -u http://192.0.2.10 -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt
</code></pre><p>What you are hunting for: directory listings left enabled, backup files (<code>config.php.bak</code>,<br><code>.git/</code>, <code>index.html~</code>), administrative endpoints, and API paths. The recurring lesson across easy and<br>medium targets alike is that an exposed backup or a leftover <code>.git</code> directory hands you exactly the<br>credentials or source you need — and it costs nothing but the discipline to look before attacking the<br>obvious login form.</p><h2 id="the-habit-that-matters-most-map-every-version-to-a-known-issue-before-acting">The habit that matters most: map every version to a known issue <em>before</em> acting</h2><p>This deserves its own section because it is the single highest-return habit in the whole framework.<br>When you read a version off a banner, do not immediately reach for an exploit. Look the version up<br>against public advisories first. On legacy targets, the chain <em>version → known issue → clean exploit</em><br>is frequently the entire solve, and doing it in that order saves you from firing noisy, blind attempts<br>that get you nowhere and light up every defender's console.</p><h2 id="credential-hunting">Credential hunting</h2><p>Once you have any foothold, the highest-yield next move is almost never another exploit — it is reading<br>the filesystem for credentials people left lying around.</p><pre><code>cat /var/www/[app]/config.*       # web apps store DB creds in config more than anywhere else
grep -riE 'password|secret|api[_-]?key' /etc /var/www /home 2&gt;/dev/null
cat ~/.bash_history ~/.ssh/* 2&gt;/dev/null
</code></pre><p>Credential reuse across services and accounts (web → database → local user → second user) is realistic<br>and constant. Every credential you find is a key worth trying against every lock you have seen.</p><h2 id="note-taking-is-part-of-the-method-not-an-afterthought">Note-taking is part of the method, not an afterthought</h2><p>A framework that only records successes is unreproducible. The discipline that separates a writeup from<br>a tool dump is recording the <strong>negative space</strong> — what you ruled out. "FTP anonymous login = denied" is<br>not a failure to omit; it is evidence that narrows the path, and it is the difference between a process<br>a reviewer can trust and a lucky guess dressed up after the fact.</p><p>Keep notes structured the same way every engagement:</p><ul><li><strong>One file per target.</strong> Top of file: scope, IPs, the goal.</li><li><strong>A section per service</strong>, with the commands run and their results pasted in full.</li><li><strong>A running "ruled out" list</strong> — the dead ends, dated, so you never re-walk them.</li><li><strong>An evidence folder</strong> — raw scan output, named screenshots, and any hashes, captured as you go and<br>not reconstructed afterward.</li></ul><h2 id="the-blue-team-mirror">The blue-team mirror</h2><p>Every step above is loud. Directory brute-forcing floods the web access log with 404s; SMB user<br>enumeration creates a burst of short-lived sessions; an online credential attempt leaves a<br>failed-then-successful pattern in the auth log. Knowing what your own reconnaissance looks like inside<br>a defender's SIEM is what turns offensive practice into detection capability — the same framework, read<br>from the other side. That mirror is the connective tissue between an enumeration habit and a SOC role,<br>and it is why this methodology is worth writing down rather than just running.</p><h2 id="the-loop-in-one-block">The loop, in one block</h2><pre><code>scan all ports → service-scan what's open → enumerate each service (log the dead ends)
  → map versions to known issues → discover web content → pick a vector (record why)
  → foothold → stabilise → hunt credentials → escalate
  → capture evidence (raw output + named screenshots + hashes) → write up, including what failed
</code></pre><p>Run it identically every time. The point is not that this is the only correct order — it is that having<br><em>a</em> fixed order, run consistently, is itself the capability. Consistency is the skill the framework<br>buys you.</p>
