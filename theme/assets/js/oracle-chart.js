/* ORACLE model-comparison chart — interactive component for the Ghost portfolio page.
   Self-contained: injects scoped styles, builds the accuracy/F1 toggle chart from embedded
   data, mounts into #oracle-component. The static comparison table below the mount stays
   visible — it carries detail (architectures) the chart does not duplicate.
   Figures are fixed research results — never altered:
   ResNet-18 99.11% acc / 0.9916 F1; TerraCNN 93.97% acc / 0.9390 F1;
   RF ~0.94 F1; SVM ~0.90 F1 (accuracy not reported for classical baselines).
   Data parity: oracle/docs/index.html rev 2026-06-10. */
(function () {
  'use strict';
  var mount = document.getElementById('oracle-component');
  if (!mount) return;

  var DATA = {
    acc: {
      rows: [
        { m: 'ResNet-18 (transfer)', v: 99.11, label: '99.11%', best: true },
        { m: 'TerraCNN (scratch)',   v: 93.97, label: '93.97%' }
      ],
      note: 'Test accuracy on the held-out split. Accuracy was not reported for the classical baselines — switch to F₁ macro to compare all four models.'
    },
    f1: {
      rows: [
        { m: 'ResNet-18 (transfer)', v: 99.16, label: '0.9916', best: true },
        { m: 'TerraCNN (scratch)',   v: 93.90, label: '0.9390' },
        { m: 'Random Forest',        v: 94.0,  label: '~0.94', approx: true },
        { m: 'SVM (RBF)',            v: 90.0,  label: '~0.90', approx: true }
      ],
      note: 'Macro-averaged F₁ — equal weight to all four classes regardless of frequency, the metric that matters when the rare class is the one you must not miss. ~ values are reported to two significant figures.'
    }
  };

  var style = document.createElement('style');
  style.textContent =
    '#oracle-component .chart-wrap{background:var(--surface);border:1px solid var(--border);padding:1rem 1.25rem;margin:1rem 0;}' +
    '#oracle-component .chart-head{display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap;margin-bottom:0.8rem;}' +
    '#oracle-component .chart-title{font-family:var(--font-mono);font-size:0.62rem;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted);}' +
    '#oracle-component .chart-toggle button{font-family:var(--font-mono);font-size:0.6rem;letter-spacing:0.12em;text-transform:uppercase;background:none;border:1px solid var(--border-bright);color:var(--muted);padding:0.25rem 0.7rem;cursor:pointer;}' +
    '#oracle-component .chart-toggle button.on{color:var(--accent);border-color:var(--accent);}' +
    '#oracle-component .chart-row{display:grid;grid-template-columns:11rem 1fr 4.5rem;align-items:center;gap:0.8rem;margin-bottom:0.55rem;}' +
    '#oracle-component .chart-model{font-family:var(--font-mono);font-size:0.65rem;color:var(--text);}' +
    '#oracle-component .chart-track{background:var(--code-bg);border:1px solid var(--border);height:0.9rem;}' +
    '#oracle-component .chart-fill{height:100%;width:0;background:var(--muted);transition:width 0.8s ease;}' +
    '#oracle-component .chart-row.best .chart-fill{background:var(--accent);}' +
    '#oracle-component .chart-row.approx .chart-fill{opacity:0.55;}' +
    '#oracle-component .chart-value{font-family:var(--font-mono);font-size:0.68rem;color:var(--text-bright);text-align:right;}' +
    '#oracle-component .chart-note{font-size:0.78rem;color:var(--muted);margin:0.6rem 0 0;}' +
    '@media (max-width:640px){#oracle-component .chart-row{grid-template-columns:1fr;gap:0.25rem;}#oracle-component .chart-value{text-align:left;}}';
  document.head.appendChild(style);

  mount.innerHTML =
    '<div class="chart-wrap">' +
    '<div class="chart-head"><span class="chart-title">// Interactive — model comparison, identical stratified splits</span>' +
    '<div class="chart-toggle" role="group" aria-label="Metric view">' +
    '<button class="btn-acc on" aria-pressed="true">Accuracy</button>' +
    '<button class="btn-f1" aria-pressed="false">F₁ macro</button>' +
    '</div></div><div class="chart-rows"></div><p class="chart-note"></p></div>';

  var rowsEl = mount.querySelector('.chart-rows');
  var noteEl = mount.querySelector('.chart-note');
  var btnAcc = mount.querySelector('.btn-acc');
  var btnF1 = mount.querySelector('.btn-f1');

  function render(key) {
    var d = DATA[key];
    rowsEl.innerHTML = '';
    d.rows.forEach(function (r) {
      var row = document.createElement('div');
      row.className = 'chart-row' + (r.best ? ' best' : '') + (r.approx ? ' approx' : '');
      row.innerHTML = '<span class="chart-model">' + r.m + '</span>' +
        '<div class="chart-track"><div class="chart-fill"></div></div>' +
        '<span class="chart-value">' + r.label + '</span>';
      rowsEl.appendChild(row);
    });
    noteEl.textContent = d.note;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        rowsEl.querySelectorAll('.chart-fill').forEach(function (f, i) {
          f.style.width = d.rows[i].v + '%';
        });
      });
    });
    btnAcc.classList.toggle('on', key === 'acc');
    btnF1.classList.toggle('on', key === 'f1');
    btnAcc.setAttribute('aria-pressed', key === 'acc' ? 'true' : 'false');
    btnF1.setAttribute('aria-pressed', key === 'f1' ? 'true' : 'false');
  }
  btnAcc.addEventListener('click', function () { render('acc'); });
  btnF1.addEventListener('click', function () { render('f1'); });
  render('acc');
})();
