# RootDrifter Hub — Privacy Constitution

## Two namespaces. They never resolve to each other.

### PUBLISHED namespace (MAY appear in this repo):
- The handle: rootdrifter
- Domain: rootdrifter.io
- Content framed as representative reference builds
- Placeholder values: [YOUR NAME], [UNIVERSITY], example.com,
  192.0.2.x, 198.51.100.x (RFC-5737 documentation ranges)
- Ghost theme code, templates, CSS, JS
- Content: CTF writeups, pentest methodology, OSINT/recon

### OPERATIONAL namespace (MUST NEVER appear):
- Real device/machine codenames or their specifics
- Internal daemon/profile names or hierarchy references
- Real hostnames, VPN IPs, DNS upstreams
- Key fingerprints, SSH key comments tied to identity
- Real email addresses, disposable/forwarding email aliases, wallet addresses
- LUKS UUIDs, boot hashes, crypttab/dracut/WireGuard real values
- Any cross-compartment opsec or monetisation infrastructure
- Real name, university name, employer names from CV

## Core rule:
A codename only protects if it does NOT map 1:1 to the real asset.
Published content describes REPRESENTATIVE reference builds.
Documenting the real asset under any name is still disclosure.

## Fail-closed:
When uncertain whether something is safe to publish — do NOT publish it.
Generalised content is the target, not a compromise.
