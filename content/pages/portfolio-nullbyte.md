<!-- ghost-page
slug: portfolio-nullbyte
title: NULLBYTE — GrapheneOS Mobile Platform
excerpt: GRAPHENEOS · PIXEL 10 PRO FOLD · COMPARTMENTALISED PROFILE ARCHITECTURE · LIVING BUILD
-->

> **// STATUS — OPERATIONAL · rev 2026-06-12 · LIVING BUILD**
> Device: Pixel 10 Pro Fold · SoC: Tensor G5 · Security chip: Titan M2 · GrapheneOS Android 16 · Profiles: 9

GrapheneOS eliminates the trust compromises baked into stock Android: no Google Play Services
in the owner profile, no persistent background reporting, **verified boot enforced at every
power cycle**. On top of the OS security model, this build imposes an additional architectural
constraint — operational separation via compartmentalised user profiles.

Each profile is a distinct security boundary. An application running in one profile cannot read
the filesystem, contacts, or network state of another. If a profile is compromised, the damage
is contained and cannot propagate across the boundary.

The build integrates with IRONVEIL: Termux in the primary work profile provides SSH access to
the IRONVEIL workstation, including the ability to trigger the dracut-sshd remote unlock
sequence from the handset.

---

## Hardware

| Component | Value |
|-----------|-------|
| Device | Google Pixel 10 Pro Fold |
| SoC | Google Tensor G5 |
| Security chip | Titan M2 (confirmed) |
| Security stack | Tensor G5 security core + Titan M2 + Trusty TEE |
| OS | GrapheneOS — Android 16 |
| Build number | 2026060601 |
| Storage | 1 TB |
| RAM | 16 GB |
| IP rating | IP68 |

> **// Hardware Root of Trust** — The platform layers three hardware-rooted components: the
> **Tensor G5 security core** (SoC-integrated), the discrete certified **Titan M2** chip, and the
> **Trusty TEE** (Trusted Execution Environment). Titan M2 handles verified-boot attestation,
> cryptographic key storage, tamper detection, and secure lock-screen enforcement independently of
> the main SoC — physically separate from the application processor, so a compromised OS cannot
> extract keys it holds, and an attacker who compromises the Tensor G5 cannot forge the attestation
> chain without it.

---

## Security Architecture

- Verified boot — Titan M2 root of trust → bootloader → OS image

> **// Verified-boot key hash (confirmed)** —
> `6836b3c55f753af0a70daafbc4cc6c06fdfe0fca8634e1f7db12e9e10fbd5613` — the fingerprint of the
> verified-boot key signing this device's GrapheneOS build, independently verifiable against the
> GrapheneOS release signing keys published at `grapheneos.org/releases` to confirm the build is
> authentic and unmodified. Shown on the yellow-state boot screen and via
> `getprop ro.boot.vbmeta.digest`.

> **// What a mismatch would mean** — The point of the hash is not that it matches today — it is
> that a mismatch is *detectable*. If this value did not match the published GrapheneOS signing
> key, it would indicate either a different OS version than expected or, the case that matters, a
> build that was **not signed by the GrapheneOS project** — a substituted or tampered OS. Because
> any silent post-installation modification of the OS partition necessarily changes this value, an
> evil-maid attacker cannot alter the system without the change surfacing at the next boot. That
> detectability is the security property; the specific hash is just how it is observed.

- Per-profile encryption — independent key per profile
- Sandboxed Google Play — no system-level privileges
- RethinkDNS — per-app network policy at VPN layer
- WireGuard — encrypted egress per-profile
- Baseband IOMMU — modem cannot DMA into app-processor memory
- Profile isolation — no shared clipboard, contacts, or call history
- Bootloader relocked post-installation

Each Android user profile has its own encryption key derived from the profile's lockscreen
credential. The owner profile key is further protected by the Titan M2. A locked profile's data
is inaccessible to all other profiles — including owner — without the profile credential.

WireGuard tunnels provide encrypted egress for profiles where network traffic confidentiality
is required. RethinkDNS manages tunnel routing on a per-profile basis — not all profiles use
the same exit point, and some profiles can be restricted to tunnel-only traffic with no
cleartext fallback.

---

## Compartmentalised Profile Architecture

The device is partitioned into nine compartmentalised user profiles. This is a security design
decision, not an organisational convenience: each profile is an independently encrypted trust
boundary with its own application stack, network policy, and operational purpose. No application
spans profiles and there is no shared state, so the blast radius of any single compromise — a
malicious app, a phishing foothold, a sandboxed-service zero-day — stops at the profile edge.

> **// Design Rationale — Threat per Boundary** — Profiles are assigned by sensitivity and by
> network reach, and the two are deliberately kept apart. **Vault** (financial) is the strictest
> and holds no broad network access — it defeats credential theft and malicious-app exfiltration
> of banking data. **Void** (pentesting) has the broadest network reach but no financial or
> professional data, so compromise of the noisiest profile yields nothing sensitive. **Nexus**
> (owner) is kept off sandboxed Play entirely to minimise the trusted-code surface around
> hardware-key management. **Plague** and **Ghost** are expendable by design — destroyed and
> recreated without loss. Under a coerced single-profile unlock, every other profile remains
> cryptographically inaccessible.

