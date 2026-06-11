/* IRONVEIL hardening checklist — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds from embedded data (verbatim from the static
   spec page), mounts into #ironveil-component and hides the static fallback table that
   follows it in the page content. Data parity: ironveil/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('ironveil-component');
  if (!mount) return;

  var ITEMS = [
    { tag: 'Operational', pending: false,
      name: '<strong>LUKS2 Argon2id full-disk encryption</strong> — all three keyslots active',
      body: 'Offline disk clone and brute-force key derivation. Argon2id is a memory-hard KDF, raising the cost of GPU/ASIC-accelerated guessing. Keyslot custody removes any single point of key failure: Slot 0 emergency passphrase stored offline, Slot 1 NK#1 daily driver, Slot 2 NK#2 offline backup.' },
    { tag: 'Operational', pending: false,
      name: '<strong>Nitrokey NK#1 FIDO2 enrollment</strong> — firmware 1.8.3, touch-only',
      body: 'Hardware-key activation without physical presence. Touch confirmation is required for every unlock event. clientPin is not supported on this firmware version, so reliance is deliberately on physical touch — a key that could be activated remotely would defeat the physical-presence guarantee.' },
    { tag: 'Enrolled', pending: false,
      name: '<strong>Nitrokey NK#2 backup keyslot</strong> — stored offline',
      body: 'Loss or seizure of the primary hardware key. NK#2 is enrolled in its own keyslot but kept offline, activated only if NK#1 becomes unavailable.' },
    { tag: 'Operational', pending: false,
      name: '<strong>dracut-sshd remote unlock</strong> — Termux ed25519 key in initramfs',
      body: 'A remote or headless machine being impossible to unlock without physical presence — and MITM key substitution during the unlock: the initramfs SSH host key is pinned on the GrapheneOS client, and the volume passphrase is never sent over the network; the authenticated session answers the unlock prompt via <code>systemd-tty-ask-password-agent</code>.' },
    { tag: 'Operational', pending: false,
      name: '<strong>WireGuard wg-SE-RO-1</strong> — NetworkManager-managed',
      body: 'Traffic interception and geolocation. All external traffic is routed through the tunnel; the kill-switch drops traffic if the interface drops rather than failing open.' },
    { tag: 'Operational', pending: false,
      name: '<strong>AdGuard Home DNS filtering</strong> — upstream via 10.2.0.1',
      body: 'Plaintext DNS leakage and tracker / malicious-domain resolution. Queries traverse the WireGuard tunnel to the upstream resolver — an external observer sees only encrypted tunnel traffic.' },
    { tag: 'Operational', pending: false,
      name: '<strong>systemd-resolved → 127.0.0.1</strong> loopback binding',
      body: 'Applications bypassing the DNS filter. All system resolution is forwarded to the local AdGuard Home listener, so no query leaves the host unfiltered.' },
    { tag: 'Operational', pending: false,
      name: '<strong>OpenRGB (Razer + Corsair)</strong> — vendor daemons absent',
      body: 'Vendor cloud-daemon telemetry and unnecessary supply-chain surface: Razer Synapse and iCUE are not installed; peripherals are managed locally as USB HID devices.' },
    { tag: 'Manual Input', pending: true,
      name: '<strong>LUKS2 exact cipher + key size</strong> — run: <code>sudo cryptsetup luksDump /dev/sda3</code>',
      body: 'Value must be read from the running machine and will be published once captured. An honest gap beats invented completeness.' },
    { tag: 'Manual Input', pending: true,
      name: '<strong>Fedora release + kernel</strong> — run: <code>cat /etc/fedora-release &amp;&amp; uname -r</code>',
      body: 'Captured from the running machine in a hardware session; recorded here once verified.' },
    { tag: 'Manual Input', pending: true,
      name: '<strong>SELinux/seccomp status</strong> — run: <code>getenforce &amp;&amp; sestatus</code>',
      body: 'Enforcement state is reported only as measured on the host, never assumed.' },
    { tag: 'Manual Input', pending: true,
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
