<!-- ghost-page
slug: portfolio-ironveil
title: IRONVEIL — Hardened Fedora Workstation
excerpt: FEDORA WORKSTATION · LUKS2 · FIDO2 · WIREGUARD · DRACUT-SSHD · LIVING BUILD
-->

> **// STATUS — OPERATIONAL · rev 2026-06-10 · LIVING BUILD**

> **// Overview** — Hardened Fedora workstation built to a defence-in-depth security model.
> LUKS2 full-disk encryption requires physical hardware key presence for unlock. If the key is
> unavailable, the machine can still be unlocked remotely over SSH from a GrapheneOS mobile
> platform — without the initramfs ever trusting a password over the network. WireGuard routes
> all external traffic; AdGuard Home intercepts all DNS before it leaves the host.

> **// Living Build** — This is an actively maintained workstation build, not a static project.
> Sections marked MANUAL INPUT REQUIRED require values captured from the running machine and
> will be updated in a future session.

---

## Threat Model

The build addresses a specific threat model for a security practitioner whose workstation
stores research, tooling, and keys worth protecting against physical access, supply-chain
key compromise, and remote theft. Each component was chosen because it eliminates a
specific attack path — not because it adds capability.

| Threat | Control |
|--------|---------|
| Offline disk clone and brute-force | LUKS2 with Argon2id KDF; hardware key required to unlock |
| Primary hardware key lost or seized | NK#2 backup keyslot; passphrase emergency fallback |
| Hardware key cloned without touch | Touch-only FIDO2 enrollment; Nitrokey 3A NFC requires physical presence |
| Remote workstation inaccessible for unlock | dracut-sshd: SSH into initramfs from GrapheneOS |
| DNS traffic leakage and exfiltration | AdGuard Home filtering; systemd-resolved bound to loopback |
| Traffic interception and geolocation | WireGuard VPN on all external traffic with kill-switch |

---

## Components

### LUKS2 Full-Disk Encryption

