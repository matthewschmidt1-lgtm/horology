/* The Scrolling History of Horology: drawings, layout and scroll behaviour.
   Content is in history-data.js. Archive watches are drawn by draw.js. */
(function () {
'use strict';
const HX = window.HX, W = window.WATCHES, D = window.Draw, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const f = n => Math.round(n * 100) / 100, R = Math.PI / 180;
const P = (a, r, cx = 0, cy = 0) => [f(cx + r * Math.sin(a * R)), f(cy - r * Math.cos(a * R))];
const C = (r, cx = 0, cy = 0, c = 'l') => `<circle class="${c}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
const L = (x1, y1, x2, y2, c = 'l') => `<line class="${c}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
const rad = (a, r1, r2, c = 't', cx = 0, cy = 0) => { const p = P(a, r1, cx, cy), q = P(a, r2, cx, cy); return L(p[0], p[1], q[0], q[1], c); };
const T = (s, x, y, sz, x2 = '') => `<text class="tx" x="${f(x)}" y="${f(y)}" font-size="${sz}" text-anchor="middle" ${x2}>${s}</text>`;
const RC = (x, y, w, h, c = 'p', rx = 0) => `<rect class="${c}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}"/>`;
const svg = (s, label) => `<svg class="fig" viewBox="-30 -40 60 80" role="img" aria-label="${label}">${s}</svg>`;
const hand = (k, d, bps) => `<g data-hand="${k}"${bps != null ? ` data-bps="${bps}"` : ''}>${d}</g>`;
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const strap = (hw, y0, y1) => { const b = `<path class="p" d="M${-hw},${y0}V${y1}C${-hw / 3},${y1 + 1.4} ${hw / 3},${y1 - 1.4} ${hw},${y1}V${y0}Z"/><path class="t dash" d="M${-hw + 0.9},${y0}V${y1 - 0.3}M${hw - 0.9},${y0}V${y1 + 0.3}"/>`; return b + `<g transform="scale(1,-1)">${b}</g>`; };
const pendant = (Rr, crown) => crown
  ? RC(-2.6, -Rr - 4.4, 5.2, 5, 'p', 0.8) + [-1.6, -0.5, 0.6, 1.7].map(x => L(x, -Rr - 4, x, -Rr - 0.6, 't')).join('') + `<circle class="l" cx="0" cy="${-Rr - 7}" r="4.2"/>`
  : RC(-1.6, -Rr - 3.6, 3.2, 4.2, 'p', 0.6) + `<circle class="l" cx="0" cy="${-Rr - 6.6}" r="3.4"/>`;

/* ----- illustrative reconstructions of watch types the archive does not hold ----- */
function drum() {
  const Rr = 24; let s = pendant(Rr) + C(Rr, 0, 0, 'p') + C(Rr - 1.4, 0, 0, 'l') + C(Rr - 6.4, 0, 0, 'l') + C(Rr - 14.5, 0, 0, 'l');
  for (let i = 0; i < 96; i++) s += rad(i * 3.75, Rr - 6.2, Rr - 1.6, 'hair');
  for (let h = 0; h < 12; h++) { const a = h * 30, p = P(a, Rr - 3.9); s += C(0.75, p[0], p[1], 'k') + T(ROMAN[h], 0, 0, 3.3, `transform="rotate(${a}) translate(0,${-(Rr - 11.6)})"`); }
  for (let i = 0; i < 16; i++) s += rad(i * 22.5, 1.6, Rr - 15.4, i % 2 ? 'hair' : 't');
  s += hand('h', `<path class="k" d="M-0.7,2.6L-0.5,${-(Rr - 13)}L-1.9,${-(Rr - 13)}L0,${-(Rr - 8.2)}L1.9,${-(Rr - 13)}L0.5,${-(Rr - 13)}L0.7,2.6Z"/>`) + C(1.3, 0, 0, 'p') + C(0.4, 0, 0, 'k');
  return svg(s, 'Drum watch with a single hand, illustrative reconstruction');
}
function verge() {
  const Rr = 23; let s = pendant(Rr) + C(Rr, 0, 0, 'p') + C(Rr - 1.5, 0, 0, 'l') + C(Rr - 2.3, 0, 0, 'p') + C(Rr - 5.6, 0, 0, 't') + C(Rr - 6.3, 0, 0, 't');
  for (let i = 0; i < 60; i++) s += rad(i * 6, Rr - 6.3, Rr - 5.6, 't');
  for (let h = 0; h < 12; h++) { const a = h * 30; s += T(ROMAN[h], 0, 0, 3.7, `transform="rotate(${a}) translate(0,${-(Rr - 10.6)})"`) + T((h || 12) * 5, 0, 0, 1.5, `transform="rotate(${a}) translate(0,${-(Rr - 3.4)})"`); }
  const k = P(58, 7.6); s += C(1.25, k[0], k[1], 'l') + RC(k[0] - 0.55, k[1] - 0.55, 1.1, 1.1, 'k');
  s += hand('h', `<path class="k" d="M-0.35,2V-7.4H0.35V2Z"/><path class="l" d="M0,-7.4C-2.2,-8.6 -1.6,-11 0,-12.2C1.6,-11 2.2,-8.6 0,-7.4Z"/>`) + hand('m', `<path class="k" d="M-0.28,2.4V-15.6L0,-16.8L0.28,-15.6V2.4Z"/>`) + C(1.1, 0, 0, 'p') + C(0.35, 0, 0, 'k');
  return svg(s, 'Verge pocket watch with enamel dial, illustrative reconstruction');
}
function railroad() {
  const Rr = 25; let s = pendant(Rr, true) + C(Rr, 0, 0, 'p') + C(Rr - 1.3, 0, 0, 'l') + C(Rr - 2.6, 0, 0, 'p');
  for (let i = 0; i < 60; i++) s += rad(i * 6, Rr - (i % 5 ? 3.9 : 4.7), Rr - 2.9, i % 5 ? 't' : 'l');
  for (let h = 1; h <= 12; h++) { if (h === 6) continue; const p = P(h * 30, Rr - 8.6); s += `<text class="tx nm" x="${p[0]}" y="${f(p[1] + 1.9)}" font-size="5.4" text-anchor="middle">${h}</text>`; }
  const sy = 10.5; s += C(5.6, 0, sy, 'p'); for (let i = 0; i < 60; i += 5) s += rad(i * 6, 4.4, 5.3, 't', 0, sy);
  s += `<g transform="translate(0,${sy})">${hand('s', L(0, 1.2, 0, -4.6, 'hd'), 5)}${C(0.35, 0, 0, 'k')}</g>`;
  s += hand('h', `<path class="k" d="M-0.5,2.2V-8.6H-1.7L0,-13L1.7,-8.6H0.5V2.2Z"/>`) + hand('m', `<path class="k" d="M-0.4,2.6V-14.6H-1.2L0,-19L1.2,-14.6H0.4V2.6Z"/>`) + C(1.2, 0, 0, 'p') + C(0.4, 0, 0, 'k');
  return svg(s, 'Railroad pocket watch, illustrative reconstruction');
}
function trench() {
  const Rr = 16.5; let s = strap(6, 15, 31);
  s += `<path class="bar" d="M-7.2,-15.2V-20.6H7.2V-15.2M-7.2,15.2V20.6H7.2V15.2"/>`;
  s += RC(Rr - 0.4, -0.8, 2.4, 1.6) + C(2.2, Rr + 3.4, 0, 'p') + [-1.2, 0, 1.2].map(y => L(Rr + 1.8, y, Rr + 5, y, 't')).join('');
  s += C(Rr, 0, 0, 'p') + C(Rr - 1.3, 0, 0, 'l') + C(Rr - 2.2, 0, 0, 'tn');
  for (let i = 0; i < 60; i++) s += rad(i * 6, Rr - 3.2, Rr - 2.5, 't');
  for (let h = 1; h <= 12; h++) { if (h === 6) continue; const p = P(h * 30, Rr - 6.3); s += `<text class="lume" x="${p[0]}" y="${f(p[1] + 1.35)}" font-size="3.8" text-anchor="middle">${h}</text>`; }
  const sy = 7.2; s += C(3.5, 0, sy, 'tn'); for (let i = 0; i < 60; i += 10) s += rad(i * 6, 2.7, 3.3, 't', 0, sy);
  s += `<g transform="translate(0,${sy})">${hand('s', L(0, 0.8, 0, -2.8, 'hd'), 5)}${C(0.28, 0, 0, 'k')}</g>`;
  s += hand('h', `<path class="p" d="M-0.45,1.6V-4.6C-1.9,-5.4 -1.6,-7.4 0,-8.6C1.6,-7.4 1.9,-5.4 0.45,-4.6V1.6Z"/>`) + hand('m', `<path class="p" d="M-0.4,1.8V-8.4C-1.3,-9.2 -1.1,-10.8 0,-12.4C1.1,-10.8 1.3,-9.2 0.4,-8.4V1.8Z"/>`) + C(0.9, 0, 0, 'p') + C(0.3, 0, 0, 'k');
  return svg(s, 'Trench watch with wire lugs, illustrative reconstruction');
}
function astron() {
  let s = strap(8.5, 16, 31) + `<rect class="p" x="-18.5" y="-19.5" width="37" height="39" rx="11"/>` + RC(18, -1.3, 2.2, 2.6, 'p', 0.4) + C(14.6, 0, 0, 'l') + C(13.8, 0, 0, 'p');
  for (let h = 0; h < 12; h++) s += `<rect class="k" x="-0.4" y="-13" width="0.8" height="2.8" transform="rotate(${h * 30})"/>`;
  s += T('QUARTZ', 0, 6.4, 1.5, 'letter-spacing=".18em"');
  s += hand('h', `<path class="k" d="M-0.55,1.6V-7.4H0.55V1.6Z"/>`) + hand('m', `<path class="k" d="M-0.42,1.8V-11.4H0.42V1.8Z"/>`) + hand('s', L(0, 3, 0, -12.2, 'hd'), 1) + C(0.9, 0, 0, 'p') + C(0.3, 0, 0, 'k');
  return svg(s, 'Quartz analogue watch, illustrative drawing');
}
function led() {
  const b = `<path class="p" d="M-13,17L-11,31C-4,32.4 4,29.6 11,31L13,17Z"/>` + [21, 24.5, 28].map(y => L(-12.2 + (y - 17) * 0.14, y, 12.2 - (y - 17) * 0.14, y, 't')).join('');
  let s = b + `<g transform="scale(1,-1)">${b}</g>` + `<rect class="p" x="-19" y="-21" width="38" height="42" rx="9"/>` + `<rect class="l" x="-16.6" y="-18.6" width="33.2" height="37.2" rx="7"/>`;
  s += RC(18.6, -2.4, 2.2, 4.8, 'p', 0.5) + `<rect class="screen" x="-13" y="-7" width="26" height="14" rx="1.2"/>` + `<text class="ledtx" data-hm x="0" y="2.6" font-size="7.4" text-anchor="middle">12:00</text>`;
  return svg(s, 'LED digital watch showing the current time, illustrative drawing');
}
function back() {
  const mv = D.movement(W.find(w => w.id === 'sub5513')).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  let s = strap(9.5, 16, 31) + [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(q => `<g transform="scale(${q})">${RC(9.6, 14, 2.6, 10, 'p', 0.6)}</g>`).join('');
  s += RC(-22.8, -1.3, 3.2, 2.6, 'p', 0.4) + C(20, 0, 0, 'p') + C(18.2, 0, 0, 'l') + C(15.4, 0, 0, 'l');
  for (let k = 0; k < 6; k++) s += `<rect class="p" x="-1" y="-17.9" width="2" height="1.9" transform="rotate(${k * 60 + 30})"/>`;
  s += `<svg x="-14.6" y="-14.6" width="29.2" height="29.2" viewBox="-15.4 -15.4 30.8 30.8" class="fig">${mv}</svg>`;
  return svg(s, 'Mechanical watch with a display caseback, generic schematic');
}
function smart() {
  let s = strap(9, 18, 32) + `<rect class="p" x="-17" y="-20.5" width="34" height="41" rx="8.5"/>` + `<rect class="screen" x="-14.6" y="-18.1" width="29.2" height="36.2" rx="6.4"/>` + RC(17, -8, 2, 5, 'p', 1) + RC(17, 2, 1.2, 6, 'p', 0.6);
  s += `<text class="ledtx soft" data-hm x="0" y="1.6" font-size="8.4" text-anchor="middle">12:00</text>` + `<text class="ledtx soft" x="0" y="8.4" font-size="2.2" text-anchor="middle" opacity=".7">10,000 STEPS</text>`;
  return svg(s, 'Smartwatch, illustrative outline');
}
const CUSTOM = { drum, verge, railroad, trench, astron, led, back, smart };
const NAMES = { drum: 'Drum watch', verge: 'Verge pocket watch', railroad: 'Railroad pocket watch', trench: 'Trench watch', astron: 'Quartz watch', led: 'LED digital watch', back: 'Display-back watch', smart: 'Smartwatch' };
const aw = k => W.find(w => w.id === k.slice(2));
const draw = k => k.startsWith('w:') ? D.front(aw(k), {}) : CUSTOM[k]();
const plate = id => `index.html#/plate/${id}`;
function links(k) {
  if (!k.startsWith('w:')) return '<p class="recon">Illustrative reconstruction</p>';
  const w = aw(k), b = HX.bench[w.id];
  return `<p class="go"><a href="${plate(w.id)}">Plate, blueprint and movement</a>${b ? `<a href="workbench.html#watch=${b}">Take it apart on the Workbench</a>` : ''}</p>`;
}
const capOf = fg => fg.cap || (w => `${w.brand} ${w.model}${w.ref !== '—' ? ', ref. ' + w.ref : ''}, ${w.year}. From the archive.`)(aw(fg.k));
const cites = c => c ? c.map(n => `<a class="cite" href="#src-${n}" aria-label="Source ${n}">${n}</a>`).join('') : '';

/* ----- build the page ----- */
function beat(b, i) {
  const y = b.y ? `<p class="by">${b.y}</p>` : '';
  let inner;
  if (b.kind === 'inv') inner = `<p class="bk">How it worked</p><h3>${b.h}${cites(b.c)}</h3><dl class="inv">${b.rows.map(r => `<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl>${b.note ? `<p class="note">${b.note}</p>` : ''}`;
  else if (b.kind === 'world') inner = `${y}<p class="bk">Meanwhile</p><h3>${b.h}</h3><p>${b.t}${cites(b.c)}</p>`;
  else if (b.kind === 'makers') inner = `<p class="bk">Makers</p><h3>${b.h}</h3><p>${b.t}</p>`;
  else inner = `${y}<h3>${b.h}</h3><p>${b.t}${cites(b.c)}</p>`;
  if (b.links) inner += `<p class="go">${b.links.map(l => `<a href="${plate(l[0])}">${l[1]}</a>`).join('')}</p>`;
  const m = /\d{4}/.exec(b.y || (b.rows && b.rows[0][0]) || '');
  return `<article class="beat ${b.kind || 'p'}" data-f="${b.f || 0}"${m ? ` data-y="${m[0]}"` : ''}>${inner}</article>`;
}
const compare = c => `<section class="compare"><div class="cmp-head"><p class="bk">Side by side</p><h3>${c.title}</h3><p>${c.text}</p></div><div class="cmp-row n${c.items.length}">${c.items.map(it => `<figure>${draw(it[0])}<figcaption><b>${it[1]}</b><span>${it[2]}</span>${it[0].startsWith('w:') ? `<a href="${plate(it[0].slice(2))}">Open the plate</a>` : '<i>Reconstruction</i>'}</figcaption></figure>`).join('')}</div></section>`;

$('#evo').innerHTML = `<div class="evo-pin">
  <div class="evo-copy"><p class="bk">One object, five centuries</p>${HX.evolution.map((e, i) => `<div class="evo-step" data-i="${i}"><p class="evo-y">${e.y}</p><h3>${e.h}</h3><p>${e.t}</p><dl>${e.m.map(m => `<div><dt>${m[0]}</dt><dd>${m[1]}</dd></div>`).join('')}</dl>${e.fig.startsWith('w:') ? `<p class="go"><a href="${plate(e.fig.slice(2))}">${aw(e.fig).brand} ${aw(e.fig).model}: open the plate</a></p>` : '<p class="recon">Illustrative reconstruction</p>'}</div>`).join('')}</div>
  <div class="evo-stage">${HX.evolution.map((e, i) => `<div class="evo-layer" data-i="${i}">${draw(e.fig)}</div>`).join('')}<p class="scale"><i></i>10 mm · every watch drawn at the same scale</p></div>
  <ol class="evo-dots" aria-hidden="true">${HX.evolution.map((e, i) => `<li data-i="${i}"></li>`).join('')}</ol>
</div>`;

$('#eras').innerHTML = HX.eras.map((e, n) => `
<section class="era ${e.id}" id="${e.id}" data-from="${e.from}" data-to="${e.to}" aria-labelledby="${e.id}-t">
  <header class="era-open"><p class="era-no">Chapter ${n + 1} of ${HX.eras.length}</p><p class="era-range">${e.range}</p><h2 id="${e.id}-t">${e.title}</h2><p class="dek">${e.dek}</p></header>
  <div class="era-body">
    <div class="stage"><div class="stage-in">${e.figs.map((fg, i) => `<figure class="layer${i ? '' : ' on'}" data-i="${i}">${draw(fg.k)}<figcaption>${capOf(fg)}</figcaption>${links(fg.k)}</figure>`).join('')}</div></div>
    <div class="beats">${e.beats.map(beat).join('')}</div>
  </div>
  ${(e.compare || []).map(compare).join('')}
</section>`).join('');

$('#sources ol').innerHTML = HX.sources.map((s, i) => `<li id="src-${i + 1}"><a href="${s[1]}" target="_blank" rel="noopener">${s[0]}</a></li>`).join('');
$('#rail').innerHTML = HX.eras.map(e => `<a href="#${e.id}" data-era="${e.id}"><span>${e.range}</span><b>${e.title}</b></a>`).join('') + '<i id="rail-dot"></i>';

/* ----- behaviour ----- */
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
// which beat is in the middle of the screen decides which watch its chapter shows
const mid = new IntersectionObserver(es => es.forEach(en => {
  if (!en.isIntersecting) return;
  const b = en.target, era = b.closest('.era'), i = b.dataset.f;
  era.querySelectorAll('.beat.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
  era.querySelectorAll('.layer').forEach(l => l.classList.toggle('on', l.dataset.i === i));
}), { rootMargin: matchMedia('(max-width: 900px) and (orientation: portrait)').matches ? '-68% 0px -28% 0px' : '-48% 0px -48% 0px' });
const seen = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); seen.unobserve(en.target); } }), { rootMargin: '0px 0px -12% 0px' });
$$('.beat').forEach(b => { mid.observe(b); seen.observe(b); });
$$('.era-open, .compare, .hero-in').forEach(x => seen.observe(x));

const evo = $('#evo'), eras = $$('.era'), yr = $('#yr'), dot = $('#rail-dot'), railLinks = $$('#rail a');
// The year counter follows the story: each passage has a year, and the counter moves between them as you scroll.
// Passages without a date are spaced evenly towards the end of their era, and the count never runs backwards.
const marks = eras.map(e => {
  const from = +e.dataset.from, to = +e.dataset.to, bs = [...e.querySelectorAll('.beat')], ys = bs.map(b => b.dataset.y ? Math.min(to, Math.max(from, +b.dataset.y)) : null);
  let prev = from; for (let i = 0; i < ys.length; i++) { if (ys[i] != null) { ys[i] = Math.max(prev, ys[i]); prev = ys[i]; } }
  for (let i = 0; i < ys.length; i++) if (ys[i] == null) { let j = i; while (j < ys.length && ys[j] == null) j++; const a = i ? ys[i - 1] : from, b = j < ys.length ? ys[j] : to; for (let k = i; k < j; k++) ys[k] = a + (b - a) * (k - i + 1) / (j - i + 1); i = j; }
  return { head: e.querySelector('.era-open'), bs, ys, from, to };
});
function yearAt(i, c) {
  const m = marks[i], pts = [[m.head.getBoundingClientRect().top + m.head.offsetHeight / 2, m.from]];
  m.bs.forEach((b, k) => { const r = b.getBoundingClientRect(); pts.push([r.top + r.height / 2, m.ys[k]]); });
  pts.push([pts[pts.length - 1][0] + innerHeight * 0.8, m.to]);
  if (c <= pts[0][0]) return m.from;
  for (let k = 1; k < pts.length; k++) if (c <= pts[k][0]) { const t = (c - pts[k - 1][0]) / Math.max(1, pts[k][0] - pts[k - 1][0]); return pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t; }
  return m.to;
}
let evoI = -1, curEra = null, ticking = false;
function setEvo(i) { if (i === evoI) return; evoI = i; $$('.evo-layer, .evo-step, .evo-dots li').forEach(x => x.classList.toggle('on', +x.dataset.i === i)); }
function onScroll() {
  ticking = false;
  const vh = innerHeight, c = vh / 2, er = evo.getBoundingClientRect(), n = HX.evolution.length;
  const ep = Math.min(0.9999, Math.max(0, -er.top / Math.max(1, er.height - vh)));
  setEvo(Math.floor(ep * n));
  let found = null, text = '';
  for (const e of eras) { const r = e.getBoundingClientRect(); if (r.top <= c && r.bottom > c) { found = e; text = Math.round(yearAt(eras.indexOf(e), matchMedia('(max-width: 900px) and (orientation: portrait)').matches ? vh * 0.7 : c)); break; } }
  if (!found && er.top <= c && er.bottom > c) text = HX.evolution[evoI].y.replace('c. ', '');
  document.body.classList.toggle('in-story', !!found || (er.top <= c && er.bottom > c));
  document.body.classList.toggle('in-eras', !!found);
  if (text !== '') yr.textContent = text;
  if (found !== curEra) {
    curEra = found; document.body.dataset.era = found ? found.id : 'evo';
    railLinks.forEach(a => { const on = found && a.dataset.era === found.id; a.classList.toggle('on', !!on); if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
  }
  if (found) { const i = eras.indexOf(found), r = found.getBoundingClientRect(); dot.style.top = ((i + (c - r.top) / r.height) / eras.length * 100).toFixed(2) + '%'; }
  const first = eras[0].getBoundingClientRect(), last = eras[eras.length - 1].getBoundingClientRect();
  $('#bar i').style.width = (Math.min(1, Math.max(0, (c - first.top) / (last.bottom - first.top))) * 100).toFixed(2) + '%';
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
// the 10 mm bar under the opening sequence is measured from the drawings, which are 80 mm tall
const setScale = () => { const g = $('.evo-layer .fig'); if (g) $('.scale i').style.width = (g.getBoundingClientRect().height / 80 * 10).toFixed(1) + 'px'; };
addEventListener('resize', () => { onScroll(); setScale(); }); onScroll(); setScale(); addEventListener('load', setScale);

// every drawn watch keeps the visitor's own time
let lastS = -1;
function tick() {
  const n = new Date(), s = n.getSeconds(), t = s + n.getMilliseconds() / 1000, m = (n.getMinutes() + t / 60) * 6, h = ((n.getHours() % 12) + n.getMinutes() / 60 + t / 3600) * 30;
  document.querySelectorAll('[data-hand]').forEach(el => { const k = el.dataset.hand, b = +el.dataset.bps; el.setAttribute('transform', `rotate(${(k === 'h' ? h : k === 'm' ? m : (b ? Math.floor(t * b) / b : t) * 6).toFixed(2)})`); });
  if (s !== lastS) { lastS = s; const hm = `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`; document.querySelectorAll('[data-hm]').forEach(el => { el.textContent = hm; }); document.querySelectorAll('[data-date]').forEach(el => { el.textContent = n.getDate(); }); document.querySelectorAll('[data-daydate]').forEach(el => { el.textContent = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][n.getDay()] + ' ' + n.getDate(); }); }
  if (!reduce || lastS % 1 === 0) requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
})();
