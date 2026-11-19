/* The Meaning of Time: a quiet page. Three small behaviours, each independent:
   a still sky, text that arrives as it is reached, and a clock for the present moment. */
(function () {
'use strict';
const $ = s => document.querySelector(s), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the sky: seeded, so it is the same on every visit ---------- */
function sky(el, n, seed, square) {
  if (!el) return; let x = seed, c = ''; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647, f = v => v.toFixed(2);
  for (let i = 0; i < n; i++) {
    const r = rnd(), o = f(0.16 + rnd() * 0.55);
    // the wheel is a square that turns very slowly about its centre; the others are fixed and sized in screen pixels
    c += square ? `<circle cx="${f(rnd() * 1000)}" cy="${f(rnd() * 1000)}" r="${r > 0.96 ? 1.1 : r > 0.7 ? 0.7 : 0.45}" opacity="${o}"/>`
                : `<circle cx="${f(rnd() * 100)}%" cy="${f(rnd() * 100)}%" r="${r > 0.95 ? 1.3 : r > 0.7 ? 0.9 : 0.6}" opacity="${o}"/>`;
  }
  el.innerHTML = square ? `<svg viewBox="0 0 1000 1000">${c}</svg>` : `<svg>${c}</svg>`;
}
sky($('#sky-open'), 170, 31337); sky($('#sky-close'), 150, 2718); sky($('#sky-wheel'), 520, 16180, true);

/* ---------- the stars behind the Earth: placed in percent, so they stay round at any width ---------- */
(function () {
  const el = $('#sky-orbit'); if (!el) return;
  let x = 4242, c = ''; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 54; i++) { const big = rnd() > 0.92, s = big ? 2.4 : rnd() > 0.5 ? 1.6 : 1.1;
    c += `<i${big ? ' class="big"' : ''} style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 100).toFixed(2)}%;width:${s}px;height:${s}px;--d:${(3.4 + rnd() * 5).toFixed(2)}s;--w:-${(rnd() * 6).toFixed(2)}s"></i>`; }
  el.innerHTML = c;
})();

/* ---------- text arrives as it is reached ---------- */
const items = [...document.querySelectorAll('.rv')];
if (calm || !('IntersectionObserver' in window)) items.forEach(e => e.classList.add('in'));
else {
  document.body.classList.add('mn-js');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  items.forEach(e => io.observe(e));
}

/* ---------- the present moment ---------- */
/* Not a clock and not a countdown: only the time the visitor has spent here, counted from arrival or from pressing Begin. */
const pad = n => String(n).padStart(2, '0'); let t0 = Date.now();
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'], TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty'];
const word = n => n < 20 ? ONES[n] : n < 60 ? TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '') : String(n);
const unit = (n, u) => `${word(n)} ${u}${n === 1 ? '' : 's'}`;
function now() {
  const s = Math.floor((Date.now() - t0) / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = s % 60;
  $('#mn-clock').textContent = `${pad(h)}:${pad(m)}:${pad(sec)}`;
  const parts = []; if (h) parts.push(unit(h, 'hour')); if (m) parts.push(unit(m, 'minute')); if (sec || !parts.length) parts.push(unit(sec, 'second'));
  const t = parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
  $('#mn-here').textContent = s < 1 ? 'A moment of your life.' : t.charAt(0).toUpperCase() + t.slice(1) + ' of your life.';
}
now(); setInterval(now, 1000);
$('#mn-begin').addEventListener('click', () => { t0 = Date.now(); now(); $('.mn-q').scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' }); });
})();
