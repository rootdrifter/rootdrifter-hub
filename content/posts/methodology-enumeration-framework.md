---
title: "Building a Repeatable Enumeration Framework"
slug: methodology-enumeration-framework
status: draft
tags: [pentest-methodology, osint-recon]
excerpt: "Enumeration is where engagements are won or lost. The fix is not a better tool — it is a process you run identically every time."
---

> Methodology post. Entirely generalised — no operational specifics, no real hosts. Documentation
> ranges only (RFC 5737: 192.0.2.0/24, 198.51.100.0/24).

Most boxes — and most real assessments — are not lost at exploitation. They are lost at enumeration: a
service on a high port that never got scanned, a version string that was read but never mapped to a
known issue, a share that was listed but never browsed. The instinct when you stall is to reach for a
new tool. That is almost always the wrong instinct. The thing that closes the gap is not tooling; it is
a **framework you run the same way every time**, so the result depends on the method and not on whether
you happened to be sharp that day.

This is a description of that framework. It is deliberately tool-light. Tools change; the discipline
underneath does not.

## The governing principle: breadth before depth

The single most common enumeration failure is committing to a vector before the surface is fully
mapped. You find one interesting service, you tunnel into it, and ninety minutes later you discover the
real path was a service you never scanned. So the order is fixed and non-negotiable:

1. **Map the entire surface** — find everything that listens.
2. **Identify everything you found** — versions, not just ports.
3. **Then, and only then, go deep** — enumerate each service in turn.

Breadth is cheap and depth is expensive. Spend the cheap thing first.

## Stage one: the full sweep

The first scan exists to answer one question — *what listens?* — and it must answer it completely.

```
nmap -p- --min-rate=1000 -oN nmap/allports 192.0.2.10
```

`-p-` is the entire point. A default Nmap scan covers roughly the top 1,000 ports; services
deliberately placed on non-standard high ports are precisely where interesting things hide, and a
top-1,000 scan walks straight past them. `--min-rate` keeps the full sweep to a sensible duration.
`-oN` writes the result to disk, because every scan is evidence and evidence gets saved.

Only once you know which ports are open do you spend time on the expensive scan:

```
nmap -sC -sV -p22,80,443 -oN nmap/services 192.0.2.10
```

`-sV` reads service versions — the version string is the most valuable single artefact in
reconnaissance, because it is what maps to a known, documented issue. `-sC` runs the default NSE
scripts for cheap configuration and banner hints. Scoping this to the ports you already know are open
keeps it fast and keeps the output readable.

## Stage two: per-service discipline

With the surface mapped, enumerate each service in turn. The goal is not to "try things"; it is to ask
the same first questions of every service, every time, and write down the answers — including the ones
that are dead ends.

| Service | First moves |
|---------|-------------|
| HTTP/S  | `whatweb` for the stack; read source, JS, and HTML comments; directory and vhost discovery; check `robots.txt`, `sitemap.xml`, default credentials and backup/`.bak` files |
| SMB     | `enum4linux -a`; list shares; attempt a null session; enumerate users |
| FTP     | banner and version; attempt anonymous login; check the version against known issues |
| SSH     | version only — rarely the foothold; record it for credential reuse later |
| NFS     | `showmount -e`; mount any exported shares; hunt for keys and configs |
| DNS     | attempt a zone transfer; brute subdomains |
| SMTP    | `VRFY`/`EXPN` user enumeration; banner and version |

The table is small on purpose. The value is not in having a hundred commands memorised; it is in
asking the same handful of high-yield questions of every service without skipping any.

## Stage three: directory and content discovery

For any web surface, content discovery is where most footholds actually originate, and it rewards
patience over speed. Start with a reasonable wordlist and escalate only if the surface looks
promising:

```
feroxbuster -u http://192.0.2.10 -w /usr/share/seclists/Discovery/Web-Content/raft-medium-words.txt
```

What you are hunting for: directory listings left enabled, backup files (`config.php.bak`,
`.git/`, `index.html~`), administrative endpoints, and API paths. The recurring lesson across easy and
medium targets alike is that an exposed backup or a leftover `.git` directory hands you exactly the
credentials or source you need — and it costs nothing but the discipline to look before attacking the
obvious login form.

## The habit that matters most: map every version to a known issue *before* acting

This deserves its own section because it is the single highest-return habit in the whole framework.
When you read a version off a banner, do not immediately reach for an exploit. Look the version up
against public advisories first. On legacy targets, the chain *version → known issue → clean exploit*
is frequently the entire solve, and doing it in that order saves you from firing noisy, blind attempts
that get you nowhere and light up every defender's console.

## Credential hunting

Once you have any foothold, the highest-yield next move is almost never another exploit — it is reading
the filesystem for credentials people left lying around.

```
cat /var/www/[app]/config.*       # web apps store DB creds in config more than anywhere else
grep -riE 'password|secret|api[_-]?key' /etc /var/www /home 2>/dev/null
cat ~/.bash_history ~/.ssh/* 2>/dev/null
```

Credential reuse across services and accounts (web → database → local user → second user) is realistic
and constant. Every credential you find is a key worth trying against every lock you have seen.

## Note-taking is part of the method, not an afterthought

A framework that only records successes is unreproducible. The discipline that separates a writeup from
a tool dump is recording the **negative space** — what you ruled out. "FTP anonymous login = denied" is
not a failure to omit; it is evidence that narrows the path, and it is the difference between a process
a reviewer can trust and a lucky guess dressed up after the fact.

Keep notes structured the same way every engagement:

- **One file per target.** Top of file: scope, IPs, the goal.
- **A section per service**, with the commands run and their results pasted in full.
- **A running "ruled out" list** — the dead ends, dated, so you never re-walk them.
- **An evidence folder** — raw scan output, named screenshots, and any hashes, captured as you go and
  not reconstructed afterward.

## The blue-team mirror

Every step above is loud. Directory brute-forcing floods the web access log with 404s; SMB user
enumeration creates a burst of short-lived sessions; an online credential attempt leaves a
failed-then-successful pattern in the auth log. Knowing what your own reconnaissance looks like inside
a defender's SIEM is what turns offensive practice into detection capability — the same framework, read
from the other side. That mirror is the connective tissue between an enumeration habit and a SOC role,
and it is why this methodology is worth writing down rather than just running.

## The loop, in one block

```
scan all ports → service-scan what's open → enumerate each service (log the dead ends)
  → map versions to known issues → discover web content → pick a vector (record why)
  → foothold → stabilise → hunt credentials → escalate
  → capture evidence (raw output + named screenshots + hashes) → write up, including what failed
```

Run it identically every time. The point is not that this is the only correct order — it is that having
*a* fixed order, run consistently, is itself the capability. Consistency is the skill the framework
buys you.
