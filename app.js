(function () {
'use strict';
const W = window.WATCHES, D = window.Draw, view = document.getElementById('view');
const ROM = ['I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const name = w => `${w.brand} ${w.model}` + (w.ref !== '—' ? `, ref. ${w.ref}` : '');
const pad = n => String(n).padStart(2, '0');

/* ---------- the clock: every hand on the page follows the visitor's system time ---------- */
let lastSec = -1;
const ARRIVED = performance.now();
function tick() {
  const now = new Date(), ms = now.getMilliseconds(), s = now.getSeconds(), m = now.getMinutes(), h = now.getHours();
  const t = s + ms / 1000, mA = (m + t / 60) * 6, hA = ((h % 12) + m / 60 + t / 3600) * 30;
  document.querySelectorAll('[data-hand]').forEach(el => {
    const k = el.dataset.hand; let a;
    if (k === 'h') a = hA; else if (k === 'm') a = mA;
    else { const b = +el.dataset.bps; a = (b ? Math.floor(t * b) / b : t) * 6; }
    el.setAttribute('transform', `rotate(${a.toFixed(2)})`);
  });
  if (s !== lastSec) {
    lastSec = s;
    const txt = `${pad(h)}:${pad(m)}:${pad(s)}`;
    document.querySelectorAll('[data-clock]').forEach(el => { el.textContent = txt; });
    document.querySelectorAll('[data-date]').forEach(el => { el.textContent = now.getDate(); });
    document.querySelectorAll('[data-daydate]').forEach(el => { el.textContent = `${DAYS[now.getDay()]} ${now.getDate()}`; });
    const gone = h * 3600 + m * 60 + s, bar = document.querySelector('[data-day-bar]');
    if (bar) { bar.style.width = (gone / 864).toFixed(2) + '%'; document.querySelector('[data-day-gone]').textContent = gone.toLocaleString('en-US'); document.querySelector('[data-day-left]').textContent = (86400 - gone).toLocaleString('en-US'); }
  }
  const beats = document.querySelector('[data-beats]');
  if (beats) beats.textContent = Math.floor((performance.now() - ARRIVED) / 200).toLocaleString('en-US'); // 18,000 A/h is five beats a second
  requestAnimationFrame(tick);
}
const refresh = () => { lastSec = -1; };

/* ---------- the plate ---------- */
function specRows(w) {
  const c = w.c, mv = w.mv, r = [];
  r.push(['Reference', w.ref === '—' ? 'Various' : w.ref], ['Introduced', w.year], ['Production', w.span], ['Type', w.kind]);
  const ap = c.da ? '≈ ' : '';
  r.push(['Case', c.d ? `${ap}${c.d} mm` : `${ap}${c.w} × ${c.h} mm`]);
  r.push(['Thickness', c.t[1] === 'v' ? `${c.t[0]} mm` : c.t[1] === 'a' ? `≈ ${c.t[0]} mm` : 'Not verified; profile drawn indicatively']);
  if (c.lug) r.push(['Lug width', c.lug[1] === 'n' ? 'Not verified' : `${c.lug[1] === 'a' ? '≈ ' : ''}${c.lug[0]} mm`]);
  r.push(['Calibre', mv.cal.charAt(0).toUpperCase() + mv.cal.slice(1)], ['Drive', mv.wind]);
  if (mv.vph) r.push(['Frequency', `${mv.vph.toLocaleString('en-US')} A/h (${mv.vph / 7200} Hz)`]);
  if (mv.jewels) r.push(['Jewels', mv.jewels]);
  if (mv.size) r.push(['Movement size', mv.size]);
  return r.concat(w.specs);
}

const box = svg => `<div class="figbox">${svg}<button type="button" class="zbtn" aria-label="Enlarge this figure">Enlarge</button></div>`;

function sheet(w) {
  const idx = W.indexOf(w), ex = D.exploded(w);
  const rows = specRows(w).map(([a, b]) => `<tr><th>${a}</th><td>${b}</td></tr>`).join('');
  return `
<article class="sheet">
  <header class="sheet-head">
    <p class="plate-no">Plate ${ROM[idx]}</p>
    <h2>${w.brand} <em>${w.model}</em></h2>
    <p class="sub">${w.ref !== '—' ? `Ref. ${w.ref} · ` : ''}${w.year} · ${w.kind}</p>
  </header>
  <div class="figs">
    <figure class="f1">${box(D.front(w, { dims: true }))}<figcaption><b>Fig. 1</b> Front elevation. Hands set to your local time, <span data-clock></span>.</figcaption></figure>
    <figure class="f2">${box(D.side(w))}<figcaption><b>Fig. 2</b> Profile${w.crown.pos === 9 ? ', seen from the pusher flank; the crown is on the far side' : w.crown.pos ? ', crown side' : '. No crown on the flank'}.</figcaption></figure>
    <figure class="f3">${box(D.rear(w))}<figcaption><b>Fig. 3</b> Caseback. ${w.back.note}</figcaption></figure>
    <figure class="f4">${box(ex.svg)}<figcaption><b>Fig. 4</b> Exploded assembly.</figcaption><ol class="parts">${ex.parts.map(p => `<li>${p}</li>`).join('')}</ol></figure>
    <figure class="f5">${box(D.movement(w))}<figcaption><b>Fig. 5</b> Movement, ${/^not /.test(w.mv.cal) ? 'calibre ' + w.mv.cal : 'cal. ' + w.mv.cal}. Schematic of the principal organs only.${w.mv.note ? ' ' + w.mv.note : ''}</figcaption></figure>
  </div>
  <div class="sheet-text">
    <table class="spec"><caption>Particulars <span>dimensions in millimetres</span></caption>${rows}</table>
    <div class="notes"><h3>Notes</h3>${w.notes.map(n => `<p>${n}</p>`).join('')}</div>
  </div>
  <footer class="title-block">
    <div><span>Subject</span>${w.brand} ${w.model}</div>
    <div><span>Sheet</span>${ROM[idx]} / XX</div>
    <div><span>Status</span>Modern interpretive drawing</div>
    <p>Drawn from published specifications. This is not a manufacturer’s document and the movement figure is a schematic. “≈” marks an approximate figure; “n.v.” one that could not be verified and is left out.</p>
  </footer>
</article>`;
}

/* ---------- examination ---------- */
const exam = { order: null, i: 0, marks: 0 };
function startExam() { exam.order = shuffle(W); exam.i = 0; exam.marks = 0; }

function identOptions(w) {
  const others = W.filter(x => x !== w).map(x => ({ x, k: (x.kind === w.kind ? 0 : 1) + Math.random() * 1.2 })).sort((a, b) => a.k - b.k).slice(0, 3).map(o => o.x);
  return shuffle([w].concat(others));
}

function renderExam() {
  if (!exam.order) startExam();
  if (exam.i >= exam.order.length) return renderResult();
  const w = exam.order[exam.i], n = exam.i + 1;
  view.innerHTML = `
<div class="prog" role="progressbar" aria-label="Examination progress" aria-valuemin="0" aria-valuemax="${exam.order.length}" aria-valuenow="${exam.i}"><i style="width:${exam.i / exam.order.length * 100}%"></i></div>
<section class="exam">
  <div class="exam-plate">
    <div class="frame" id="specimen">${D.front(w, { redact: true })}</div>
    <p class="cap">Specimen ${ROM[exam.i]} of XX · your time, <span data-clock></span></p>
  </div>
  <div class="exam-panel">
    <p class="eyebrow">Examination · ${n} of ${exam.order.length}</p>
    <div class="q" id="q1">
      <h2>Which watch is on the bench?</h2>
      <p class="hint">The signature has been masked. Read the case, the dial and the way the hands move.</p>
      <div class="opts">${identOptions(w).map(o => `<button type="button" data-id="${o.id}">${o.brand} <em>${o.model}</em>${o.ref !== '—' ? ` <small>${o.ref}</small>` : ''}</button>`).join('')}</div>
      <p class="verdict" aria-live="polite"></p>
    </div>
    <div class="q" id="q2" hidden>
      <h2>${w.q.t}</h2>
      <div class="opts">${shuffle([w.q.a].concat(w.q.w)).map(o => `<button type="button">${o}</button>`).join('')}</div>
      <p class="verdict" aria-live="polite"></p>
    </div>
    <div class="exam-foot">
      <p class="marks">Marks <b id="marks">${exam.marks}</b> / ${exam.i * 2}</p>
      <button type="button" class="next" id="next" hidden>${n === exam.order.length ? 'See the result' : 'Next specimen'}</button>
    </div>
  </div>
</section>
<div id="reveal"></div>`;
  const q1 = view.querySelector('#q1'), q2 = view.querySelector('#q2');
  const lock = (q, right) => { q.classList.add('done'); q.querySelectorAll('.opts button').forEach(b => { b.disabled = true; if (right(b)) b.classList.add('right'); }); };
  const bring = el => requestAnimationFrame(() => el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
  const marks = extra => { view.querySelector('.marks').innerHTML = `Marks <b>${exam.marks}</b> / ${exam.i * 2 + extra}`; view.querySelector('.prog i').style.width = `${(exam.i + extra / 2) / exam.order.length * 100}%`; };
  q1.querySelector('.opts').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const ok = b.dataset.id === w.id; if (ok) exam.marks++; else b.classList.add('wrong');
    lock(q1, x => x.dataset.id === w.id);
    q1.querySelector('.verdict').textContent = ok ? `Correct. ${name(w)}.` : `It is the ${name(w)}.`;
    q1.querySelector('.verdict').classList.add(ok ? 'ok' : 'no');
    view.querySelector('.cap').innerHTML = `<b>${w.brand} ${w.model}</b> · your time, <span data-clock></span>`;
    view.querySelector('#specimen').innerHTML = D.front(w, {});
    q2.hidden = false; marks(1); refresh(); bring(matchMedia('(max-width: 900px)').matches ? q1 : q2);
  });
  q2.querySelector('.opts').addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b || b.disabled) return;
    const ok = b.textContent === w.q.a; if (ok) exam.marks++; else b.classList.add('wrong');
    lock(q2, x => x.textContent === w.q.a);
    q2.querySelector('.verdict').textContent = ok ? 'Correct.' : `The answer: ${w.q.a}.`;
    q2.querySelector('.verdict').classList.add(ok ? 'ok' : 'no');
    marks(2);
    view.querySelector('#reveal').innerHTML = `<p class="reveal-rule">The plate</p>` + sheet(w);
    const nx = view.querySelector('#next'); nx.hidden = false; nx.closest('.exam-foot').classList.add('ready'); nx.focus({ preventScroll: true }); refresh(); bring(q2);
  });
  view.querySelector('#next').addEventListener('click', () => { exam.i++; renderExam(); window.scrollTo(0, 0); });
  refresh();
}

