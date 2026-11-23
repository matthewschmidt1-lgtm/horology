/* The Nature of Time: page behaviour. Astronomy lives in time-core.js (window.Sol).
   Each study below is self-contained, so more can be added without touching the others. */
(function () {
'use strict';
const S = window.Sol, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0'), f = n => Math.round(n * 100) / 100, mod = (a, n) => ((a % n) + n) % n, R = Math.PI / 180;
const hms = minutes => { const s = Math.floor(mod(minutes, 1440) * 60); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
const dayMonth = (date, tz) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: tz }).format(date);
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];

/* =================== 1. the living solar clock =================== */
let loc = S.guess(), live = true, shown = new Date(), last = null, yearKey = '';
const dial = S.mount($('#dial')), sel = $('#city');
sel.innerHTML = '<option value="">Choose a place…</option>' + S.CITIES.slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option>${c.name}</option>`).join('');
const doyOf = p => Math.round((Date.UTC(p.y, p.m - 1, p.d) - Date.UTC(p.y, 0, 0)) / 86400000);
const daysIn = y => (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0)) ? 366 : 365;

function buildYear(y) { // hours of daylight for every day of the year at this place
  const n = daysIn(y); let d = '';
  for (let i = 1; i <= n; i++) { const dt = new Date(Date.UTC(y, 0, i)), len = S.day(y, dt.getUTCMonth() + 1, dt.getUTCDate(), loc).length; d += `${i === 1 ? 'M' : 'L'}${f(i / n * 360)},${f(52 - Math.max(0, Math.min(1, (len - 240) / 960)) * 48)}`; } // the chart runs from 4 to 20 hours so the curve reads; polar extremes are clipped
  let ticks = '', months = ''; for (let m = 0; m < 12; m++) { const x = f(doyOf({ y, m: m + 1, d: 1 }) / n * 360); ticks += `<line class="y-tick" x1="${x}" y1="52" x2="${x}" y2="55"/>`; months += `<span style="left:${f((x + 15) / 3.6)}%">${'JFMAMJJASOND'[m]}</span>`; }
  $('#year').innerHTML = `<svg viewBox="0 0 360 56" preserveAspectRatio="none"><line class="y-mid" x1="0" y1="28" x2="360" y2="28"/><path class="y-area" d="${d}L360,52L0,52Z"/><path class="y-line" d="${d}"/><line class="y-base" x1="0" y1="52" x2="360" y2="52"/>${ticks}<line class="y-now" id="y-now" x1="0" y1="2" x2="0" y2="52"/></svg><div class="y-months" aria-hidden="true">${months}</div><p><span>Hours of daylight through the year</span><span>12 h line shown</span></p>`;
}
function render() {
  if (live) shown = new Date();
  const r = dial.set(loc, shown), p = r.parts, ev = r.ev, ps = r.pos; last = r;
  const none = ev.polar === 'day' ? 'The sun does not set' : 'The sun does not rise';
  $('#r-rise').textContent = ev.rise ? S.clock(ev.rise, loc.tz) : none;
  $('#r-noon').textContent = S.clock(ev.noon, loc.tz);
  $('#r-set').textContent = ev.set ? S.clock(ev.set, loc.tz) : none;
  $('#r-len').textContent = `${Math.floor(ev.length / 60)} h ${pad(Math.round(ev.length) % 60)} min`;
  $('#r-phase').textContent = r.phase;
  $('#r-alt').textContent = `${Math.abs(ps.alt).toFixed(1)}° ${ps.alt >= 0 ? 'above' : 'below'} the horizon`;
  $('#r-az').textContent = `${ps.az.toFixed(0)}°, ${COMPASS[Math.round(ps.az / 45) % 8]}`;
  $('#c-civil').textContent = S.clock(shown, loc.tz, true);
  $('#c-mean').textContent = hms(ps.mean); $('#c-app').textContent = hms(ps.tst);
  const e = Math.abs(ps.eot), es = Math.round(e * 60);
  $('#c-eot').textContent = `${Math.floor(es / 60)} min ${pad(es % 60)} s, sundial ${ps.eot >= 0 ? 'ahead' : 'behind'}`;
  const mins = p.h * 60 + p.mi, doy = doyOf(p), k = [loc.lat, loc.lon, p.y].join('|');
  if (k !== yearKey) { yearKey = k; buildYear(p.y); $('#s-date').max = daysIn(p.y); }
  if (document.activeElement !== $('#s-time') || live) $('#s-time').value = mins;
  if (document.activeElement !== $('#s-date') || live) $('#s-date').value = doy;
  $('#t-lab').textContent = S.clock(shown, loc.tz); $('#d-lab').textContent = dayMonth(shown, loc.tz);
  const yn = $('#y-now'); if (yn) { const x = f(doy / daysIn(p.y) * 360); yn.setAttribute('x1', x); yn.setAttribute('x2', x); }
  $('#now').disabled = live;
}
function setLoc(l, note) {
  loc = l; $('#place-name').textContent = l.name;
  $('#place-coord').textContent = `${Math.abs(l.lat).toFixed(2)}° ${l.lat >= 0 ? 'N' : 'S'}, ${Math.abs(l.lon).toFixed(2)}° ${l.lon >= 0 ? 'E' : 'W'}`;
  $('#place-note').textContent = note; sel.value = S.CITIES.some(c => c.name === l.name) ? l.name : '';
  yearKey = ''; render(); cycles();
}
sel.addEventListener('change', () => { const c = S.CITIES.find(x => x.name === sel.value); if (c) setLoc(c, 'A place you chose. Times are shown in that place’s own zone.'); });
$('#s-time').addEventListener('input', e => { const p = last.parts; live = false; shown = S.instant(p.y, p.m, p.d, +e.target.value, loc.tz); render(); });
$('#s-date').addEventListener('input', e => { const p = last.parts, dt = new Date(Date.UTC(p.y, 0, +e.target.value)); live = false; shown = S.instant(p.y, dt.getUTCMonth() + 1, dt.getUTCDate(), p.h * 60 + p.mi, loc.tz); render(); });
$('#now').addEventListener('click', () => { live = true; render(); });

/* =================== 2. the rhythm of time: a metronome =================== */
const M = { bpm: 60, on: false, t0: 0, beat: -1 };
$('#metro').innerHTML = `<svg viewBox="-60 -122 120 160" class="inst"><path class="i-body" d="M-36,30H36L17,-106H-17Z"/><path class="i-line" d="M-27,30L-12,-98M27,30L12,-98"/>
  <g class="i-scale">${[40, 60, 80, 100, 120, 160, 208, 300].map(b => { const y = f(-92 + (b - 40) / 260 * 78); return `<line x1="-5" y1="${y}" x2="5" y2="${y}"/>` + (b === 60 || b === 100 ? '' : `<text x="9" y="${f(y + 1.4)}">${b}</text>`); }).join('')}</g>
  <g id="m-rod"><line class="i-rod" x1="0" y1="14" x2="0" y2="-104"/><rect class="i-weight" id="m-w" x="-7" y="-58" width="14" height="9" rx="1.5"/></g>
  <circle class="i-pivot" cx="0" cy="14" r="2.4"/><path class="i-foot" d="M-40,30H40V36H-40Z"/></svg>`;
function metroFacts() {
  const beat = 60 / M.bpm, T = 2 * beat, L = 9.80665 * (T / (2 * Math.PI)) ** 2;
  $('#m-bpm').textContent = M.bpm; $('#m-w').setAttribute('y', f(-92 + (M.bpm - 40) / 260 * 78 - 4.5));
  $('#m-facts').innerHTML = `<div><dt>One beat</dt><dd>${beat >= 1 ? beat.toFixed(2) + ' s' : Math.round(beat * 1000) + ' ms'}</dd></div><div><dt>A plain pendulum at this tempo</dt><dd>${L >= 1 ? L.toFixed(2) + ' m' : (L * 100).toFixed(1) + ' cm'} long</dd></div>`;
}
function metroFrame(ms) {
  if (!M.on) return;
  const t = (ms - M.t0) / 1000, beat = 60 / M.bpm, b = t / beat, amp = Math.max(8, Math.min(24, 27 - M.bpm / 14));
  $('#m-rod').setAttribute('transform', `rotate(${f(amp * Math.sin(Math.PI * b))} 0 14)`);
  if (Math.floor(b) !== M.beat) { M.beat = Math.floor(b); if ($('#m-snd').checked && ctx) click(ctx.currentTime + 0.005, M.beat % 4 === 0); }
  requestAnimationFrame(metroFrame);
}
$('#m-go').addEventListener('click', e => { M.on = !M.on; e.currentTarget.textContent = M.on ? 'Stop' : 'Start'; e.currentTarget.setAttribute('aria-pressed', M.on); if (M.on) { M.t0 = performance.now(); M.beat = -1; if ($('#m-snd').checked) audio(); requestAnimationFrame(metroFrame); } else $('#m-rod').setAttribute('transform', ''); });
$('#m-snd').addEventListener('change', e => { if (e.target.checked) audio(); });
$('#m-tempo').addEventListener('input', e => { M.bpm = +e.target.value; M.t0 = performance.now(); M.beat = -1; metroFacts(); });
$$('.presets button').forEach(b => b.addEventListener('click', () => { M.bpm = +b.dataset.bpm; $('#m-tempo').value = M.bpm; M.t0 = performance.now(); M.beat = -1; metroFacts(); }));
metroFacts();

/* =================== 3. the anatomy of a second =================== */
const A = { t: 0, on: false, last: 0 };
(function buildAnat() {
  /* Drawn to work, not just to look right. The fork's pivot sits where lines from the two pallets are tangent to the escape wheel, so each pallet moves straight in and out of the teeth;
     the pallets span two and a half teeth; the pin on the balance sits in the fork's slot; and the seconds wheel (80 teeth) meshes with an 8-leaf pinion on the escape wheel, which is the
     ratio that turns five ticks into one second. Parts are laid out in their own frame and mirrored, so that the seconds wheel turns clockwise. */
  const cogs = (n, r, h, ph) => { let d = ''; const p = 360 / n; for (let k = 0; k < n; k++) { const c = ph + k * p; [[-0.3, -h], [-0.17, h], [0.17, h], [0.3, -h]].forEach((q, m) => { const a = (c + q[0] * p) * R; d += `${k || m ? 'L' : 'M'}${f((r + q[1]) * Math.cos(a))},${f((r + q[1]) * Math.sin(a))}`; }); } return d + 'Z'; };
  let teeth = ''; for (let k = 0; k < 15; k++) { const a = (-132 + k * 24) * R, a0 = (-132 + k * 24 - 15) * R, a1 = (-132 + k * 24 - 2) * R; teeth += `${k ? 'L' : 'M'}${f(13.4 * Math.cos(a0))},${f(13.4 * Math.sin(a0))}L${f(20 * Math.cos(a))},${f(20 * Math.sin(a))}L${f(13.4 * Math.cos(a1))},${f(13.4 * Math.sin(a1))}`; }
  let sp = 'M0,0'; for (let th = 0; th <= 30; th += 0.3) sp += `L${f((1 + th * 0.5) * Math.cos(th))},${f((1 + th * 0.5) * Math.sin(th))}`;
  $('#anat').innerHTML = `<svg viewBox="-54 -43 144 138" class="inst">
    <g transform="translate(20,0) scale(-1,1)">
      <g transform="translate(0,30)"><g id="a-escw"><path class="i-esc" d="${teeth}Z"/></g></g>
      <g transform="translate(-33,30)"><g id="a-four"><path class="i-wheel" d="${cogs(80, 30, 0.55, 2.25)}"/><circle class="i-line" r="26"/><path class="i-line" d="M-26,0H-4M4,0H26M0,-26V-4M0,4V26"/><circle class="i-line" r="4"/><line class="i-rod" x1="0" y1="0" x2="0" y2="-23"/></g><circle class="i-dot" r="1.6"/></g>
      <g transform="translate(0,30)"><g id="a-pin"><path class="i-pinion" d="${cogs(8, 3, 0.55, 0)}"/></g><circle class="i-dotp" r="0.9"/></g>
      <g transform="translate(0,-19.1)"><path class="i-hair" d="${sp}"/><g id="a-bal"><circle class="i-bal" r="20"/><line class="i-rod" x1="-20" y1="0" x2="20" y2="0"/><circle class="i-esc" r="6.4"/><circle class="i-pin" cx="0" cy="5" r="1.25"/></g><circle class="i-dot" r="1.5"/></g>
      <g transform="translate(0,6.9)"><g id="a-pal"><path class="i-fork" d="M0,0V-17M-2.4,-22V-17H2.4V-22M-11.2,3.6L0,0L11.2,3.6"/><path class="i-stone" d="M-9.65,6.39L-11.75,2.75M9.65,6.39L11.75,2.75"/></g><circle class="i-dot" r="1.4"/></g>
    </g>
    <text class="i-lab end" x="-5" y="-17.6">BALANCE</text><text class="i-lab end" x="5" y="4">FORK</text><text class="i-lab end" x="-5" y="31.5">ESCAPE WHEEL</text><text class="i-lab" x="53" y="69">SECONDS WHEEL</text>
    <g transform="translate(-50,87)"><text class="i-lab left" y="-4">ONE SECOND · FIVE TICKS</text>${[0, 1, 2, 3, 4].map(i => `<rect class="i-step" data-i="${i}" x="${f(i * 27.2)}" y="0" width="26" height="6"/>`).join('')}</g></svg>`;
})();
function anat(t) {
  A.t = t; const b = t / 200, idx = Math.min(4, Math.floor(b)), fr = b - idx, e = Math.min(1, fr / 0.14), steps = idx + e, th = 135 * Math.sin(Math.PI * b), moving = e < 1 && t < 1000;
  const push = Math.abs(th) > 90 ? Math.sign(th) : Math.sin(th * R), fk = -Math.asin(Math.max(-0.125, Math.min(0.125, 5 * push / 21))) / R; // the pin carries the fork across; then the fork rests against its stop
  $('#a-bal').setAttribute('transform', `rotate(${f(th)})`); $('#a-pal').setAttribute('transform', `rotate(${f(fk)})`);
  $('#a-escw').setAttribute('transform', `rotate(${f(steps * 12)})`); $('#a-pin').setAttribute('transform', `rotate(${f(steps * 12)})`); $('#a-four').setAttribute('transform', `rotate(${f(-steps * 1.2)})`);
  $$('.i-step').forEach(s => s.classList.toggle('on', +s.dataset.i < Math.floor(steps + 0.001) || (+s.dataset.i === idx && e >= 1)));
  $('#a-ms').textContent = Math.round(t); $('#a-beat').textContent = `Tick ${idx + 1} of 5`;
  const now = $('#a-now'); now.textContent = moving ? 'Tick. One tooth slips past and nudges the balance.' : 'Locked. The wheels wait while the balance swings.'; now.classList.toggle('hot', moving);
}
function anatFrame(ms) { if (!A.on) return; const dt = ms - A.last; A.last = ms; let t = A.t + dt / 14; if (t > 1000) t = 0; $('#a-t').value = t; anat(t); requestAnimationFrame(anatFrame); } // one second played over fourteen
$('#a-t').addEventListener('input', e => anat(+e.target.value));
$('#a-go').addEventListener('click', e => { A.on = !A.on; e.currentTarget.textContent = A.on ? 'Pause' : 'Play slowly'; e.currentTarget.setAttribute('aria-pressed', A.on); if (A.on) { A.last = performance.now(); requestAnimationFrame(anatFrame); } });
anat(0);

/* =================== 5. the sound of time: opt-in, synthesised =================== */
let ctx = null, master = null, stopT = null, noise = null, sndTurn = 0;
/* iPhones need three things a desktop does not. The audio must be told it is "playback", or the silent switch on the side of the phone mutes it;
   a sound has to start inside the tap itself to unlock the output; and the context can be "interrupted" as well as "suspended", so anything but "running" is resumed. */
let quiet = null, ready = null;
function audio() {
  if (!ctx) {
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}
    ctx = new (window.AudioContext || window.webkitAudioContext)(); noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.06), ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    if (!navigator.audioSession && (/iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)))) { quiet = new Audio('data:audio/wav;base64,UklGRvQHAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YdAHAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA=='); quiet.loop = true; quiet.setAttribute('playsinline', ''); } // older iPhones: a silent sound element playing puts the page in "playback"
  }
  if (quiet && quiet.paused) { const pr = quiet.play(); if (pr && pr.catch) pr.catch(() => {}); }
  try { const u = ctx.createBufferSource(); u.buffer = ctx.createBuffer(1, 1, ctx.sampleRate); u.connect(ctx.destination); u.start(0); } catch (e) {} // one silent sample, started in the tap
  ready = ctx.state === 'running' ? Promise.resolve() : Promise.race([Promise.resolve(ctx.resume()).catch(() => {}), new Promise(r => setTimeout(r, 400))]);
  return ctx;
}
function burst(t, freq, dur, vol, out) { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = 2.4; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(fl); fl.connect(g); g.connect(out || master); s.start(t); s.stop(t + dur + 0.02); }
function bell(t, freq, dur, vol) { [[1, 1], [2.76, 0.42], [5.4, 0.2]].forEach(([m, a]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq * m; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0006, t + dur / (m > 1 ? 2 : 1)); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }); }
function click(t, accent) { audio(); burst(t, accent ? 2600 : 2000, 0.03, accent ? 0.9 : 0.6, ctx.destination); }
function stopAll(keep) { sndTurn++; if (master) { try { master.gain.setValueAtTime(0, ctx.currentTime); master.disconnect(); } catch (e) {} master = null; } clearTimeout(stopT); if (quiet && keep !== true) quiet.pause(); $('#snd-status').textContent = 'Silent.'; $('#snd-stop').disabled = true; $$('#sounds button').forEach(b => b.setAttribute('aria-pressed', 'false')); }
function begin(btn, text, dur) { stopAll(true); audio(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); $('#snd-status').textContent = text; $('#snd-stop').disabled = false; btn.setAttribute('aria-pressed', 'true'); stopT = setTimeout(stopAll, dur * 1000 + 400); return ctx.currentTime + 0.08; }
const SOUNDS = {
  watch5(b) { const t = begin(b, 'A vintage watch: five beats a second.', 6); for (let i = 0; i < 30; i++) burst(t + i / 5, i % 2 ? 3500 : 4300, 0.014, 0.5); },
  watch10(b) { const t = begin(b, 'A high-beat watch: ten beats a second.', 6); for (let i = 0; i < 60; i++) burst(t + i / 10, i % 2 ? 3700 : 4500, 0.011, 0.42); },
  pendulum(b) { const t = begin(b, 'A pendulum clock: one beat a second.', 8); for (let i = 0; i < 8; i++) { burst(t + i, i % 2 ? 950 : 1300, 0.05, 0.9); burst(t + i + 0.012, 300, 0.09, 0.5); } },
  metro(b) { const beat = 60 / M.bpm, n = Math.max(8, Math.round(6 / beat)), t = begin(b, `A metronome at ${M.bpm} beats a minute.`, n * beat); for (let i = 0; i < n; i++) burst(t + i * beat, i % 4 ? 2000 : 2600, 0.03, i % 4 ? 0.6 : 0.9); },
  repeater(b) {
    const n = new Date(), h = n.getHours() % 12 || 12, q = Math.floor(n.getMinutes() / 15), m = n.getMinutes() % 15; let dur = h * 0.55 + 0.5 + q * 0.75 + 0.4 + m * 0.42 + 1.6;
    let t = begin(b, `Striking ${pad(n.getHours())}:${pad(n.getMinutes())}: ${h} hour${h > 1 ? 's' : ''}, ${q} quarter${q === 1 ? '' : 's'}, ${m} minute${m === 1 ? '' : 's'}.`, dur);
    for (let i = 0; i < h; i++, t += 0.55) bell(t, 523, 1.4, 0.5); t += 0.5;
    for (let i = 0; i < q; i++, t += 0.75) { bell(t, 784, 1.0, 0.42); bell(t + 0.27, 523, 1.2, 0.46); } t += 0.4;
    for (let i = 0; i < m; i++, t += 0.42) bell(t, 784, 1.0, 0.42);
  },
  alarm(b) { const t = begin(b, 'A mechanical alarm.', 3); for (let i = 0; i < 66; i++) { bell(t + i / 22, 1320, 0.09, 0.3); burst(t + i / 22, 5200, 0.012, 0.22); } }
};
/* a small drawing beside each sound, and a line on what makes it; the drawings move only while their sound plays */
const ICON = {
  watch5: '<circle class="k" r="15"/><g class="mv"><circle r="11"/><line x1="-11" y1="0" x2="11" y2="0"/><line x1="0" y1="-11" x2="0" y2="11"/><circle class="f" cx="-7.5" cy="3" r="1.5"/></g><circle class="f" r="1.6"/>',
  pendulum: '<path d="M-9,-16H9"/><g class="mv"><line x1="0" y1="-16" x2="0" y2="8"/><circle class="f" cx="0" cy="11" r="4.5"/></g>',
  metro: '<path d="M-10,15H10L5,-15H-5Z"/><g class="mv"><line x1="0" y1="10" x2="0" y2="-17"/><rect class="f" x="-3" y="-9" width="6" height="4"/></g>',
  repeater: '<path d="M13,4A13.5,13.5 0 1 0 4,13"/><g class="mv"><line x1="0" y1="0" x2="9" y2="9"/><circle class="f" cx="10.5" cy="10.5" r="2.6"/></g><circle class="f" r="1.6"/>',
  alarm: '<g class="mv"><path d="M-12,6A12,13 0 0 1 12,6Z"/><line x1="-14" y1="6" x2="14" y2="6"/></g><line x1="0" y1="-7" x2="0" y2="-12"/><circle class="f" cx="0" cy="-13.5" r="1.8"/><path d="M-9,10L-12,15M9,10L12,15"/>'
};
ICON.watch10 = ICON.watch5;
$$('#sounds button').forEach(b => b.insertAdjacentHTML('afterbegin', `<svg class="snd-ico ico-${b.dataset.snd}" viewBox="-20 -20 40 40" aria-hidden="true">${ICON[b.dataset.snd]}</svg>`));
const NOTES = {
  watch5: 'The tick is the escapement: a pallet jewel catching a tooth of the escape wheel, five times a second.',
  watch10: 'The same escapement at twice the rate. Ten ticks a second run together into a purr.',
  pendulum: 'An anchor rocks with the pendulum and lets one tooth of the escape wheel drop at each swing. One drop is the tick, the next the tock.',
  metro: 'A wound spring drives a small escapement, which knocks once at each end of the rod’s swing.',
  repeater: 'Two small hammers strike wire gongs coiled around the movement: a low note for each hour, a pair for each quarter, a high note for each minute.',
  alarm: 'A released spring drives a hammer rapidly back and forth against a bell until it runs down.'
};
$('#sounds').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.getAttribute('aria-pressed') === 'true') return stopAll(); $('#snd-note').textContent = NOTES[b.dataset.snd]; const fail = () => { $('#snd-status').textContent = 'This browser could not start audio.'; };
  try { stopAll(true); audio(); const go = sndTurn; ready.then(() => { if (go !== sndTurn) return; try { SOUNDS[b.dataset.snd](b); } catch (err) { fail(); } }); } catch (err) { fail(); } });
$('#snd-stop').addEventListener('click', stopAll);

/* =================== 6. the cycles of time: three small instruments =================== */
/* Each keeps its own state: null means "follow the present". */
const C = { day: null, moon: null, year: null, dayOn: false, yearOn: false, last: 0 };
const placeName = () => loc.name;
function nextCross(target, from) { // when the sun next reaches this longitude on the ecliptic
  const dv = t => mod(S.sun(new Date(t)).lam - target + 180, 360) - 180; let a = from, b;
  for (let i = 0; i < 380; i++) { b = a + 86400000; if (dv(a) < 0 && dv(b) >= 0) break; a = b; }
  for (let i = 0; i < 24; i++) { const mid = (a + b) / 2; if (dv(mid) < 0) a = mid; else b = mid; } return new Date(b);
}
const RAYS = (cx, cy, r0, r1) => [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line class="or-ray" x1="${f(cx + r0 * Math.cos(a * R))}" y1="${f(cy + r0 * Math.sin(a * R))}" x2="${f(cx + r1 * Math.cos(a * R))}" y2="${f(cy + r1 * Math.sin(a * R))}"/>`).join('');