Encrypted volume: `/dev/sda3`. Three keyslots: Slot 0 (passphrase — emergency fallback only,
stored offline), Slot 1 (Nitrokey NK#1 — daily driver, touch required), Slot 2 (Nitrokey NK#2 —
kept offline, activated if NK#1 is lost). LUKS2 uses Argon2id as the key derivation function.
Hardware key slots enroll FIDO2 credentials — the passphrase is never sent to the key.

### Nitrokey 3A NFC — FIDO2 Hardware Key

Hardware: Nitrokey 3A NFC · Firmware: 1.8.3 · Enrollment mode: touch-only — physical presence
required for every unlock event. clientPin is not supported on this firmware version; reliance
is on touch confirmation. The touch-only constraint is intentional: a key activatable remotely
would defeat the physical-presence guarantee.

### dracut-sshd — Remote Unlock via SSH

The initramfs is built with `dracut-sshd`, which starts a minimal SSH daemon at pre-boot.
Unlock flow: machine reaches initramfs SSH listener → GrapheneOS (Termux) connects via
`ssh unlock@$IRONVEIL_IP` → Termux ed25519 public key (baked into initramfs at build time)
authenticates → authenticated session triggers `systemd-cryptsetup@sda3` → volume unlocks,
boot continues. The initramfs SSH host key is pinned on the GrapheneOS client to prevent MITM
substitution.

### WireGuard VPN — wg-SE-RO-1

Interface: `wg-SE-RO-1` (named-tunnel model encoding endpoint region). Managed by
NetworkManager as a first-class network connection. All external traffic routed through the
tunnel. Kill-switch rule drops traffic if the interface drops. The rename from `wg0` reflects
a move toward multi-tunnel readability.

### AdGuard Home DNS Filtering

Upstream DNS: WireGuard peer at `10.2.0.1` — DNS queries traverse the encrypted tunnel before
reaching a resolver. Listener: `127.0.0.1:53`. `systemd-resolved` configured to forward all
queries to `127.0.0.1`. DNS chain: application → systemd-resolved (loopback) → AdGuard Home →
WireGuard → upstream resolver. External observer sees only WireGuard-encrypted traffic.

### OpenRGB — Peripheral Configuration

Razer Huntsman V2 (keyboard), Razer Basilisk (mouse), 6× Corsair fans via Commander Pro.
OpenRGB provides vendor-agnostic RGB control without vendor cloud daemons (Razer Synapse,
iCUE). No vendor software installed. Commander Pro detected as USB HID device.

---

## Security Architecture — Defence in Depth

| Layer | Control | Threat addressed |
|-------|---------|------------------|
| Physical | Nitrokey 3A NFC FIDO2, touch-only enrollment (fw 1.8.3, no clientPin) | Remote/unattended hardware-key activation |
| Disk | LUKS2 volume on `/dev/sda3` with Argon2id KDF | Offline disk clone and brute-force key derivation |
| Boot | dracut-sshd pre-boot SSH with pinned ed25519 host key | Unattended unlock; MITM key substitution during unlock |
| Key Custody | NK#1 primary, NK#2 offline backup, offline emergency passphrase | Single point of key failure; primary key loss or seizure |
| Network | WireGuard `wg-SE-RO-1` (NetworkManager) with kill-switch | Traffic interception, geolocation, leakage if tunnel drops |
| DNS | AdGuard Home on `127.0.0.1:53` + systemd-resolved loopback; upstream via `10.2.0.1` over WireGuard | Plaintext DNS leakage; tracker and malicious domain resolution |

---

## Hardening Checklist — Component Status

<div id="ironveil-component" aria-label="Interactive hardening checklist"></div>

| Status | Control | Protects against |
|--------|---------|------------------|
| Operational | LUKS2 Argon2id full-disk encryption — all three keyslots active | Offline disk clone and brute-force key derivation; memory-hard KDF raises GPU/ASIC guessing cost; keyslot custody removes single point of key failure |
| Operational | Nitrokey NK#1 FIDO2 enrollment — firmware 1.8.3, touch-only | Hardware-key activation without physical presence; touch required for every unlock event |
| Enrolled | Nitrokey NK#2 backup keyslot — stored offline | Loss or seizure of the primary hardware key |
| Operational | dracut-sshd remote unlock — Termux ed25519 key in initramfs | Headless machine impossible to unlock remotely; MITM key substitution (host key pinned); passphrase never sent over the network — unlock answered via `systemd-tty-ask-password-agent` |
| Operational | WireGuard wg-SE-RO-1 — NetworkManager-managed | Traffic interception and geolocation; kill-switch fails closed |
| Operational | AdGuard Home DNS filtering — upstream via 10.2.0.1 | Plaintext DNS leakage; tracker / malicious-domain resolution |
| Operational | systemd-resolved → 127.0.0.1 loopback binding | Applications bypassing the DNS filter |
| Operational | OpenRGB (Razer + Corsair) — vendor daemons absent | Vendor cloud-daemon telemetry; unnecessary supply-chain surface |
| **MANUAL INPUT** | LUKS2 exact cipher + key size — `sudo cryptsetup luksDump /dev/sda3` | Pending — published once captured from the running machine |
| **MANUAL INPUT** | Fedora release + kernel — `cat /etc/fedora-release && uname -r` | Pending — captured in a hardware session |
| **MANUAL INPUT** | SELinux/seccomp status — `getenforce && sestatus` | Pending — reported only as measured, never assumed |
| **MANUAL INPUT** | LUKS2 unlock-latency benchmark — hardware key vs passphrase | Pending — measured, not estimated |

> **MANUAL INPUT PENDING** — the four items above require values captured from the running
> machine (see the repo's `MANUAL_INPUTS.md`). An honest gap beats invented completeness.

---

## Skills Demonstrated

| Skill | Evidence |
|-------|----------|
| Linux Hardening | LUKS2 full-disk encryption with keyslot management and Argon2id KDF configuration |
| FIDO2 / Hardware Key Integration | Nitrokey 3A NFC enrolled as LUKS2 keyslot with touch-only enforcement; CTAP2 credential flow |
| Initramfs Engineering | dracut-sshd configured for pre-boot SSH with pinned ed25519 key; key rotation procedure documented |
| Network Security | WireGuard VPN with kill-switch via NetworkManager; named-tunnel model for multi-tunnel readability |
| DNS Security | AdGuard Home + systemd-resolved; DNS-over-WireGuard; loopback binding preventing unfiltered queries |
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