function renderResult() {
  const total = exam.order.length * 2, m = exam.marks, p = m / total;
  const [rank, line] = p >= 0.9 ? ['Maître horloger', 'You could sign the dial yourself.']
    : p >= 0.7 ? ['Watchmaker', 'A steady hand and a good eye. A few references still to learn.']
    : p >= 0.45 ? ['Journeyman', 'You know the famous shapes. The archive will fill in the rest.']
    : ['Apprentice', 'Everyone starts at the bench with a loupe and a lot of questions.'];
  let best = m; try { best = Math.max(m, +localStorage.getItem('archive-best') || 0); localStorage.setItem('archive-best', best); } catch (e) {}
  view.innerHTML = `
<section class="result">
  <p class="eyebrow">Examination complete</p>
  <h2>${rank}</h2>
  <p class="score">${m} <span>of ${total} marks</span></p>
  <p>${line}</p>
  <p class="best">Best sitting on this device: ${best} of ${total}.</p>
  <div class="row"><button type="button" class="next" id="again">Sit it again</button><a class="ghost" href="#/archive">Browse the archive</a></div>
</section>`;
  view.querySelector('#again').addEventListener('click', () => { startExam(); renderExam(); });
}

/* ---------- archive ---------- */
function renderArchive() {
  view.innerHTML = `
<section class="archive">
  <header class="intro"><p class="eyebrow">The collection</p><h2>Twenty plates</h2><p>Dress watches, chronographs, divers and a few machines that fit no category. Every one is keeping your time.</p></header>
  <div class="grid">${W.map((w, i) => `<a class="card" href="#/plate/${w.id}"><div class="thumb">${D.front(w, {})}</div><p class="no">${ROM[i]}</p><h3>${w.brand}</h3><p class="m">${w.model}</p><p class="y">${w.year}</p></a>`).join('')}</div>
</section>`;
  refresh();
}