/* The day: the Earth from above the visitor's own pole, the sun off to the right.
   Plain geometry: the shadow edge is where the sun is on the horizon, with no allowance for twilight or refraction. */
function drawDay() {
  const now = new Date(), p0 = S.parts(now, loc.tz), date = C.day == null ? now : S.instant(p0.y, p0.m, p0.d, C.day, loc.tz);
  const ps = S.position(date, loc.lat, loc.lon), ev = S.day(p0.y, p0.m, p0.d, loc), sg = loc.lat >= 0 ? 1 : -1, E = 40;
  const dec = sg * ps.decl * R, rx = f(E * Math.abs(Math.sin(dec))), r = E * Math.cos(Math.abs(loc.lat) * R);
  const at = a => [f(Math.cos(a * R)), f(-sg * Math.sin(a * R))]; // the Earth turns anticlockwise seen from the north, clockwise from the south
  let spokes = ''; for (let i = 0; i < 12; i++) { const [cx, cy] = at(ps.ha + i * 30); spokes += `<line class="ea-mer" x1="0" y1="0" x2="${f(cx * E)}" y2="${f(cy * E)}"/>`; }
  const [mx, my] = at(ps.ha), up = ps.alt > 0;
  $('#c-day').innerHTML = `<svg viewBox="-48 -48 136 96" class="inst"><defs><clipPath id="ea-clip"><circle r="${E}"/></clipPath></defs>
    <circle class="or-sun" cx="74" cy="0" r="7"/>${RAYS(74, 0, 9.5, 12.5)}
    <circle class="ea-day" r="${E}"/><g clip-path="url(#ea-clip)">${spokes}<circle class="ea-lat" r="${f(r)}"/>
    <path class="ea-night" d="M0,${-E}A${E},${E} 0 0 0 0,${E}A${rx},${E} 0 0 ${dec >= 0 ? 1 : 0} 0,${-E}Z"/></g>
    <circle class="ea-limb" r="${E}"/><circle class="ea-pole" r="1.3"/>
    <circle class="ea-you ${up ? 'up' : 'down'}" cx="${f(mx * r)}" cy="${f(my * r)}" r="3"/></svg>`;
  const mins = Math.round(mod(S.parts(date, loc.tz).h * 60 + S.parts(date, loc.tz).mi, 1440));
  if (document.activeElement !== $('#cd-t') || C.day == null) $('#cd-t').value = mins;
  $('#cd-lab').textContent = S.clock(date, loc.tz); $('#cd-now').disabled = C.day == null && !C.dayOn;
  $('#c-day-t').textContent = `The dot is you, seen from above the ${sg > 0 ? 'North' : 'South'} Pole. Today it spends ${Math.floor(ev.length / 60)} h ${pad(Math.round(ev.length) % 60)} min in the light.`;
}

