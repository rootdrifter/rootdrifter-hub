# Enumeration Methodology: Building a Repeatable Recon Framework

> Sample post — demonstrates the methodology content pillar. Entirely generalised; no operational
> specifics, no real hosts. Documentation IPs only (RFC 5737: 192.0.2.x).
> Tags: methodology, pentesting

Enumeration is where engagements are won or lost. A missed service, an unread banner, or a skipped
share is the single most common reason a box — or a real assessment — stalls. The fix is not a better
tool; it is a **repeatable framework** you run the same way every time, so the result depends on the
method and not on the day.

## Principle: breadth first, then depth

Map the entire surface before committing to any one vector. The order is always the same:

1. **Full port sweep** — find *everything* that listens, including the non-standard high ports.
2. **Service/version scan** — only on what is open; the version string is what maps to a known issue.
3. **Per-service depth** — enumerate each service in turn, recording what you rule out.

```
nmap -p- --min-rate=1000 -oN nmap/allports 192.0.2.10
nmap -sC -sV -p<open,ports> -oN nmap/services 192.0.2.10
```

Documentation ranges (192.0.2.0/24, 198.51.100.0/24) stand in for real targets throughout — never
publish a live address.

## Per-service first moves

| Service | First moves |
|---------|-------------|
| HTTP/S  | `whatweb`; view source/JS/comments; directory and vhost discovery; `robots.txt`, default creds |
| SMB     | `enum4linux -a`; share listing; null-session; user enumeration |
| FTP     | banner/version; anonymous login; version-specific issues |
| SSH     | version only — rarely the foothold; note for credential reuse later |
| NFS     | `showmount -e`; mountable exports; look for keys/configs |
| DNS     | zone-transfer attempt; subdomain discovery |

## Document the negative space

The discipline that separates a writeup from a tool dump is recording what *failed*. "FTP anonymous =
denied" is evidence: it narrows the path. A framework that only logs successes is unreproducible and
hides the reasoning a reviewer is actually buying.

## Map every version to a known issue *before* acting

Read the version, then check it against public advisories before running anything noisy. On legacy
targets this single habit — version → known issue — is frequently the whole solve.

## The blue-team mirror

Every enumeration step is loud. Directory brute-forcing floods web logs with 404s; SMB user
enumeration creates a burst of short-lived sessions; an online credential attempt leaves a
failed-then-success pattern in the auth log. Knowing *what your own recon looks like in a defender's
SIEM* is what turns offensive practice into detection capability — the same framework, read from the
other side. (This is the connective tissue between a pentest and a SOC role.)

## The repeatable loop

```
scan all ports → service-scan what's open → enumerate each service (log the dead ends)
  → map versions to known issues → pick a vector (record why) → foothold → stabilise → escalate
  → capture evidence (logs + named screenshots + hashes) → write up, including what failed
```

Run it the same way every time. Consistency is the capability.