function renderPlate(id) {
  const i = W.findIndex(w => w.id === id); if (i < 0) return renderArchive();
  const prev = W[(i + W.length - 1) % W.length], next = W[(i + 1) % W.length];
  view.innerHTML = `<nav class="pager"><a href="#/plate/${prev.id}">← ${prev.brand} ${prev.model}</a><a href="#/archive">All plates</a><a href="#/plate/${next.id}">${next.brand} ${next.model} →</a></nav>` + sheet(W[i]);
  refresh();
}

/* ---------- home ---------- */
const ERAS = [['1500s', '#15100b', '#d0a857'], ['1700s', '#f4ecdb', '#1c2f4f'], ['1800s', '#e8e2d2', '#151515'], ['1900', '#0e0e0f', '#c9a44c'], ['1940', '#383e2e', '#f0b24a'], ['1970', '#050507', '#ff3b30'], ['Today', '#f8f8f5', '#191919']];
function renderHome() {
  const by = id => W.find(w => w.id === id), omega = by('speedy105003');
  view.innerHTML = `
<section class="home">
  <div class="h-hero">
    <div class="h-words">
      <p class="h-eyebrow">The Horological Archive</p>
      <h1>The art, engineering and history of timekeeping.</h1>
      <p>Explore the remarkable world of mechanical watchmaking through interactive examinations, detailed technical illustrations and historical research.</p>
      <p>From the architecture of a movement to the smallest details of a case, dial and complication, discover what makes each timepiece extraordinary.</p>
      <p class="h-motto">Look closer. Understand more.</p>
      <a class="h-btn" href="#/archive">Explore the archive</a>
    </div>
    <figure class="h-watch">${D.front(omega, {})}<figcaption>Omega Speedmaster, ref. 105.003, 1964. It is keeping your time.</figcaption></figure>
  </div>

  <div class="h-now" aria-label="Your time today">
    <p class="h-now-t"><span>Your time</span><b data-clock>00:00:00</b></p>
    <div class="h-day" role="img" aria-label="How much of today has passed"><i data-day-bar></i></div>
    <p class="h-now-s"><span><b data-day-gone>0</b> seconds of today spent</span><span><b data-day-left>0</b> left</span></p>
  </div>

  <div class="h-beyond">
    <h2>Beyond the dial.</h2>
    <div>
      <p>A watch is more than an instrument for measuring time. It is an expression of engineering, craftsmanship, design and human ingenuity.</p>
      <p>The Horological Archive brings these elements together in an evolving collection of interactive watch examinations and historical documentation.</p>
    </div>
  </div>

  <div class="h-previews">
    <article class="h-card c1">
      <a class="h-art mv" href="workbench.html" aria-label="Open the workbench">${D.movement(omega)}</a>
      <div class="h-txt"><h3>Examine the details.</h3><p>Explore individual components, understand how mechanisms work and discover the engineering behind iconic timepieces.</p>
        <p class="h-links"><a class="h-go" href="workbench.html">Open the workbench</a><a class="h-go" href="#/exam">Sit the examination</a></p></div>
    </article>
    <article class="h-card c2">
      <a class="h-art four" href="#/archive" aria-label="Browse the archive">${['tanklc', 'royaloak', 'ventura', 'spaceview'].map(id => D.front(by(id), {})).join('')}</a>
      <div class="h-txt"><h3>Explore the archive.</h3><p>Discover watches through their specifications, technical characteristics and historical significance.</p>
        <p class="h-links"><a class="h-go" href="#/archive">Browse the plates</a></p></div>
    </article>
    <article class="h-card c3">
      <a class="h-art eras" href="history.html" aria-label="Read the history">${ERAS.map(e => `<i style="background:${e[1]};color:${e[2]}"><b>${e[0]}</b></i>`).join('')}</a>
      <div class="h-txt"><h3>Understand the history.</h3><p>Follow the evolution of watchmaking, its innovations, its influential designs and the people behind them.</p>
        <p class="h-links"><a class="h-go" href="history.html">Read the history</a></p></div>
    </article>
  </div>

  <div class="h-close">
    <h2>A closer examination of horology.</h2>
    <p>An independent exploration of the watches, mechanisms and innovations that have shaped the history of timekeeping.</p>
  </div>
</section>`;
  refresh();
}