/* The month: the moon as it faces this hemisphere, at any day of its cycle. */
function drawMoon() {
  const now = new Date(), cur = S.moon(now), age = C.moon == null ? cur.age : C.moon, mn = C.moon == null ? cur : S.moon(new Date(now.getTime() + (age - cur.age) * 86400000));
  const fr = age / S.SYNODIC, wax = fr < 0.5, k = wax ? fr : 1 - fr, rx = f(34 * Math.abs(Math.cos(k * 2 * Math.PI))), flip = (wax ? 1 : -1) * (loc.lat >= 0 ? 1 : -1);
  $('#c-moon').innerHTML = `<svg viewBox="-50 -50 100 100" class="inst"><circle class="mo-dark" r="34"/><path class="mo-lit" transform="scale(${flip},1)" d="M0,-34A34,34 0 0 1 0,34A${rx},34 0 0 ${k < 0.25 ? 0 : 1} 0,-34Z"/><circle class="i-line" r="34"/><circle class="i-line faint" r="42"/></svg>`;
  if (document.activeElement !== $('#cm-t') || C.moon == null) $('#cm-t').value = age.toFixed(1);
  $('#cm-lab').textContent = `${age.toFixed(1)} of 29.5`; $('#cm-now').disabled = C.moon == null;
  $('#c-moon-t').textContent = `${mn.name}: about ${Math.round(mn.lit * 100)}% lit.` + (C.moon == null ? ` Next full moon around ${dayMonth(cur.nextFull, loc.tz)}; next new moon around ${dayMonth(cur.nextNew, loc.tz)}.` : '') + ' Twelve lunations fall eleven days short of a year.';
}

