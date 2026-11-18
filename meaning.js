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

/* ---------- text arrives as it is reached ---------- */
const items = [...document.querySelectorAll('.rv')];
if (calm || !('IntersectionObserver' in window)) items.forEach(e => e.classList.add('in'));
else {
  document.body.classList.add('mn-js');
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
  items.forEach(e => io.observe(e));
}

/* ---------- the present moment ---------- */
const pad = n => String(n).padStart(2, '0'), t0 = Date.now();
function now() {
  const n = new Date(), s = Math.floor((Date.now() - t0) / 1000), m = Math.floor(s / 60);
  $('#mn-clock').textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`;
  $('#mn-here').textContent = s < 5 ? '' : `You have been here for ${m ? `${m} minute${m === 1 ? '' : 's'} and ` : ''}${s % 60} second${s % 60 === 1 ? '' : 's'}.`;
}
now(); setInterval(now, 1000);
})();