function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'home', [a, b] = h.split('/');
  document.querySelectorAll('.nav a').forEach(el => el.classList.toggle('on', el.dataset.r === (a === 'plate' ? 'archive' : a)));
  if (a === 'archive') renderArchive(); else if (a === 'plate') renderPlate(b); else if (a === 'exam') renderExam(); else renderHome();
  window.scrollTo(0, 0);
}
/* ---------- figure viewer ---------- */
const zoom = document.getElementById('zoom'), zwrap = zoom.querySelector('.zwrap'); let zw = 0;
const zset = w => { const svg = zwrap.firstElementChild; if (!svg) return; const cx = (zwrap.scrollLeft + zwrap.clientWidth / 2) / zwrap.scrollWidth, cy = (zwrap.scrollTop + zwrap.clientHeight / 2) / zwrap.scrollHeight; zw = Math.max(280, Math.min(w, 3200)); svg.style.width = zw + 'px'; zwrap.scrollLeft = cx * zwrap.scrollWidth - zwrap.clientWidth / 2; zwrap.scrollTop = cy * zwrap.scrollHeight - zwrap.clientHeight / 2; };
view.addEventListener('click', e => {
  const b = e.target.closest('.figbox'); if (!b) return;
  const fig = b.closest('figure'), cap = fig.querySelector('figcaption b');
  zwrap.innerHTML = ''; zwrap.appendChild(b.querySelector('svg').cloneNode(true));
  zoom.querySelector('.ztitle').textContent = cap ? cap.textContent : '';
  zoom.showModal(); zw = 0; zwrap.firstElementChild.style.width = Math.max(zwrap.clientWidth * 1.6, 620) + 'px';
  zwrap.scrollLeft = (zwrap.scrollWidth - zwrap.clientWidth) / 2; zwrap.scrollTop = (zwrap.scrollHeight - zwrap.clientHeight) / 2; refresh();
});
zoom.addEventListener('click', e => {
  const z = e.target.closest('[data-z]');
  if (z) { const cur = zwrap.firstElementChild.getBoundingClientRect().width; if (z.dataset.z === 'close') zoom.close(); else zset(cur * (z.dataset.z === 'in' ? 1.4 : 1 / 1.4)); }
  else if (e.target === zoom) zoom.close();
});
zoom.addEventListener('close', () => { zwrap.innerHTML = ''; });
window.addEventListener('hashchange', () => { if (zoom.open) zoom.close(); });
window.addEventListener('hashchange', route);
route();
requestAnimationFrame(tick);
})();