/* The year: the Earth on its orbit, seen from above the north pole, travelling anticlockwise.
   The short line is the axis: it leans the same way all year, which is what makes the seasons. */
function drawYear() {
  const now = new Date(), p = S.parts(now, loc.tz), n = daysIn(p.y), doy = C.year == null ? doyOf(p) : C.year, date = C.year == null ? now : new Date(Date.UTC(p.y, 0, Math.round(doy), 12));
  const ps = S.position(date, loc.lat, loc.lon), north = loc.lat >= 0, th = (ps.lam + 180) * R, ex = 36 * Math.cos(th), ey = -36 * Math.sin(th), a = Math.atan2(ey, ex), er = 5.2;
  const h1 = [f(ex + er * Math.cos(a - Math.PI / 2)), f(ey + er * Math.sin(a - Math.PI / 2))], h2 = [f(ex + er * Math.cos(a + Math.PI / 2)), f(ey + er * Math.sin(a + Math.PI / 2))];
  const pts = [['March equinox', 180], ['June solstice', 270], ['September equinox', 0], ['December solstice', 90]];
  $('#c-orbit').innerHTML = `<svg viewBox="-100 -58 200 116" class="inst"><circle class="i-line" r="36"/>${pts.map(([nm, an]) => { const x = 36 * Math.cos(an * R), y = -36 * Math.sin(an * R), lx = 50 * Math.cos(an * R), ly = -47 * Math.sin(an * R); return `<circle class="i-dot" cx="${f(x)}" cy="${f(y)}" r="1.5"/><text class="i-lab ${an === 180 ? 'end' : an === 0 ? 'left' : ''}" x="${f(lx)}" y="${f(an % 180 ? ly + (an === 90 ? 0 : 3) : -1.5)}">${an % 180 ? nm.toUpperCase() : nm.toUpperCase().split(' ').map((w, i) => `<tspan x="${f(lx)}" dy="${i ? '1.1em' : 0}">${w}</tspan>`).join('')}</text>`; }).join('')}
    <circle class="or-sun" r="6"/>${RAYS(0, 0, 8, 11)}
    <line class="or-spoke" x1="0" y1="0" x2="${f(ex)}" y2="${f(ey)}"/><circle class="or-earth" cx="${f(ex)}" cy="${f(ey)}" r="${er}"/>
    <path class="or-night" d="M${h1}A${er},${er} 0 0 1 ${h2}Z"/><circle class="or-rim" cx="${f(ex)}" cy="${f(ey)}" r="${er}"/>
    <line class="or-axis" x1="${f(ex)}" y1="${f(ey + 2)}" x2="${f(ex)}" y2="${f(ey - 9)}"/><circle class="or-np" cx="${f(ex)}" cy="${f(ey - 9)}" r="1"/>
    <path class="or-arrow" d="M-26,-30A40,40 0 0 0 -39,-9"/></svg>`;
  if (document.activeElement !== $('#cy-t') || C.year == null) $('#cy-t').value = Math.round(doy);
  $('#cy-t').max = n; $('#cy-lab').textContent = dayMonth(date, 'UTC'); $('#cy-now').disabled = C.year == null && !C.yearOn;
  const season = (north ? ['spring', 'summer', 'autumn', 'winter'] : ['autumn', 'winter', 'spring', 'summer'])[Math.floor(mod(ps.lam, 360) / 90)];
  $('#c-orbit-t').textContent = `${dayMonth(date, 'UTC')}: ${season} at ${placeName()}. The short line is the Earth’s axis, tilted 23.4°. That tilt makes the seasons, not distance: the Earth is closest to the sun in early January.`;
}
function cycles() {
  drawDay(); drawMoon(); drawYear();
  const now = new Date(), north = loc.lat >= 0, names = ['March equinox', 'June solstice', 'September equinox', 'December solstice'];
  const mean = [north ? 'spring begins' : 'autumn begins', north ? 'the longest day' : 'the shortest day', north ? 'autumn begins' : 'spring begins', north ? 'the shortest day' : 'the longest day'];
  $('#c-next').innerHTML = [0, 90, 180, 270].map((t, i) => ({ d: nextCross(t, now.getTime()), n: names[i], m: mean[i] })).sort((a, b) => a.d - b.d).map(x => `<li><b>${dayMonth(x.d, loc.tz)}</b><span>${x.n}: ${x.m}</span></li>`).join('');
}
function cycFrame(ms) { // a day turns in about twelve seconds, a year in about eighteen
  if (!C.dayOn && !C.yearOn) return; const dt = Math.min(100, ms - C.last); C.last = ms;
  if (C.dayOn) { C.day = mod((C.day == null ? +$('#cd-t').value : C.day) + dt * 0.12, 1440); drawDay(); }
  if (C.yearOn) { const n = +$('#cy-t').max; C.year = (C.year == null ? +$('#cy-t').value : C.year) + dt * 0.02; if (C.year > n) C.year -= n - 1; drawYear(); }
  requestAnimationFrame(cycFrame);
}
function cycToggle(key, btn, idle, busy) { const was = C.dayOn || C.yearOn; C[key] = !C[key]; btn.textContent = C[key] ? busy : idle; btn.setAttribute('aria-pressed', C[key]); if (C[key] && !was) { C.last = performance.now(); requestAnimationFrame(cycFrame); } drawDay(); drawYear(); }
$('#cd-t').addEventListener('input', e => { C.day = +e.target.value; drawDay(); });
$('#cd-go').addEventListener('click', e => cycToggle('dayOn', e.currentTarget, 'Turn the Earth', 'Pause'));
$('#cd-now').addEventListener('click', () => { if (C.dayOn) cycToggle('dayOn', $('#cd-go'), 'Turn the Earth', 'Pause'); C.day = null; drawDay(); });
$('#cm-t').addEventListener('input', e => { C.moon = +e.target.value; drawMoon(); });
$('#cm-now').addEventListener('click', () => { C.moon = null; drawMoon(); });
$('#cy-t').addEventListener('input', e => { C.year = +e.target.value; drawYear(); });
$('#cy-go').addEventListener('click', e => cycToggle('yearOn', e.currentTarget, 'Travel a year', 'Pause'));
$('#cy-now').addEventListener('click', () => { if (C.yearOn) cycToggle('yearOn', $('#cy-go'), 'Travel a year', 'Pause'); C.year = null; drawYear(); });

