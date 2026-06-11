/* SPECTRE attack-path timeline — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds the 5-phase tab timeline from embedded data
   (verbatim from the static spec page), mounts into #spectre-component and hides the static
   fallback numbered list. Data parity: spectre/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('spectre-component');
  if (!mount) return;

  var PHASES = [
    { name: 'Phase 01 — Reconnaissance',
      tools: 'nmap -sS -sV -O -p-',
      body: '<p>Full-port SYN scan with service and OS fingerprinting surfaced exactly two services: SSH on 22/tcp and Apache 2.4.58 on 80/tcp.</p><p><strong>Key observation:</strong> the server banner disclosed its exact version and OS unprompted — the engagement’s first information leak (feeds F4).</p>' },
    { name: 'Phase 02 — Enumeration',
      tools: 'WhatWeb -a 3 · Gobuster (common.txt, 4,615 paths) · Nikto v2.5.0 (8,102 requests)',
      body: '<p>HTTP fingerprinting confirmed an active <em>Index of /</em> at the web root before any directed probing. Gobuster narrowed the surface: <strong>/server-status returned 403</strong> — proving mod_status was loaded but only access-controlled (partial hardening, F5). Nikto returned 15 findings including missing security headers (F3) and directory indexing at multiple paths.</p>' },
    { name: 'Phase 03 — Exploitation',
      tools: 'curl / manual HTTP — two unauthenticated GET requests',
      body: '<p>Two scoped exploitation attempts against the strongest leads: <strong>GET /server-status</strong> held at 403; <strong>GET /</strong> returned 200 with a live directory listing — <strong>CWE-548</strong>, the engagement’s primary finding (F1). Any future file drop — backup archive, source, credentials — would be exposed to anonymous enumeration.</p>' },
    { name: 'Phase 04 — Post-Exploitation',
      tools: 'LinPEAS (PEASS-ng v0.2.0) — scoped to /home/, halted pre-token-harvest',
      body: '<p>Authenticated local enumeration closed the picture: an over-privileged sudo account with no command restrictions (F6) and services irrelevant to the web stack — snapd, ModemManager — widening the attack surface (F7). Scope discipline: the run was halted before the API-key harvesting phase.</p>' },
    { name: 'Phase 05 — Reporting',
      tools: 'OWASP risk scoring · ISO/IEC 27002:2022 · CIS Apache 2.4 Benchmark v1.4.0',
      body: '<p>Seven findings, each severity-rated by qualitative likelihood × impact and mapped to a concrete countermeasure. Evidence: 24 files (4.1 MiB), every artefact SHA-256 hashed, dual session logs — a defensible chain from first packet to final report.</p>' }
  ];
  var LABELS = ['Recon', 'Enumeration', 'Exploitation', 'Post-Exploitation', 'Reporting'];

  var style = document.createElement('style');
  style.textContent =
    '#spectre-component .timeline-hint{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);margin:0.5rem 0 0.75rem;}' +
    '#spectre-component .timeline{display:flex;flex-wrap:wrap;gap:0.5rem;margin-bottom:0.75rem;}' +
    '#spectre-component .tl-node{display:flex;align-items:center;gap:0.5rem;background:var(--surface);border:1px solid var(--border);padding:0.5rem 0.9rem;cursor:pointer;font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);}' +
    '#spectre-component .tl-node:hover{border-color:var(--border-bright);color:var(--text);}' +
    '#spectre-component .tl-node.active{border-color:var(--accent2);color:var(--text-bright);}' +
    '#spectre-component .tl-dot{color:var(--accent2);}' +
    '#spectre-component .tl-panel{background:var(--surface);border:1px solid var(--border);border-left:3px solid var(--accent2);padding:1rem 1.25rem;font-size:0.85rem;}' +
    '#spectre-component .tl-phase{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.2em;text-transform:uppercase;color:var(--accent2);display:block;margin-bottom:0.25rem;}' +
    '#spectre-component .tl-tools{font-family:var(--font-mono);font-size:0.62rem;color:var(--muted);display:block;margin-bottom:0.6rem;}' +
    '#spectre-component .tl-panel p{margin-bottom:0.6rem;}#spectre-component .tl-panel p:last-child{margin-bottom:0;}';
  document.head.appendChild(style);

  mount.innerHTML =
    '<p class="timeline-hint">// Interactive — click a phase to expand its tools and findings</p>' +
    '<div class="timeline" role="tablist" aria-label="Pentest phases"></div>' +
    '<div class="tl-panel" aria-live="polite"><span class="tl-phase"></span><span class="tl-tools"></span><div class="tl-body"></div></div>';

  var bar = mount.querySelector('.timeline');
  var elPhase = mount.querySelector('.tl-phase');
  var elTools = mount.querySelector('.tl-tools');
  var elBody = mount.querySelector('.tl-body');
  var nodes = [];

  function select(i) {
    nodes.forEach(function (n, j) {
      n.classList.toggle('active', i === j);
      n.setAttribute('aria-selected', i === j ? 'true' : 'false');
    });
    elPhase.textContent = PHASES[i].name;
    elTools.textContent = PHASES[i].tools;
    elBody.innerHTML = PHASES[i].body;
  }

  LABELS.forEach(function (label, i) {
    var btn = document.createElement('button');
    btn.className = 'tl-node';
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-selected', 'false');
    btn.innerHTML = '<span class="tl-dot">0' + (i + 1) + '</span><span class="tl-label">' + label + '</span>';
    btn.addEventListener('click', function () { select(i); });
    bar.appendChild(btn);
    nodes.push(btn);
  });
  select(0);

  /* hide the static fallback ordered list that follows the mount */
  var sib = mount.nextElementSibling;
  while (sib && sib.tagName !== 'OL') sib = sib.nextElementSibling;
  if (sib) sib.style.display = 'none';
})();
