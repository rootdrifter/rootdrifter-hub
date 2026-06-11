/* Table of contents — built client-side for posts with 3+ h2/h3 headings.
   Skipped on teaser-gated posts (preview content carries .post-content-preview).
   Desktop (>1200px): open sticky panel in the right margin. Mobile: collapsed <details>. */
(function () {
  'use strict';
  var content = document.querySelector('.post-content');
  if (!content || content.classList.contains('post-content-preview')) return;
  var heads = content.querySelectorAll('h2, h3');
  if (heads.length < 3) return;

  var details = document.createElement('details');
  details.className = 'toc';
  if (window.matchMedia('(min-width: 1201px)').matches) details.open = true;

  var summary = document.createElement('summary');
  summary.textContent = '// CONTENTS';
  details.appendChild(summary);

  var ol = document.createElement('ol');
  heads.forEach(function (h, i) {
    /* Ghost ids headings in rendered content; fall back to a slug if one is missing */
    if (!h.id) h.id = 'sec-' + (i + 1) + '-' + h.textContent.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '');
    var li = document.createElement('li');
    li.className = 'toc-' + h.tagName.toLowerCase();
    var a = document.createElement('a');
    a.href = '#' + h.id;
    a.textContent = h.textContent;
    li.appendChild(a);
    ol.appendChild(li);
  });
  details.appendChild(ol);
  content.parentNode.insertBefore(details, content);
})();
