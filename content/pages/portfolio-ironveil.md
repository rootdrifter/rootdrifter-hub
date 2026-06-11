<!-- ghost-page
slug: portfolio-ironveil
title: IRONVEIL — Hardened Fedora Workstation
excerpt: FEDORA WORKSTATION · LUKS2 · FIDO2 · WIREGUARD · DRACUT-SSHD · LIVING BUILD
-->

> **// STATUS — OPERATIONAL · rev 2026-06-11 · LIVING BUILD**

> **// Overview** — Hardened Fedora workstation built to a defence-in-depth security model.
> LUKS2 full-disk encryption requires physical hardware key presence for unlock. If the key is
> unavailable, the machine can still be unlocked remotely over SSH from a GrapheneOS mobile
> platform — without the initramfs ever trusting a password over the network. WireGuard routes
> all external traffic; AdGuard Home filters all DNS to an encrypted upstream before it leaves
> the host.

> **// Living Build** — An actively maintained workstation build. The core hardware values were
> captured and verified on 2026-06-11; a couple of secondary items (unlock-latency benchmark,
> SELinux/seccomp status) remain pending and are labelled as such below.

---

## Threat Model

The build addresses a specific threat model for a security practitioner whose workstation
stores research, tooling, and keys worth protecting against physical access, supply-chain
key compromise, and remote theft. Each component was chosen because it eliminates a
specific attack path — not because it adds capability.

| Threat | Control |
|--------|---------|
| Offline disk clone and brute-force | LUKS2 `aes-xts-plain64`/512-bit; Argon2id passphrase slot; hardware key required to unlock |
| Primary hardware key lost or seized | Backup Nitrokey keyslot; passphrase emergency fallback |
| Hardware key cloned without touch | Touch-only FIDO2 enrollment; Nitrokey 3A NFC requires physical presence |
| Remote workstation inaccessible for unlock | dracut-sshd: SSH into the initramfs over the pre-boot network |
| DNS traffic leakage and exfiltration | AdGuard Home → Quad9 DoH over the tunnel; no plaintext query leaves the host |
| Traffic interception and geolocation | WireGuard full-tunnel routing on all external traffic |

---

## Components

### LUKS2 Full-Disk Encryption

Encrypted volume: LUKS2 container UUID `6cbc50ba-6f8a-4932-abfc-f2d0504a29b3`, mapped as
`luks-6cbc50ba-…`, cipher **`aes-xts-plain64`, 512-bit key**. Three keyslots: Slot 0 (passphrase,
**Argon2id** — emergency/recovery fallback, stored offline), Slot 1 (primary Nitrokey 3A NFC,
**PBKDF2/SHA-512** — daily driver, touch required), Slot 2 (backup Nitrokey 3A NFC — kept offline).
The FIDO2 slots derive their key with the Nitrokey credential; the passphrase is never sent to the
key. `crypttab` references the volume by UUID with `discard,x-initrd.attach,fido2-device=auto`.

### Nitrokey 3A NFC — FIDO2 Hardware Key

Hardware: Nitrokey 3A NFC · Firmware: 1.8.3 · **Two tokens enrolled** · Enrollment mode:
touch-only (`fido2-up-required=true`) with **no clientPin** (`fido2-clientPin-required=false`) —
physical presence is required for every unlock event, but no PIN is involved. clientPin is not
supported on this firmware; the touch-only constraint is intentional: a key activatable remotely
would defeat the physical-presence guarantee.

### dracut-sshd — Remote Unlock via SSH

The initramfs is built with `dracut-sshd` (**v0.7.1-5.fc44**), plus the `systemd-networkd` and
`fido2` modules, so wired networking comes up pre-boot (`rd.neednet=1`) and a Nitrokey touch can
satisfy the LUKS prompt directly. Unlock flow: machine reaches the initramfs SSH listener → the
GrapheneOS handset (Termux) connects over Tailscale (Tailscale runs on the client, not in the
initramfs — reachability comes from the LAN the pre-boot interface sits on being exposed over the
tailnet) → the embedded ed25519 public key authenticates (host key pinned on the client) →
`systemd-tty-ask-password-agent` drives the unlock, a Nitrokey present at the machine is touched,
and boot continues. Built on **Fedora 44, kernel `7.0.11-200.fc44.x86_64`**.

### WireGuard VPN — wg-CH-FI-2 and wg-SE-FI-1

Two NetworkManager tunnels: **`wg-CH-FI-2`** (endpoint `79.135.104.69:51820`) and
**`wg-SE-FI-1`** (`185.159.156.27:51820`), each with full-tunnel `AllowedIPs` (`0.0.0.0/0, ::/0`),
interface address `10.2.0.2/32`, and a 25-second keepalive. Activation is **manual**
(`autoconnect=false`). The named-tunnel model encodes the endpoint region for multi-tunnel
readability. **Kill-switch — honest description:** the protection is *route-based*, not a separate
fail-closed rule — while a tunnel is up, the full-tunnel `AllowedIPs` makes it the default route, so
traffic is tunnel-bound; there is no nftables/dispatcher rule that drops traffic if the interface
goes down (a hard fail-closed kill-switch is planned).

### AdGuard Home DNS Filtering

AdGuard Home (install path `/opt/AdGuardHome/`) is the system resolver, listening on **`*:53`**
(pid 1452). Its only upstream is **Quad9 over DNS-over-HTTPS** (`https://dns10.quad9.net/dns-query`,
bootstrap `9.9.9.10` / `149.112.112.10`), so every query leaves already encrypted and egresses
through the active WireGuard tunnel. Block list: **AdGuard DNS filter**. `systemd-resolved` forwards
all queries to `127.0.0.1` (stub listener off) so AdGuard owns port 53. DNS chain: application →
systemd-resolved (127.0.0.1) → AdGuard Home (`:53`) → Quad9 DoH → active WireGuard tunnel. The
no-plaintext-egress property rests on the DoH-over-tunnel upstream, not on a loopback bind. (The VPN
provider also pushes `10.2.0.1`, but AdGuard overrides it — it is not the effective upstream.)

