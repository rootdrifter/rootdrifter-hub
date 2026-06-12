/* GAUNTLET coverage radar — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, generates the hexagonal radar SVG from embedded
   scores (identical geometry to the static spec page: centre 150,150, max radius 105),
   mounts into #gauntlet-component. The static score table below the mount stays visible —
   it carries the per-axis evidence. Scores: gauntlet/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('gauntlet-component');
  if (!mount) return;

  /* [label, score out of 5, label anchor] — axes clockwise from the top */
  var AXES = [
    ['WEB', 3.5, 'middle'],
    ['NETWORK', 4, 'start'],
    ['CRYPTO', 1, 'start'],
    ['FORENSICS', 0.5, 'middle'],
    ['PWN', 0.5, 'end'],
    ['PRIVESC', 3.5, 'end']
  ];
  var CX = 150, CY = 150, R = 105;

  function pt(i, r) {
    var ang = (Math.PI / 180) * (-90 + i * 60);
    return [(CX + r * Math.cos(ang)).toFixed(1), (CY + r * Math.sin(ang)).toFixed(1)];
  }
  function ring(r) {
    return AXES.map(function (_, i) { return pt(i, r).join(','); }).join(' ');
  }

  var style = document.createElement('style');
  style.textContent =
    '#gauntlet-component .radar-wrap{display:grid;grid-template-columns:300px 1fr;gap:1.5rem;align-items:center;background:var(--surface);border:1px solid var(--border);padding:1.25rem;margin:1.25rem 0;}' +
    '@media (max-width:768px){#gauntlet-component .radar-wrap{grid-template-columns:1fr;}}' +
    '#gauntlet-component .radar-svg{width:100%;max-width:300px;}' +
    '#gauntlet-component .radar-grid-line{fill:none;stroke:var(--border);stroke-width:1;}' +
    '#gauntlet-component .radar-axis{stroke:var(--border-bright);stroke-width:1;}' +
    '#gauntlet-component .radar-shape{fill:rgba(0,255,136,0.12);stroke:var(--green);stroke-width:1.5;opacity:0;transition:opacity 0.9s ease;}' +
    '#gauntlet-component .radar-shape.in{opacity:1;}' +
    '#gauntlet-component .radar-dot{fill:var(--green);}' +
    '#gauntlet-component .radar-label{font-family:var(--font-mono);font-size:11px;fill:var(--muted);letter-spacing:0.1em;}' +
    '#gauntlet-component .rn-title{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--green);display:block;margin-bottom:0.5rem;}' +
    '#gauntlet-component .radar-notes p{font-size:0.78rem;color:var(--muted);margin:0.5rem 0 0;}';
  document.head.appendChild(style);

  var svg = '<svg class="radar-svg" viewBox="0 0 300 300" role="img" aria-label="Radar chart of CTF category coverage: web 3 of 5, network 4, crypto 1, forensics 0.5, pwn 0.5, privilege escalation 3.5">';
  [1, 2, 3, 4, 5].forEach(function (lvl) {
    svg += '<polygon class="radar-grid-line" points="' + ring(R * lvl / 5) + '"/>';
  });
  AXES.forEach(function (_, i) {
    var p = pt(i, R);
    svg += '<line class="radar-axis" x1="' + CX + '" y1="' + CY + '" x2="' + p[0] + '" y2="' + p[1] + '"/>';
  });
  var shapePts = AXES.map(function (a, i) { return pt(i, R * a[1] / 5).join(','); }).join(' ');
  svg += '<polygon class="radar-shape" points="' + shapePts + '"/>';
  AXES.forEach(function (a, i) {
    var p = pt(i, R * a[1] / 5);
    svg += '<circle class="radar-dot" cx="' + p[0] + '" cy="' + p[1] + '" r="3"/>';
  });
  AXES.forEach(function (a, i) {
    var p = pt(i, R + 22);
    svg += '<text class="radar-label" x="' + p[0] + '" y="' + p[1] + '" text-anchor="' + a[2] + '">' + a[0] + '</text>';
  });
  svg += '</svg>';

  mount.innerHTML =
    '<div class="radar-wrap">' + svg +
    '<div class="radar-notes"><span class="rn-title">// What the seven stubs actually cover</span>' +
    '<p>Scores reflect the current stub set, not aspiration — per-axis evidence in the table below. The low axes are the practice roadmap; the chart gets redrawn as entries land.</p>' +
    '</div></div>';

  var shape = mount.querySelector('.radar-shape');
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    shape.style.transition = 'none';
    shape.classList.add('in');
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { shape.classList.add('in'); io.disconnect(); }
      });
    }, { threshold: 0.4 });
    io.observe(mount);
  }
})();
