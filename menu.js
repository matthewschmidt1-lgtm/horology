/* Drop-down menus for the site header: each one lists the sections of the page its link leads to.
   With a mouse, pointing at a link opens its menu. On a touch screen, where there is nothing to point with, tapping the link of the page you are already on opens it;
   the other links go straight to their pages as before. One panel is shared by all the links and is placed under whichever one is in use.
   The lists are written out here, so a section that is added, renamed or removed has to be changed here too. */
(function () {
  'use strict';
  const nav = document.querySelector('.mast .nav');
  if (!nav) return;
  const MENUS = {
    'workbench.html': [
      ['Omega Speedmaster', '?watch=speedmaster-105003'], ['Rolex Submariner', '?watch=submariner-5513'], ['Patek Philippe Calatrava', '?watch=calatrava-96'],
      ['Zenith El Primero', '?watch=el-primero-a386'], ['Bulova Accutron', '?watch=accutron-spaceview'], ['Audemars Piguet Royal Oak', '?watch=royal-oak-5402'],
      ['Heuer Monaco', '?watch=monaco-1133b'], ['Cartier Tank', '?watch=tank-louis-cartier'], ['Rolex Daytona', '?watch=daytona-6263'], ['Seiko 62MAS', '?watch=seiko-62mas'], ['Heuer Carrera', '?watch=carrera-2447'], ['Rolex Explorer', '?watch=explorer-1016']
    ],
    'time.html': [
      ['The living solar clock', '#solar'], ['The rhythm of time', '#rhythm'], ['The anatomy of a second', '#second'], ['The sound of time', '#sound'],
      ['The cycles of time', '#cycles'], ['A universe of time', '#universe'], ['The present moment', '#present']
    ],
    'meaning.html': [
      ['What is time?', '#what'], ['A universe in motion', '#universe'], ['The human experience', '#human'], ['The present moment', '#present']
    ],
    'history.html': [
      ['Time leaves the tower', '#e1', '1500s – 1600s'], ['Ornament and ingenuity', '#e2', '1700s'], ['Precision by the thousand', '#e3', '1800s'],
      ['The watch moves to the wrist', '#e4', '1900 – 1930s'], ['The golden age', '#e5', '1940s – 1960s'], ['The quartz revolution', '#e6', '1970s – 1980s'],
      ['The mechanical renaissance', '#e7', '1990s – today']
    ]
  };
  const touch = matchMedia('(hover: none)').matches || navigator.maxTouchPoints > 0;
  if (touch) document.documentElement.classList.add('nav-touch');
  const panel = document.createElement('div');
  panel.className = 'nav-drop'; panel.id = 'nav-drop'; panel.hidden = true;
  document.body.appendChild(panel);
  let cur = null, since = 0, timer = 0;

  /* On the page itself a link is just its ending, so the page moves without reloading. From another page a watch is named after a #, because the live site
     drops anything after a ? when it tidies "workbench.html" into "/workbench". */
  const here = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  const link = (page, end) => here === page.replace(/\.html$/, '') ? end : page + end.replace(/^\?/, '#');
  const place = () => {
    const r = cur.getBoundingClientRect(), m = document.querySelector('.mast').getBoundingClientRect();
    const top = Math.max(r.bottom + 4, m.bottom);
    panel.style.top = top + 'px'; panel.style.maxHeight = Math.max(160, innerHeight - top - 10) + 'px'; panel.style.minWidth = Math.max(190, r.width) + 'px';
    panel.style.left = '0px';
    panel.style.left = Math.max(8, Math.min(r.left, document.documentElement.clientWidth - panel.offsetWidth - 8)) + 'px';
  };
  const open = a => {
    clearTimeout(timer);
    if (cur === a) return;
    if (cur) cur.setAttribute('aria-expanded', 'false');
    cur = a; since = Date.now();
    const page = a.dataset.menu;
    panel.innerHTML = MENUS[page].map(i => `<a href="${link(page, i[1])}">${i[2] ? `<small>${i[2]}</small>` : ''}<span>${i[0]}</span></a>`).join('');
    panel.hidden = false; a.setAttribute('aria-expanded', 'true'); place();
  };
  const close = () => { clearTimeout(timer); if (!cur) return; cur.setAttribute('aria-expanded', 'false'); cur = null; panel.hidden = true; };
  const later = () => { clearTimeout(timer); timer = setTimeout(close, 180); };

  nav.querySelectorAll('a').forEach(a => {
    const page = (a.getAttribute('href') || '').split(/[?#]/)[0];
    if (!MENUS[page]) return;
    a.dataset.menu = page; a.classList.add('has-drop'); a.setAttribute('aria-haspopup', 'true'); a.setAttribute('aria-expanded', 'false'); a.setAttribute('aria-controls', 'nav-drop');
    a.addEventListener('mouseenter', () => { if (matchMedia('(hover: hover)').matches) open(a); });
    a.addEventListener('mouseleave', later);
    a.addEventListener('click', e => { // on a touch screen, the link of the page you are on opens its sections
      if (!touch || !a.classList.contains('on')) return;
      e.preventDefault();
      if (cur === a && Date.now() - since > 350) close(); else open(a);
    });
    a.addEventListener('keydown', e => { if (e.key === 'ArrowDown') { e.preventDefault(); open(a); panel.querySelector('a').focus(); } });
  });
  panel.addEventListener('mouseenter', () => clearTimeout(timer));
  panel.addEventListener('mouseleave', later);
  panel.addEventListener('click', e => { if (e.target.closest('a')) setTimeout(close, 0); });
  panel.addEventListener('keydown', e => {
    const items = [...panel.querySelectorAll('a')], i = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { const a = cur; close(); if (a) a.focus(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); items[(i + 1) % items.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); items[(i + items.length - 1) % items.length].focus(); }
  });
  panel.addEventListener('focusout', e => { if (!panel.contains(e.relatedTarget)) later(); });
  document.addEventListener('click', e => { if (cur && !panel.contains(e.target) && !e.target.closest('.nav a')) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  addEventListener('scroll', () => { if (cur && Date.now() - since > 350) close(); }, { passive: true });
  addEventListener('resize', close);
})();