### OpenRGB — Peripheral Configuration

Razer Huntsman V2 (keyboard), Razer Basilisk (mouse), 6× Corsair fans via Commander Pro.
OpenRGB provides vendor-agnostic RGB control without vendor cloud daemons (Razer Synapse,
iCUE). No vendor software installed. Commander Pro detected as USB HID device.

---

## Security Architecture — Defence in Depth

| Layer | Control | Threat addressed |
|-------|---------|------------------|
| Physical | Nitrokey 3A NFC FIDO2, touch-only enrollment (fw 1.8.3, no clientPin) | Remote/unattended hardware-key activation |
| Disk | LUKS2 `aes-xts-plain64`/512-bit (UUID `6cbc50ba-…`), Argon2id passphrase slot | Offline disk clone and brute-force key derivation |
| Boot | dracut-sshd (v0.7.1-5.fc44) pre-boot SSH with pinned ed25519 host key | Unattended unlock; MITM key substitution during unlock |
| Key Custody | Primary Nitrokey, backup Nitrokey offline, offline emergency passphrase | Single point of key failure; primary key loss or seizure |
| Network | WireGuard `wg-CH-FI-2` / `wg-SE-FI-1` (NetworkManager, manual), full-tunnel routing | Traffic interception, geolocation, leakage if tunnel drops |
| DNS | AdGuard Home on `*:53` → Quad9 DoH over the active tunnel; systemd-resolved forwards to it | Plaintext DNS leakage; tracker and malicious domain resolution |

---

## Hardening Checklist — Component Status

<div id="ironveil-component" aria-label="Interactive hardening checklist"></div>

| Status | Control | Protects against |
|--------|---------|------------------|
| Verified | LUKS2 `aes-xts-plain64`/512-bit, Argon2id + 2× FIDO2 — 3 keyslots active | Offline disk clone and brute-force key derivation; memory-hard KDF raises GPU/ASIC guessing cost; keyslot custody removes single point of key failure |
| Verified | Nitrokey 3A NFC FIDO2 — 2 tokens, firmware 1.8.3, touch-only, no clientPin | Hardware-key activation without physical presence; touch required for every unlock event |
| Verified | dracut-sshd remote unlock — v0.7.1-5.fc44; systemd-networkd + fido2 modules | Headless machine impossible to unlock remotely; MITM key substitution (host key pinned); passphrase never sent over the network |
| Verified | WireGuard `wg-CH-FI-2` + `wg-SE-FI-1` — NetworkManager, manual, full-tunnel | Traffic interception and geolocation; route-based kill-switch while the tunnel is up |
| Verified | AdGuard Home DNS filtering — Quad9 DoH upstream, `*:53`, AdGuard DNS filter | Plaintext DNS leakage; tracker / malicious-domain resolution |
| Verified | systemd-resolved → 127.0.0.1 (stub listener off) | Applications bypassing the DNS filter |
| Verified | Build platform — Fedora 44, kernel 7.0.11-200.fc44.x86_64 | Reproducibility / auditability of the build |
| Verified | OpenRGB (Razer + Corsair) — vendor daemons absent | Vendor cloud-daemon telemetry; unnecessary supply-chain surface |
| **PENDING** | SELinux/seccomp status — `getenforce && sestatus` | Reported only as measured on the host, never assumed |
| **PENDING** | LUKS2 unlock-latency benchmark — hardware key vs passphrase | A usability data point to be measured, not estimated |

> **PENDING** — the two items above are secondary values not captured in the 2026-06-11 hardware
> session (see the repo's `MANUAL_INPUTS.md`). An honest gap beats invented completeness.

---

## Skills Demonstrated

| Skill | Evidence |
|-------|----------|
| Linux Hardening | LUKS2 (aes-xts-plain64/512-bit) with keyslot management and Argon2id passphrase slot |
| FIDO2 / Hardware Key Integration | Nitrokey 3A NFC enrolled as LUKS2 keyslots (touch-only, no clientPin); CTAP2 credential flow |
| Initramfs Engineering | dracut-sshd (v0.7.1-5.fc44) pre-boot SSH with systemd-networkd + fido2; pinned ed25519 key |
| Network Security | WireGuard full-tunnel routing via NetworkManager; named-tunnel model for multi-tunnel readability |
| DNS Security | AdGuard Home → Quad9 DoH over the tunnel; encrypted upstream, no plaintext egress |
| Defence in Depth | Each threat mapped to a compensating control across physical, disk, boot, network, and DNS layers |
| Operational Security | Vendor cloud daemons eliminated; RGB peripherals managed via OpenRGB without telemetry |
| Remote Operations | SSH-based unlock from GrapheneOS; IRONVEIL ↔ NULLBYTE integration for remote boot without physical presence |

---

## Repository & Context

> **// GitHub** — Full build documentation, hardening notes, and research references:
> [github.com/rootdrifter/ironveil](https://github.com/rootdrifter/ironveil) — one repository
> in the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.

> **// Why this matters** — IRONVEIL is the operational evidence behind a security-cleared
> candidate: a workstation built with the key-custody, least-trust, and defence-in-depth
> discipline expected in cleared environments. The clearance is held now, not pending vetting —
> deployable to cleared work from day one.