/* =================== atmosphere: a still field of stars behind the opening and the universe section =================== */
function stars(el, n, seed) { // fixed positions from a small seeded generator, so the sky is the same on every visit and never moves
  let x = seed; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647; let c = '';
  for (let i = 0; i < n; i++) { const r = rnd(); c += `<circle cx="${f(rnd() * 100)}%" cy="${f(rnd() * 100)}%" r="${r > 0.95 ? 1.3 : r > 0.7 ? 0.9 : 0.6}" opacity="${f(0.18 + rnd() * 0.5)}"/>`; }
  el.insertAdjacentHTML('afterbegin', `<svg class="stars" aria-hidden="true">${c}</svg>`);
}
stars($('.nt-hero'), 150, 20261); stars($('#universe'), 220, 4711);

/* =================== start =================== */
setLoc(loc, loc.rough ? 'Placed on the meridian your time zone implies. Choose a place for a true reading.' : 'Chosen from your time zone. This page never asks for your position.');
const present = () => { const n = new Date(); $('#pm-clock').textContent = `${pad(n.getHours())}:${pad(n.getMinutes())}:${pad(n.getSeconds())}`; };
present();
setInterval(() => { if (live) render(); present(); }, 1000);
setInterval(cycles, 60000);
window.__time = { get loc() { return loc; }, get last() { return last; }, render, setLoc };
})();
