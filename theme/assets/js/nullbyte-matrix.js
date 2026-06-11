/* NULLBYTE profile isolation matrix — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds the 9×5 matrix from embedded data (verbatim
   from the static spec page), mounts into #nullbyte-component and hides the static fallback
   table that follows. Data parity: nullbyte/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('nullbyte-component');
  if (!mount) return;

  var CAPS = ['Network reach', 'Sandboxed Play', 'Termux / SSH', 'Sensitive data', 'External comms'];
  var STATE = { a: ['Allowed', '●'], c: ['Conditional', '◖'], r: ['Restricted', '○'] };
  var DD = 'Not documented in the public stack — treated as default-deny.';
  var ROWS = [
    ['Nexus',
      ['c', 'Admin-only network use. The owner profile manages the device and hardware keys; it is not a browsing or comms surface.'],
      ['r', 'Deliberately no sandboxed Play — minimises the trusted-code surface around hardware-key management.'],
      ['r', 'No Termux. Shell tooling lives in Void and Façade, away from device administration.'],
      ['a', 'Holds the highest-trust material on the device: hardware-key management and device administration.'],
      ['r', 'No external communications — nothing in the owner profile talks to the outside world on its own behalf.']],
    ['Plague',
      ['a', 'Untrusted-app testing needs real egress; nothing sensitive sits behind it if an app misbehaves.'],
      ['c', 'Sandboxed Play installed only where an app under test requires it.'],
      ['r', 'Not part of this profile’s documented stack — default-deny.'],
      ['r', 'Holds nothing of value by design: the profile is destroyed and recreated without loss.'],
      ['c', 'Disposable interactions only — no identity-linked accounts.']],
    ['Ghost',
      ['a', 'Short-lived registrations need network access; the profile itself is throwaway.'],
      ['c', 'Sandboxed Play added only as needed for a registration target.'],
      ['r', 'Not part of this profile’s documented stack — default-deny.'],
      ['r', 'Ephemeral accounts only — nothing persistent or identifying is stored.'],
      ['c', 'Minimal messaging/registration apps for short-lived accounts, then discarded.']],
    ['Abyss',
      ['a', 'Courses, documentation, and research reading require ordinary web access.'],
      ['r', DD],
      ['r', 'No shell tooling — this is a reading profile.'],
      ['r', 'Reading material only; no credentials or personal data live here.'],
      ['r', 'No outbound comms role — consumption, not conversation.']],
    ['Void',
      ['a', 'Broadest network reach on the device — pentesting and CTF work needs it.'],
      ['r', DD],
      ['a', 'Termux with offensive tooling is the core of this profile.'],
      ['r', 'Deliberately empty of financial/professional data: compromise of the noisiest profile yields nothing sensitive.'],
      ['c', 'Network/CTF clients only — no personal accounts.']],
    ['Façade',
      ['c', 'Network access includes the IRONVEIL workstation subnet for SSH administration.'],
      ['r', DD],
      ['a', 'Termux holds the only copy of the IRONVEIL unlock key — inaccessible from every other profile.'],
      ['a', 'Professional communications and productivity data live here.'],
      ['a', 'The device’s working comms surface — work communications run from this profile.']],
    ['Shade',
      ['a', 'OSINT collection and research need broad read access to the open web.'],
      ['r', DD],
      ['r', 'No shell tooling documented for this profile.'],
      ['r', 'No PII linkage by design — research must never connect back to an identity.'],
      ['r', 'Collection, not contact: outbound identity-linked comms would defeat the OSINT separation.']],
    ['Vault',
      ['c', 'The strictest profile: network use is limited to banking/payment endpoints, with no broad reach.'],
      ['c', 'Sandboxed Play only where a banking app strictly requires it.'],
      ['r', 'No shell tooling anywhere near financial sessions.'],
      ['a', 'Financial data — the most sensitive material on the device, behind the tightest restrictions.'],
      ['r', 'Banking apps only; no general messaging or social surface.']],
    ['Joker',
      ['c', 'Reserve profile — a minimal mirror of baseline apps, activated only at need.'],
      ['r', DD],
      ['r', 'No shell tooling in the fallback profile.'],
      ['r', 'Holds no unique data — it mirrors essentials, it does not originate them.'],
      ['c', 'Essential baseline comms only, while serving as fallback.']]
  ];

  var style = document.createElement('style');
  style.textContent =
    '#nullbyte-component .matrix-hint{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin:0.5rem 0 0.75rem;}' +
    '#nullbyte-component .matrix-legend{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.1em;color:var(--muted);display:flex;gap:1.2rem;margin-bottom:0.6rem;}' +
    '#nullbyte-component .lg-a{color:var(--green);}#nullbyte-component .lg-c{color:var(--warn);}#nullbyte-component .lg-r{color:var(--muted);}' +
    '#nullbyte-component .matrix-scroll{overflow-x:auto;margin:0 0 0.75rem;}' +
    '#nullbyte-component table{width:100%;border-collapse:collapse;font-size:0.8rem;min-width:560px;}' +
    '#nullbyte-component th{font-family:var(--font-mono);font-size:0.58rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);padding:0.5rem 0.7rem;text-align:left;border-bottom:1px solid var(--border-bright);background:var(--code-bg);}' +
    '#nullbyte-component td{padding:0.4rem 0.7rem;border-bottom:1px solid var(--border);}' +
    '#nullbyte-component td:first-child{font-family:var(--font-mono);font-size:0.72rem;color:var(--green);}' +
    '#nullbyte-component .m-cell{background:none;border:none;cursor:pointer;font-size:0.95rem;padding:0.1rem 0.4rem;}' +
    '#nullbyte-component .m-a{color:var(--green);}#nullbyte-component .m-c{color:var(--warn);}#nullbyte-component .m-r{color:var(--muted);}' +
    '#nullbyte-component .m-cell:hover,#nullbyte-component .m-cell:focus-visible{outline:1px solid var(--green);}' +
    '#nullbyte-component .matrix-tip{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--green);padding:0.8rem 1.1rem;font-size:0.82rem;min-height:3.2em;}' +
    '#nullbyte-component .tip-label{font-family:var(--font-mono);font-size:0.58rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--green);display:block;margin-bottom:0.3rem;}';
  document.head.appendChild(style);

  mount.innerHTML =
    '<p class="matrix-hint">// Interactive — hover or tap a cell for the security rationale</p>' +
    '<div class="matrix-legend"><span class="lg-a">● Allowed</span><span class="lg-c">◖ Conditional</span><span class="lg-r">○ Restricted</span></div>' +
    '<div class="matrix-scroll"></div>' +
    '<div class="matrix-tip" aria-live="polite"><span class="tip-label">Rationale</span><span class="tip-body">Select any cell — every allowed/restricted decision exists to contain a specific failure, not for convenience.</span></div>';

  var table = document.createElement('table');
  var head = '<tr><th>Profile</th>';
  CAPS.forEach(function (c) { head += '<th>' + c + '</th>'; });
  table.innerHTML = head + '</tr>';

  var tipLabel = mount.querySelector('.tip-label');
  var tipBody = mount.querySelector('.tip-body');

  ROWS.forEach(function (row) {
    var tr = document.createElement('tr');
    var td0 = document.createElement('td');
    td0.textContent = row[0];
    tr.appendChild(td0);
    for (var i = 1; i < row.length; i++) {
      (function (profile, cap, state, tip) {
        var td = document.createElement('td');
        var btn = document.createElement('button');
        btn.className = 'm-cell m-' + state;
        btn.textContent = STATE[state][1];
        btn.setAttribute('aria-label', profile + ' / ' + cap + ': ' + STATE[state][0]);
        ['mouseenter', 'focus', 'click'].forEach(function (ev) {
          btn.addEventListener(ev, function () {
            tipLabel.textContent = profile + ' / ' + cap + ' — ' + STATE[state][0];
            tipBody.textContent = tip;
          });
        });
        td.appendChild(btn);
        tr.appendChild(td);
      })(row[0], CAPS[i - 1], row[i][0], row[i][1]);
    }
    table.appendChild(tr);
  });
  mount.querySelector('.matrix-scroll').appendChild(table);

  /* hide the static fallback table + legend paragraph that follow the mount */
  var sib = mount.nextElementSibling, hidden = 0;
  while (sib && hidden < 2) {
    if (sib.tagName === 'TABLE') { sib.style.display = 'none'; hidden = 2; }
    else if (sib.tagName === 'P' && /Legend:/.test(sib.textContent)) { sib.style.display = 'none'; hidden++; }
    sib = sib.nextElementSibling;
  }
})();