| # | Profile | Role | Status | Stack |
|---|---------|------|--------|-------|
| 01 | Nexus | Owner profile — device administration, hardware key management | Active | System settings, hardware-key management. No sandboxed Play. |
| 02 | Plague | Junk — disposable interactions, untrusted app testing | Expendable | Untrusted apps under test; sandboxed Play where required. |
| 03 | Ghost | Throwaway — short-lived registrations, ephemeral accounts | Expendable | Minimal messaging/registration apps; sandboxed Play as needed. |
| 04 | Abyss | Learning — courses, documentation, research reading | Active | Hardened browser, document/PDF readers, course and reference apps. |
| 05 | Void | Pentesting — offensive security tooling, CTF work | Active | Termux with offensive tooling, network/CTF clients. Broadest network access, no sensitive data. |
| 06 | Façade | Professional — work communications, productivity | Active | Termux (IRONVEIL SSH unlock), productivity and communications apps. |
| 07 | Shade | OSINT — open-source intelligence gathering and research | Active | Hardened browser, research and collection tooling. No PII linkage. |
| 08 | Vault | Financial — banking, payments, financial services | Active | Banking and payment apps only. Strictest restrictions. Sandboxed Play only where required. |
| 09 | Joker | Fallback — backup operational identity | Reserve | Minimal mirror of essential baseline apps. Held in reserve. |

> **// Design Principles** — No personally identifying information crosses profile boundaries.
> Profiles with elevated sensitivity (Vault, Nexus) have the strictest app restrictions. Void
> (pentesting) has broadest network access but no access to financial or professional data —
> compromise of this profile yields no sensitive personal material. Plague and Ghost are
> designed to be expendable — deleted and recreated without loss of value.

A full per-profile [threat model](https://github.com/rootdrifter/nullbyte/blob/main/threat-model.md)
documents, for each of the nine profiles, the threat it counters, the blast radius if it is
compromised, the data at risk, and the controls in place — plus the device-wide threats (theft,
coercion, baseband) and an honest residual-risk statement.

---

## Profile Isolation Matrix

<div id="nullbyte-component" aria-label="Interactive profile isolation matrix"></div>

Legend: ● Allowed · ◖ Conditional · ○ Restricted

| Profile | Network reach | Sandboxed Play | Termux / SSH | Sensitive data | External comms |
|---------|---------------|----------------|--------------|----------------|----------------|
| Nexus | ◖ | ○ | ○ | ● | ○ |
| Plague | ● | ◖ | ○ | ○ | ◖ |
| Ghost | ● | ◖ | ○ | ○ | ◖ |
| Abyss | ● | ○ | ○ | ○ | ○ |
| Void | ● | ○ | ● | ○ | ◖ |
| Façade | ◖ | ○ | ● | ● | ● |
| Shade | ● | ○ | ○ | ○ | ○ |
| Vault | ◖ | ◖ | ○ | ● | ○ |
| Joker | ◖ | ○ | ○ | ○ | ◖ |

Capabilities not documented in a profile's public stack are shown restricted — the architecture
is default-deny: a capability that is not part of a profile's purpose is not present in it.
Per-profile app lists beyond the documented stacks stay private by policy.

---

## SSH Integration with IRONVEIL

**IRONVEIL Remote Unlock — Façade Profile.** Termux is installed in the **Façade**
(professional) profile, which has network access to the IRONVEIL workstation subnet.

Use cases: remote SSH administration of IRONVEIL; dracut-sshd remote unlock sequence on
IRONVEIL boot; ed25519 key pair management for initramfs authorization.

The Termux private key for IRONVEIL unlock is stored only in the Façade profile and is not
accessible from any other profile on the device.

---

## Component Status

| Status | Component |
|--------|-----------|
| Verified | **GrapheneOS** — Pixel 10 Pro Fold, Android 16 (build 2026060601), bootloader relocked |
| Verified | **Verified boot key hash** — `6836b3c5…fbd5613` (full hash above) |
| Verified | **Titan M2 secure element** — + Trusty TEE + Tensor G5 security core confirmed |
| Verified | **Nine-profile architecture** — Nexus, Plague, Ghost, Abyss, Vault, Façade, Void, Joker, Shade (all present on device) |
| Operational | **Per-profile encryption** — 9 profiles active |
| Operational | **Sandboxed Google Play** — selective profiles only |
| Operational | **RethinkDNS firewall** — per-app rules active |
| Operational | **WireGuard** — profile-selective routing active |
| Active | **Baseband IOMMU isolation** — hardware-enforced |
| Operational | **Termux SSH to IRONVEIL** — Façade profile, ed25519 key enrolled |
| **PENDING** | **Exact GrapheneOS release tag + Tensor G5 kernel** — Android 16 / build 2026060601 captured; release-tag string + kernel still pending |
| **PENDING** | **Per-profile WireGuard routing config** — from RethinkDNS per-profile settings |

> **PENDING** — the two items above are secondary values not yet captured from the device
> (see the repo's `MANUAL_INPUTS.md`).

---

## Skills Demonstrated

- Mobile security — GrapheneOS deployment, relocked bootloader, verified boot
- Android hardening — per-profile encryption, sandboxed Play, privilege separation
- Operational security — nine-profile compartmentalisation, no cross-profile leakage
- Network security — RethinkDNS per-app firewall, WireGuard profile routing
- Hardware security — Titan M2 root of trust, Tensor G5 IOMMU isolation
- Security architecture — threat-modelled profile design, failure containment
- Systems integration — Termux SSH to IRONVEIL, remote unlock from mobile
- Threat modelling — compartmentalisation by consequence, not by convenience

---

## Repository

> **// GitHub** — Full build documentation, architecture research, and threat model:
> [github.com/rootdrifter/nullbyte](https://github.com/rootdrifter/nullbyte) — one repository
> in the [github.com/rootdrifter](https://github.com/rootdrifter) portfolio.
