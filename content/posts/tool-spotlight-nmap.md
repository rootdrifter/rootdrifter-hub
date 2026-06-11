---
title: "nmap: Beyond the Basics"
slug: tool-spotlight-nmap
status: draft
tags: [pentest-methodology, tool-spotlight, network]
excerpt: "Everyone runs nmap. Fewer people read it properly. A practical tour of scan types, NSE, output, timing, and evasion."
---

> Tool spotlight. All examples use RFC 5737 documentation ranges (192.0.2.0/24, 198.51.100.0/24) — no
> live addresses. Only scan hosts you are authorised to scan.

`nmap` is the first tool almost everyone runs and the one most people use at maybe a third of its
capability. This is a practical tour of the parts that change outcomes: the scan types worth knowing,
the NSE scripts that earn their runtime, the output formats that make you faster, the timing controls,
and the evasion flags — with an honest note on when each actually helps.

## Scan types — and when each is the right call

```
nmap -sS 192.0.2.10        # SYN ("half-open") scan — the default with root; fast, relatively quiet
nmap -sT 192.0.2.10        # TCP connect scan — full handshake; use without root, or through proxychains
nmap -sU 192.0.2.10        # UDP scan — slow but finds DNS, SNMP, TFTP, IKE that TCP scans miss
nmap -sn 192.0.2.0/24      # host discovery only ("ping sweep") — no port scan, just who's alive
nmap -Pn 192.0.2.10        # skip host discovery — treat the host as up (needed when ICMP is filtered)
```

The two that change results most often are `-sU` and `-Pn`. Skipping UDP entirely is the classic miss —
SNMP with a default community string is a frequent, high-value find that lives only on UDP. And `-Pn`
matters because a host that drops ICMP will read as "down" to a default scan, and you will walk away
from a live target. When a box "looks dead" but is in scope, `-Pn` is the first thing to try.

## Service and version detection

```
nmap -sV 192.0.2.10                 # probe open ports for service/version
nmap -sV --version-intensity 9 192.0.2.10   # try harder (more probes) when a banner is stubborn
nmap -O 192.0.2.10                  # OS fingerprinting (needs root; best-effort)
nmap -A 192.0.2.10                  # aggressive: -sV + -O + default scripts + traceroute
```

`-sV` is the most valuable flag in the tool, because the version string is what maps to a known issue.
`-A` is convenient for a first look but it is loud and slow — fine for a lab, worth breaking into
component flags on anything you care about being quiet on.

## NSE — the scripting engine

NSE is where nmap stops being a port scanner and becomes a reconnaissance platform. The default set
(`-sC`) is cheap and worth running every time; the targeted scripts are where the depth is.

```
nmap -sC 192.0.2.10                                 # default scripts — safe, fast, high-yield
nmap --script=vuln 192.0.2.10                       # known-vulnerability checks (noisier)
nmap --script=http-enum -p80,443 192.0.2.10         # web content/app enumeration
nmap --script=smb-enum-shares,smb-os-discovery -p445 192.0.2.10   # SMB shares + OS
nmap --script=dns-zone-transfer --script-args dns-zone-transfer.domain=example.com -p53 192.0.2.10
```

Script categories worth knowing: `default`, `safe`, `discovery`, `auth`, `vuln`, `brute`. Read what a
script does before running it on anything you do not own — `vuln` and `brute` scripts are intrusive and
should be a deliberate choice, never a reflex.

## Output formats — the speed multiplier

```
nmap -sCV -p- -oA scans/target 192.0.2.10   # write all three formats at once
#   -oN  normal (human-readable)
#   -oG  greppable (one host per line — pipe into awk/grep)
#   -oX  XML (feed other tools, or convert to HTML)
```

`-oA` is the habit to build: it writes normal, greppable, and XML in one go. The greppable output is
the quiet hero — extracting "every host with port 445 open" from a `/16` sweep is one `grep`, not a
manual read. Saving output is also simply good engagement hygiene: every scan is evidence.

## Timing templates

```
nmap -T4 192.0.2.10        # faster; fine for most labs and resilient networks
nmap -T2 192.0.2.10        # "polite" — slower, lighter footprint
nmap -T1 192.0.2.10        # "sneaky" — much slower, for IDS-sensitive environments
nmap --min-rate=1000 192.0.2.10   # fine-grained: floor on packets/sec (more predictable than -T)
```

`-T4` is the sensible default in a lab. On a real engagement where pacing matters, `--min-rate` and
`--max-rate` give you direct, predictable control that the `-T` templates only approximate.

## Firewall and IDS evasion — with the honest caveat

These flags exist and are worth understanding, but on a modern, monitored network most are more useful
as *learning* than as a reliable bypass. Use them only where you are authorised, and do not expect
magic.

```
nmap -f 192.0.2.10                     # fragment packets (split headers across fragments)
nmap --mtu 16 192.0.2.10               # custom fragment size
nmap -D 198.51.100.5,198.51.100.6,ME 192.0.2.10   # decoy source addresses
nmap --source-port 53 192.0.2.10       # spoof a trusted source port (e.g. DNS)
nmap --scan-delay 1s 192.0.2.10        # slow down to slip under rate-based detection
```

The honest framing: fragmentation and decoys were more effective against older, simpler inspection than
against today's stateful firewalls and modern IDS. The genuinely useful evasion lever in practice is
*timing* — `--scan-delay` and a low `--min-rate` to stay under rate-based alerting. Treat the rest as
worth knowing for an exam and for understanding how detection works, not as a dependable real-world
bypass.

## A sensible default workflow

```
# 1. Full TCP sweep — find everything that listens
nmap -p- --min-rate=1000 -oN scans/allports 192.0.2.10

# 2. Deep scan only the open ports
nmap -sCV -p<open,ports> -oA scans/services 192.0.2.10

# 3. Don't forget UDP
nmap -sU --top-ports 100 -oN scans/udp 192.0.2.10
```

Three commands, run the same way every time. nmap rewards being read carefully far more than it rewards
being run with more flags — the version strings and script output are the product, and the discipline
of reading them is the skill.
