# WHITELIST.pub — the `src.pub` synthetic-value pool (fail-closed)
Authored by CORTEX-D2 into `candidate:src.pub`. Governed by `CORTEX_SCHEMA.md §2` (tree law).
PUBLIC-SAFE tier. This file enumerates **the only synthetic values permitted to appear in a document
that reads `src` and could reach a public surface.** It is the positive half of the whitelist inversion
that closes SH-5: a value is emittable **only** if it is on this list (or is itself a checkable public
figure in `INVARIANTS.pub`). Everything else is *suspect → quarantine*.

> **Why a whitelist, not a denylist (SH-5).** A real WireGuard endpoint IP once carried no denylist
> *token* and published clean past a wordlist scrub. A denylist can only block what it already names; a
> whitelist blocks everything it does **not** name. Fail-closed by construction.

---

## 1. The pool — permitted synthetic values

### 1.1 IPv4 — RFC 5737 (documentation ranges, never routed)
- `192.0.2.0/24`   (TEST-NET-1)
- `198.51.100.0/24` (TEST-NET-2)
- `203.0.113.0/24`  (TEST-NET-3)

### 1.2 Hostnames / domains — RFC 2606 + RFC 6761 reserved
- `example`, `example.com`, `example.net`, `example.org`
- `*.example`, `example.test`, `*.test`, `*.invalid`, `*.localhost`

### 1.3 MAC addresses — locally-administered fake pool
- `02:00:00:xx:xx:xx` (the `x2` locally-administered bit set; the `00:00:00` OUI is **not** a real vendor).
- **Never** a real vendor OUI. Never a MAC observed on a real interface.

### 1.4 Overlay / Tailscale — synthetic documentation block
- `100.64.255.0/24` — the documentation-overlay block used in examples that need a Tailscale-shaped address.
- **CAVEAT (record and respect):** this is a **local convention, not a standard.** There is **no
  RFC-5737 equivalent inside the CGNAT shared range `100.64.0.0/10`** (RFC 6598), and `100.64.255.0/24`
  sits **inside Tailscale's real address space** — a real node *could* theoretically be assigned here and
  collide. Therefore: **documentation-only.** Never assign a real node into `100.64.255.0/24`; never treat
  a real overlay IP as whitelisted because it "looks like" this block. A real overlay IP is `src`-only,
  used-not-listed, and is **not** on this whitelist.

### 1.5 UUIDs — clearly-fake only
- `00000000-0000-0000-0000-000000000000` (all-zero)
- `deadbeef-dead-beef-dead-beefdeadbeef` and other obviously-synthetic `deadbeef-…` forms.
- **Never** a real disk / LUKS / keyslot / partition UUID (e.g. a `luksDump`/`blkid` value).

### 1.6 Placeholders — identity redaction tokens
- `[YOUR NAME]`  — never a real name.
- `[UNIVERSITY]` — never the real institution.
- `[OPERATOR: …]` — an operator-supplied value the agent must not invent.
- `MANUAL INPUT REQUIRED` — the non-fabrication marker (schema §1b) when the real value is unknown.

---

## 2. What is NOT on this list (suspect → quarantine)

Anything not in §1 and not a checkable public figure in `INVARIANTS.pub` is non-whitelisted. In
particular the following are **`src`-only, used-not-listed**, and must never be treated as whitelisted:

- Any real public-routable IPv4/IPv6, any origin-server IP, any real overlay/Tailscale IP.
- Any real hostname, real domain, real DNS-upstream endpoint or resolver URL.
- Any real MAC / IMEI (IMEI is never recorded at all).
- Any real disk/LUKS/keyslot UUID; any verified-boot key hash; any key/secret/credential/token.
- Any real WireGuard interface name or endpoint; any per-profile app list.
- The PRIVATE register / linkage phrases (held `src`-only; see the used-not-listed doctrine —
  `DISPATCH_DOCTRINE §3` / `CLASSIFICATION.md`, referenced, not re-enumerated here).

*This file names the synthetic-safe pool only. It does **not** re-enumerate the private register — that
enumeration is exactly the artefact the whitelist inversion removes the need for (see `LEDGER.md` §D2).*

---

## 3. How the gates use this pool

Every playbook emission gate reads *"0 non-whitelisted values"* — pass iff every value in the raw output
is either (a) a synthetic value from §1, or (b) a checkable public figure in `INVARIANTS.pub`. Fail
otherwise. This is a strict **superset** of the prior `DISPATCH_DOCTRINE §3` gate (raw denylist ∪
structural sweep, 0 hits): the structural sweep still runs as a *finder*, but the accept/reject decision
is now the whitelist, so a leak with no denylist token can no longer pass.

> Naming note: this file uses the explicit `.pub.md` tier suffix so the public-safe tier is legible in
> the filename — closing the ambiguity that let a `.md`-named file be mis-mapped as `.pub` (LEDGER §D2/F-D2a).

### 1.7 Non-routable universal addresses (loopback / unspecified)
- `127.0.0.0/8` — loopback. `127.0.0.1` is a universal constant, reveals no infrastructure.
- `0.0.0.0` — unspecified/wildcard address; a notation (`0.0.0.0/0` = all-routes), not an identifier.
- **NOT included (still flagged by design):** RFC-1918 private ranges (`10.x`, `192.168.x`, `172.16-31.x`).
  These are non-routable but a *specific* private IP (e.g. a real router LAN address) is an infrastructure
  tell — a flagged RFC-1918 hit is reviewed by a human, not auto-passed.
