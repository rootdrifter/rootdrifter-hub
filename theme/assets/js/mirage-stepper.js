/* MIRAGE causal-vs-correlational stepper — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds the 4-step explainer from embedded data
   (verbatim from the static spec page), mounts into #mirage-component and hides the static
   fallback ordered list. Data parity: mirage/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('mirage-component');
  if (!mount) return;

  var STEPS = [
    { label: 'Step 1 — the original phishing email',
      email: 'Subject: <mark>URGENT</mark> — verify your account within 24 hours',
      desc: 'A classic pressure email: a high-weight lexical token plus a deadline.',
      corr: { flag: true, why: 'FLAGGED — the token “URGENT” co-occurs with phishing across the training corpus; the lexical feature fires.' },
      caus: { flag: true, why: 'FLAGGED — the urgency → deception → compliance chain is detected at the construct level, not the token level.' } },
    { label: 'Step 2 — adversarial paraphrase',
      email: 'Subject: <mark>Time-sensitive</mark> — your account requires review today',
      desc: 'The attacker rewrites the surface. The token is gone; the pressure mechanism is identical.',
      corr: { flag: false, why: 'MISSED — the learned token disappeared. Correlational features live and die with the exact surface form.' },
      caus: { flag: true, why: 'FLAGGED — urgency is still doing the causal work on the recipient; paraphrase cannot remove the mechanism without removing the pressure itself.' } },
    { label: 'Step 3 — channel shift',
      email: '☎ “This is your bank’s <mark>security team</mark> — we need to confirm your details <mark>right now</mark>.”',
      desc: 'The same manipulation moves from email to a phone call — authority plus urgency, no email features at all.',
      corr: { flag: false, why: 'MISSED — there is no email to score. A lexical email filter has nothing to evaluate when the attack changes channel.' },
      caus: { flag: true, why: 'FLAGGED — the constructs (authority, urgency) are channel-independent. The validated DAG models the manipulation, not the medium.' } },
    { label: 'Step 4 — why this is the research result',
      email: 'Urgency → Deception → Phishing &nbsp;·&nbsp; Authority → Deception → Phishing',
      desc: 'Surface features can always be rewritten; the causal driver cannot be removed without defeating the attack. That is exactly what the LLM benchmark measures: GPT-4 reconstructs 94.2% of the validated causal graph; DeepSeek-67B only 53.0% — the gap an adaptive adversary exploits.',
      corr: { flag: false, why: 'A detector built on co-occurrence is one paraphrase away from blind.' },
      caus: { flag: true, why: 'A detector built on validated causal structure survives paraphrase and channel shift — the property this research quantifies.' } }
  ];

  var style = document.createElement('style');
  style.textContent =
    '#mirage-component .stepper{background:var(--surface);border:1px solid var(--border);padding:1rem 1.25rem;margin:1.25rem 0;}' +
    '#mirage-component .stepper-head{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:0.8rem;}' +
    '#mirage-component .stepper-title{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);}' +
    '#mirage-component .step-dots{display:flex;gap:0.35rem;}' +
    '#mirage-component .step-dots span{width:0.5rem;height:0.5rem;border:1px solid var(--border-bright);display:inline-block;}' +
    '#mirage-component .step-dots span.on{background:var(--accent);border-color:var(--accent);}' +
    '#mirage-component .stage-label{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);display:block;margin-bottom:0.4rem;}' +
    '#mirage-component .email-line{display:block;font-family:var(--font-mono);font-size:0.8rem;color:var(--text-bright);background:var(--code-bg);border:1px solid var(--border);padding:0.6rem 0.9rem;margin-bottom:0.6rem;}' +
    '#mirage-component .email-line mark{background:none;color:var(--warn);}' +
    '#mirage-component .det-cols{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border-bright);border:1px solid var(--border-bright);margin:0.8rem 0;}' +
    '#mirage-component .det-col{background:var(--surface);padding:0.8rem 1rem;font-size:0.82rem;}' +
    '#mirage-component .det-name{font-family:var(--font-mono);font-size:0.58rem;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);display:block;margin-bottom:0.3rem;}' +
    '#mirage-component .det-verdict{font-family:var(--font-mono);font-size:0.65rem;letter-spacing:0.12em;text-transform:uppercase;display:block;margin-bottom:0.4rem;}' +
    '#mirage-component .det-verdict.flag{color:var(--green);}#mirage-component .det-verdict.miss{color:var(--accent2);}' +
    '#mirage-component .stepper-ctl{display:flex;gap:0.6rem;justify-content:flex-end;}' +
    '#mirage-component .stepper-ctl button{font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;background:none;border:1px solid var(--border-bright);color:var(--muted);padding:0.3rem 0.8rem;cursor:pointer;}' +
    '#mirage-component .stepper-ctl button:not(:disabled):hover{color:var(--accent);border-color:var(--accent);}' +
    '#mirage-component .stepper-ctl button:disabled{opacity:0.4;cursor:default;}' +
    '@media (max-width:640px){#mirage-component .det-cols{grid-template-columns:1fr;}}';
  document.head.appendChild(style);

  mount.innerHTML =
    '<div class="stepper">' +
    '<div class="stepper-head"><span class="stepper-title">// Interactive — why correlation breaks and causation holds</span><div class="step-dots" aria-hidden="true"></div></div>' +
    '<div class="step-stage"><span class="stage-label"></span><span class="email-line"></span><p class="stage-desc"></p></div>' +
    '<div class="det-cols">' +
    '<div class="det-col"><span class="det-name">Correlational detector</span><span class="det-verdict corr-verdict"></span><p class="corr-why"></p></div>' +
    '<div class="det-col"><span class="det-name">Causal detector</span><span class="det-verdict caus-verdict"></span><p class="caus-why"></p></div>' +
    '</div>' +
    '<div class="stepper-ctl"><button class="step-prev" aria-label="Previous step">← Prev</button><button class="step-next" aria-label="Next step">Next →</button></div>' +
    '</div>';

  var i = 0;
  var dots = mount.querySelector('.step-dots');
  STEPS.forEach(function () { dots.appendChild(document.createElement('span')); });
  var q = function (sel) { return mount.querySelector(sel); };

  function render() {
    var s = STEPS[i];
    q('.stage-label').textContent = s.label;
    q('.email-line').innerHTML = s.email;
    q('.stage-desc').textContent = s.desc;
    var cv = q('.corr-verdict'), uv = q('.caus-verdict');
    cv.textContent = s.corr.flag ? 'Flagged' : 'Missed';
    cv.className = 'det-verdict corr-verdict ' + (s.corr.flag ? 'flag' : 'miss');
    uv.textContent = s.caus.flag ? 'Flagged' : 'Missed';
    uv.className = 'det-verdict caus-verdict ' + (s.caus.flag ? 'flag' : 'miss');
    q('.corr-why').textContent = s.corr.why;
    q('.caus-why').textContent = s.caus.why;
    q('.step-prev').disabled = i === 0;
    q('.step-next').disabled = i === STEPS.length - 1;
    dots.querySelectorAll('span').forEach(function (d, j) { d.classList.toggle('on', j <= i); });
  }
  q('.step-prev').addEventListener('click', function () { if (i > 0) { i--; render(); } });
  q('.step-next').addEventListener('click', function () { if (i < STEPS.length - 1) { i++; render(); } });
  render();

  /* hide the static fallback: the bold intro line + ordered list that follow the mount */
  var sib = mount.nextElementSibling, hidden = 0;
  while (sib && hidden < 2) {
    if (sib.tagName === 'OL') { sib.style.display = 'none'; hidden = 2; }
    else if (sib.tagName === 'P' && /four-step argument/.test(sib.textContent)) { sib.style.display = 'none'; hidden++; }
    sib = sib.nextElementSibling;
  }
})();
