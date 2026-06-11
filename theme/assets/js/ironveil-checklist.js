/* IRONVEIL hardening checklist — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds from embedded data (verbatim from the static
   spec page), mounts into #ironveil-component and hides the static fallback table that
   follows it in the page content. Data parity: ironveil/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('ironveil-component');
  if (!mount) return;

  var ITEMS = [
    { tag: 'Verified', pending: false,
      name: '<strong>LUKS2 full-disk encryption</strong> — aes-xts-plain64, 512-bit, Argon2id + 2× FIDO2 (3 keyslots)',
      body: 'Offline disk clone and brute-force key derivation. Cipher aes-xts-plain64 with a 512-bit key; slot 0 is an Argon2id passphrase (memory-hard, raising GPU/ASIC guessing cost), slots 1–2 are PBKDF2/SHA-512 FIDO2. Keyslot custody removes any single point of key failure: passphrase stored offline, primary Nitrokey daily driver, backup Nitrokey offline.' },
    { tag: 'Verified', pending: false,
      name: '<strong>Nitrokey 3A NFC FIDO2</strong> — 2 tokens, firmware 1.8.3, touch-only, no clientPin',
      body: 'Hardware-key activation without physical presence. Both tokens are enrolled touch-only (<code>fido2-up-required=true</code>) with no clientPin — touch confirmation is required for every unlock event. clientPin is not supported on this firmware, so reliance is deliberately on physical touch; a key activatable remotely would defeat the physical-presence guarantee.' },
    { tag: 'Verified', pending: false,
      name: '<strong>dracut-sshd remote unlock</strong> — v0.7.1-5.fc44; systemd-networkd + fido2 modules',
      body: 'A remote or headless machine being impossible to unlock without physical presence — and MITM key substitution during the unlock: the initramfs SSH host key is pinned on the client, and the passphrase is never sent over the network. The <code>fido2</code> module lets a Nitrokey touch satisfy the prompt; <code>systemd-tty-ask-password-agent</code> relays the unlock. Built on Fedora 44, kernel 7.0.11-200.fc44.x86_64.' },
    { tag: 'Verified', pending: false,
      name: '<strong>WireGuard wg-CH-FI-2 + wg-SE-FI-1</strong> — NetworkManager, manual, full-tunnel',
      body: 'Traffic interception and geolocation. Both tunnels carry full-tunnel <code>AllowedIPs</code> (0.0.0.0/0, ::/0), so the active tunnel is the default route for all traffic — a route-based (implicit) kill-switch. A separate fail-closed rule is planned; tunnels are manually activated (autoconnect=false).' },
    { tag: 'Verified', pending: false,
      name: '<strong>AdGuard Home DNS filtering</strong> — Quad9 DoH upstream, *:53, AdGuard DNS filter',
      body: 'Plaintext DNS leakage and tracker / malicious-domain resolution. AdGuard’s only upstream is Quad9 over DNS-over-HTTPS, so queries leave already encrypted and egress through the active WireGuard tunnel — an external observer sees only encrypted tunnel traffic. (Listener is *:53, not loopback-only; the guarantee rests on the DoH-over-tunnel upstream, verified 2026-06-11 via wg-CH-FI-2.)' },
    { tag: 'Verified', pending: false,
      name: '<strong>systemd-resolved → 127.0.0.1</strong> (stub listener off)',
      body: 'Applications bypassing the DNS filter. All system resolution is forwarded to the local AdGuard Home listener (which owns port 53), so no query leaves the host unfiltered.' },
    { tag: 'Verified', pending: false,
      name: '<strong>Build platform</strong> — Fedora 44, kernel 7.0.11-200.fc44.x86_64',
      body: 'Reproducibility and auditability of the build: the exact Fedora release and kernel the workstation was built and verified on (2026-06-11).' },
    { tag: 'Verified', pending: false,
      name: '<strong>OpenRGB (Razer + Corsair)</strong> — vendor daemons absent',
      body: 'Vendor cloud-daemon telemetry and unnecessary supply-chain surface: Razer Synapse and iCUE are not installed; peripherals are managed locally as USB HID devices.' },
    { tag: 'Pending', pending: true,
      name: '<strong>SELinux/seccomp status</strong> — run: <code>getenforce &amp;&amp; sestatus</code>',
      body: 'Enforcement state is reported only as measured on the host, never assumed — not captured in the 2026-06-11 hardware session.' },
    { tag: 'Pending', pending: true,
      name: '<strong>LUKS2 unlock-latency benchmark</strong> — hardware key vs passphrase unlock time',
      body: 'A usability data point for the hardware-key decision: to be measured, not estimated.' }
  ];

  var style = document.createElement('style');
  style.textContent =
    '#ironveil-component .checklist-hint{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin:0.5rem 0 0.75rem;}' +
    '#ironveil-component .ctrl-list{display:flex;flex-direction:column;gap:0.5rem;margin:1rem 0;}' +
    '#ironveil-component .ctrl-item{background:var(--surface);border:1px solid var(--border);}' +
    '#ironveil-component .ctrl-item.open{border-color:var(--border-bright);}' +
    '#ironveil-component .ctrl-head{display:flex;align-items:flex-start;gap:1rem;width:100%;padding:0.75rem 1.1rem;background:none;border:none;cursor:pointer;font-family:var(--font-body);font-weight:300;text-align:left;color:var(--text);font-size:0.85rem;line-height:1.7;}' +
    '#ironveil-component .ctrl-head:hover{background:var(--code-bg);}' +
    '#ironveil-component .ctl-tag{font-family:var(--font-mono);font-size:0.58rem;letter-spacing:0.15em;text-transform:uppercase;white-space:nowrap;padding:0.2em 0.6em;margin-top:0.15rem;flex-shrink:0;color:var(--green);border:1px solid var(--green);}' +
    '#ironveil-component .ctl-tag.pending{color:var(--warn);border-color:var(--warn);}' +
    '#ironveil-component .ctrl-name{flex:1;}' +
    '#ironveil-component .ctrl-name strong{color:var(--text-bright);font-weight:600;}' +
    '#ironveil-component .ctrl-name code,#ironveil-component .ctrl-body code{font-family:var(--font-mono);font-size:0.78rem;color:var(--accent);background:var(--code-bg);padding:0.1em 0.4em;}' +
    '#ironveil-component .ctrl-chev{font-family:var(--font-mono);color:var(--muted);transition:transform 0.2s;margin-top:0.15rem;flex-shrink:0;}' +
    '#ironveil-component .ctrl-item.open .ctrl-chev{transform:rotate(90deg);color:var(--accent);}' +
    '#ironveil-component .ctrl-body{display:none;padding:0.7rem 1.1rem 0.95rem;border-top:1px solid var(--border);font-size:0.82rem;color:var(--text);}' +
    '#ironveil-component .ctrl-item.open .ctrl-body{display:block;}' +
    '#ironveil-component .protects{font-family:var(--font-mono);font-size:0.58rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--accent2);display:block;margin-bottom:0.35rem;}' +
    '#ironveil-component .protects.pending{color:var(--warn);}';
  document.head.appendChild(style);

  var hint = document.createElement('p');
  hint.className = 'checklist-hint';
  hint.textContent = '// Interactive — click any control to see what it protects against';
  mount.appendChild(hint);

  var list = document.createElement('div');
  list.className = 'ctrl-list';
  ITEMS.forEach(function (item) {
    var wrap = document.createElement('div');
    wrap.className = 'ctrl-item';
    var btn = document.createElement('button');
    btn.className = 'ctrl-head';
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span class="ctl-tag' + (item.pending ? ' pending' : '') + '">' + item.tag + '</span>' +
      '<span class="ctrl-name">' + item.name + '</span>' +
      '<span class="ctrl-chev" aria-hidden="true">▸</span>';
    var body = document.createElement('div');
    body.className = 'ctrl-body';
    body.innerHTML =
      '<span class="protects' + (item.pending ? ' pending' : '') + '">' +
      (item.pending ? 'Pending — to resolve' : 'Protects against') + '</span><p>' + item.body + '</p>';
    btn.addEventListener('click', function () {
      var open = wrap.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    wrap.appendChild(btn);
    wrap.appendChild(body);
    list.appendChild(wrap);
  });
  mount.appendChild(list);

  /* hide the static fallback table that follows the mount in the page content */
  var sib = mount.nextElementSibling;
  while (sib && sib.tagName !== 'TABLE') sib = sib.nextElementSibling;
  if (sib) sib.style.display = 'none';
})();
