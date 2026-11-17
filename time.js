/* The Nature of Time: page behaviour. Astronomy lives in time-core.js (window.Sol).
   Each study below is self-contained, so more can be added without touching the others. */
(function () {
'use strict';
const S = window.Sol, $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const pad = n => String(n).padStart(2, '0'), f = n => Math.round(n * 100) / 100, mod = (a, n) => ((a % n) + n) % n, R = Math.PI / 180;
const hms = minutes => { const s = Math.floor(mod(minutes, 1440) * 60); return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
const dayMonth = (date, tz) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', timeZone: tz }).format(date);
const zoneName = (date, tz) => { try { return new Intl.DateTimeFormat('en', { timeZone: tz, timeZoneName: 'short' }).formatToParts(date).find(p => p.type === 'timeZoneName').value; } catch (e) { return ''; } };
const COMPASS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
let browserTz = 'UTC'; try { browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone; } catch (e) {}

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
  $('#r-time').textContent = `${S.clock(shown, loc.tz, live)} ${zoneName(shown, loc.tz)}`;
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
  yearKey = ''; render(); cycles(); measure();
}
sel.addEventListener('change', () => { const c = S.CITIES.find(x => x.name === sel.value); if (c) setLoc(c, 'A place you chose. Times are shown in that place’s own zone.'); });
$('#geo').addEventListener('click', () => {
  if (!navigator.geolocation) { $('#place-note').textContent = 'This browser cannot share a location. Choose a place from the list.'; return; }
  $('#place-note').textContent = 'Asking your browser…';
  navigator.geolocation.getCurrentPosition(
    g => setLoc({ name: 'Your location', lat: g.coords.latitude, lon: g.coords.longitude, tz: browserTz }, 'Using the position your browser shared. It is used here and sent nowhere.'),
    () => { $('#place-note').textContent = 'Location was not shared. Choose a place from the list instead.'; },
    { timeout: 12000, maximumAge: 600000 });
});
$('#s-time').addEventListener('input', e => { const p = last.parts; live = false; shown = S.instant(p.y, p.m, p.d, +e.target.value, loc.tz); render(); });
$('#s-date').addEventListener('input', e => { const p = last.parts, dt = new Date(Date.UTC(p.y, 0, +e.target.value)); live = false; shown = S.instant(p.y, dt.getUTCMonth() + 1, dt.getUTCDate(), p.h * 60 + p.mi, loc.tz); render(); });
$('#now').addEventListener('click', () => { live = true; render(); });

/* =================== 2. the rhythm of time: a metronome =================== */
const M = { bpm: 60, on: false, t0: 0, beat: -1 };
$('#metro').innerHTML = `<svg viewBox="-60 -122 120 160" class="inst"><path class="i-body" d="M-36,30H36L17,-106H-17Z"/><path class="i-line" d="M-27,30L-12,-98M27,30L12,-98"/>
  <g class="i-scale">${[40, 60, 80, 100, 120, 160, 208, 300].map(b => { const y = f(-92 + (b - 40) / 260 * 78); return `<line x1="-5" y1="${y}" x2="5" y2="${y}"/><text x="9" y="${f(y + 1.4)}">${b}</text>`; }).join('')}</g>
  <g id="m-rod"><line class="i-rod" x1="0" y1="14" x2="0" y2="-104"/><rect class="i-weight" id="m-w" x="-7" y="-58" width="14" height="9" rx="1.5"/></g>
  <circle class="i-pivot" cx="0" cy="14" r="2.4"/><path class="i-foot" d="M-40,30H40V36H-40Z"/></svg>`;
function metroFacts() {
  const beat = 60 / M.bpm, T = 2 * beat, L = 9.80665 * (T / (2 * Math.PI)) ** 2;
  $('#m-bpm').textContent = M.bpm; $('#m-w').setAttribute('y', f(-92 + (M.bpm - 40) / 260 * 78 - 4.5));
  $('#m-facts').innerHTML = `<div><dt>One beat</dt><dd>${beat >= 1 ? beat.toFixed(2) + ' s' : Math.round(beat * 1000) + ' ms'}</dd></div><div><dt>Full swings</dt><dd>${(M.bpm / 120).toFixed(2)} a second</dd></div><div><dt>A plain pendulum at this tempo</dt><dd>${L >= 1 ? L.toFixed(2) + ' m' : (L * 100).toFixed(1) + ' cm'} long</dd></div>`;
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
  let teeth = ''; for (let i = 0; i < 15; i++) { const a = i * 24 * R, a2 = (i * 24 + 9) * R, a3 = (i * 24 + 15) * R; teeth += `${i ? 'L' : 'M'}${f(13 * Math.cos(a))},${f(13 * Math.sin(a))}L${f(20 * Math.cos(a2))},${f(20 * Math.sin(a2))}L${f(13.6 * Math.cos(a3))},${f(13.6 * Math.sin(a3))}`; }
  let sp = 'M0,0'; for (let th = 0; th <= 30; th += 0.3) sp += `L${f((1 + th * 0.62) * Math.cos(th))},${f((1 + th * 0.62) * Math.sin(th))}`;
  let cog = ''; for (let i = 0; i < 48; i++) { const a = i * 7.5 * R; cog += `<line x1="${f(22 * Math.cos(a))}" y1="${f(22 * Math.sin(a))}" x2="${f(25 * Math.cos(a))}" y2="${f(25 * Math.sin(a))}"/>`; }
  $('#anat').innerHTML = `<svg viewBox="-104 -64 208 142" class="inst">
    <g transform="translate(-72,6)"><circle class="i-line" r="22"/><g class="i-cog">${cog}</g><g id="a-four"><line class="i-rod" x1="0" y1="0" x2="0" y2="-20"/><circle class="i-dot" r="1.6"/></g><text class="i-lab" y="38">FOURTH WHEEL</text></g>
    <g transform="translate(-22,14)"><g id="a-escw"><path class="i-esc" d="${teeth}Z"/><circle class="i-line" r="5"/></g><circle class="i-dot" r="1.4"/><text class="i-lab" y="34">ESCAPE WHEEL</text></g>
    <g transform="translate(14,-14)"><g id="a-pal"><path class="i-fork" d="M0,0L26,-11M-16,10L0,0L-2,20M-18,8L-14,13M-5,21L1,19"/></g><circle class="i-dot" r="1.6"/><text class="i-lab" x="-4" y="-12">PALLET FORK</text></g>
    <g transform="translate(62,-22)"><path class="i-hair" d="${sp}"/><g id="a-bal"><circle class="i-bal" r="30"/><line class="i-rod" x1="-30" y1="0" x2="30" y2="0"/><circle class="i-pin" cx="-22" cy="9" r="1.8"/></g><circle class="i-dot" r="1.8"/><text class="i-lab" y="44">BALANCE WHEEL</text></g>
    <g transform="translate(-90,66)"><text class="i-lab left" y="-5">SECONDS HAND · ONE SECOND IN FIVE STEPS</text>${[0, 1, 2, 3, 4].map(i => `<rect class="i-step" data-i="${i}" x="${i * 36.4}" y="0" width="34" height="6"/>`).join('')}</g></svg>`;
})();
function anat(t) {
  A.t = t; const b = t / 200, idx = Math.min(4, Math.floor(b)), fr = b - idx, e = Math.min(1, fr / 0.14), steps = idx + e, th = 135 * Math.sin(Math.PI * b), moving = e < 1 && t < 1000;
  $('#a-bal').setAttribute('transform', `rotate(${f(th)})`); $('#a-pal').setAttribute('transform', `rotate(${f(7 * Math.tanh(7 * Math.sin(Math.PI * b)))})`);
  $('#a-escw').setAttribute('transform', `rotate(${f(steps * 12)})`); $('#a-four').setAttribute('transform', `rotate(${f(steps * 1.2)})`);
  $$('.i-step').forEach(s => s.classList.toggle('on', +s.dataset.i < Math.floor(steps + 0.001) || (+s.dataset.i === idx && e >= 1)));
  $('#a-ms').textContent = Math.round(t); $('#a-beat').textContent = `Beat ${idx + 1} of 5`;
  $('#a-energy').textContent = moving ? 'Flowing: one impulse' : 'Held back';
  $('#a-balt').textContent =`${Math.abs(th).toFixed(0)}° ${th >= 0 ? 'clockwise' : 'anticlockwise'} of centre`;
  $('#a-esc').textContent = moving ? 'Unlocked: giving impulse' : 'Locked';
  $('#a-train').textContent = `Escape wheel ${(steps * 12).toFixed(0)}° · fourth wheel ${(steps * 1.2).toFixed(1)}°`;
  $('#a-hand').textContent = `${(steps * 1.2).toFixed(1)}° of 6°`;
  $$('#a-chain li').forEach((li, i) => li.classList.toggle('hot', moving ? i !== 1 : i === 1));
}
function anatFrame(ms) { if (!A.on) return; const dt = ms - A.last; A.last = ms; let t = A.t + dt / 14; if (t > 1000) t = 0; $('#a-t').value = t; anat(t); requestAnimationFrame(anatFrame); } // one second played over fourteen
$('#a-t').addEventListener('input', e => anat(+e.target.value));
$('#a-go').addEventListener('click', e => { A.on = !A.on; e.currentTarget.textContent = A.on ? 'Pause' : 'Play slowly'; e.currentTarget.setAttribute('aria-pressed', A.on); if (A.on) { A.last = performance.now(); requestAnimationFrame(anatFrame); } });
anat(0);

/* =================== 4. the measure of time: live read-outs =================== */
const T0 = performance.now();
function measure() {
  const now = new Date(), ps = S.position(now, loc.lat, loc.lon), tai = new Date(now.getTime() + 37000);
  $('#ms-app').textContent = hms(ps.tst); $('#ms-mean').textContent = hms(ps.mean); $('#ms-sid').textContent = hms(S.sidereal(now, loc.lon));
  $('#ms-tai').textContent = `${pad(tai.getUTCHours())}:${pad(tai.getUTCMinutes())}:${pad(tai.getUTCSeconds())}`;
}
setInterval(() => { $('#ms-cs').textContent = Math.floor((performance.now() - T0) / 1000 * 9192631770).toLocaleString('en-US'); }, 90);

/* =================== 5. the sound of time: opt-in, synthesised =================== */
let ctx = null, master = null, stopT = null, noise = null;
function audio() { if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); noise = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
function burst(t, freq, dur, vol, out) { const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise; fl.type = 'bandpass'; fl.frequency.value = freq; fl.Q.value = 2.4; g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur); s.connect(fl); fl.connect(g); g.connect(out || master); s.start(t); s.stop(t + dur + 0.02); }
function bell(t, freq, dur, vol) { [[1, 1], [2.76, 0.42], [5.4, 0.2]].forEach(([m, a]) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = freq * m; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0006, t + dur / (m > 1 ? 2 : 1)); o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + 0.05); }); }
function click(t, accent) { audio(); burst(t, accent ? 2600 : 2000, 0.03, accent ? 0.9 : 0.6, ctx.destination); }
function stopAll() { if (master) { try { master.gain.setValueAtTime(0, ctx.currentTime); master.disconnect(); } catch (e) {} master = null; } clearTimeout(stopT); $('#snd-status').textContent = 'Silent.'; $('#snd-stop').disabled = true; $$('#sounds button').forEach(b => b.setAttribute('aria-pressed', 'false')); }
function begin(btn, text, dur) { stopAll(); audio(); master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination); $('#snd-status').textContent = text; $('#snd-stop').disabled = false; btn.setAttribute('aria-pressed', 'true'); stopT = setTimeout(stopAll, dur * 1000 + 400); return ctx.currentTime + 0.08; }
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
$('#sounds').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; if (b.getAttribute('aria-pressed') === 'true') return stopAll(); try { SOUNDS[b.dataset.snd](b); } catch (err) { $('#snd-status').textContent = 'This browser could not start audio.'; } });
$('#snd-stop').addEventListener('click', stopAll);

/* =================== 6. the cycles of time =================== */
const dayDial = S.mount($('#c-day'), { mini: true });
function nextCross(target, from) { // when the sun next reaches this longitude on the ecliptic
  const dv = t => mod(S.sun(new Date(t)).lam - target + 180, 360) - 180; let a = from, b;
  for (let i = 0; i < 380; i++) { b = a + 86400000; if (dv(a) < 0 && dv(b) >= 0) break; a = b; }
  for (let i = 0; i < 24; i++) { const mid = (a + b) / 2; if (dv(mid) < 0) a = mid; else b = mid; } return new Date(b);
}
function cycles() {
  const now = new Date(), p = S.parts(now, loc.tz), ev = S.day(p.y, p.m, p.d, loc), ps = S.position(now, loc.lat, loc.lon), north = loc.lat >= 0;
  dayDial.set(loc, now);
  $('#c-day-t').textContent = `Today at ${loc.name === 'Your location' ? 'your location' : loc.name} the sun is above the horizon for ${Math.floor(ev.length / 60)} h ${pad(Math.round(ev.length) % 60)} min. Noon to noon averages 24 hours. Measured against the stars, the Earth’s turn takes 3 minutes 56 seconds less.`;
  // the moon, drawn as it faces this hemisphere
  const mn = S.moon(now), fr = mn.fraction, wax = fr < 0.5, k = wax ? fr : 1 - fr, rx = f(34 * Math.abs(Math.cos(k * 2 * Math.PI))), flip = (wax ? 1 : -1) * (north ? 1 : -1);
  $('#c-moon').innerHTML = `<svg viewBox="-50 -50 100 100" class="inst"><circle class="mo-dark" r="34"/><path class="mo-lit" transform="scale(${flip},1)" d="M0,-34A34,34 0 0 1 0,34A${rx},34 0 0 ${k < 0.25 ? 0 : 1} 0,-34Z"/><circle class="i-line" r="34"/><circle class="i-line faint" r="42"/></svg>`;
  $('#c-moon-t').textContent = `${mn.name}: about ${Math.round(mn.lit * 100)}% lit, ${mn.age.toFixed(1)} days into a cycle of 29.53. Next full moon around ${dayMonth(mn.nextFull, loc.tz)}; next new moon around ${dayMonth(mn.nextNew, loc.tz)}. Twelve lunations make 354 days, eleven short of a year, so months and years never line up.`;
  // the Earth on its orbit, seen from above the north pole: it travels anticlockwise
  const th = (ps.lam + 180) * R, ex = f(36 * Math.cos(th)), ey = f(-36 * Math.sin(th));
  const pts = [['March equinox', 180], ['June solstice', 270], ['September equinox', 0], ['December solstice', 90]];
  $('#c-orbit').innerHTML = `<svg viewBox="-100 -58 200 116" class="inst"><circle class="i-line" r="36"/>${pts.map(([n, a]) => { const x = 36 * Math.cos(a * R), y = -36 * Math.sin(a * R), lx = 50 * Math.cos(a * R), ly = -47 * Math.sin(a * R); return `<circle class="i-dot" cx="${f(x)}" cy="${f(y)}" r="1.5"/><text class="i-lab ${a === 180 ? 'end' : a === 0 ? 'left' : ''}" x="${f(lx)}" y="${f(a % 180 ? ly + (a === 90 ? 0 : 3) : -1.5)}">${a % 180 ? n.toUpperCase() : n.toUpperCase().split(' ').map((w, i) => `<tspan x="${f(lx)}" dy="${i ? '1.1em' : 0}">${w}</tspan>`).join('')}</text>`; }).join('')}
    <circle class="or-sun" r="6"/>${[0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line class="or-ray" x1="${f(8 * Math.cos(a * R))}" y1="${f(8 * Math.sin(a * R))}" x2="${f(11 * Math.cos(a * R))}" y2="${f(11 * Math.sin(a * R))}"/>`).join('')}
    <line class="or-spoke" x1="0" y1="0" x2="${ex}" y2="${ey}"/><circle class="or-earth" cx="${ex}" cy="${ey}" r="4.2"/><path class="or-arrow" d="M-26,-30A40,40 0 0 0 -39,-9" marker-end=""/></svg>`;
  const q = Math.floor(ps.lam / 90), season = (north ? ['spring', 'summer', 'autumn', 'winter'] : ['autumn', 'winter', 'spring', 'summer'])[q], doy = doyOf(p);
  $('#c-orbit-t').textContent = `Day ${doy} of ${daysIn(p.y)}. The sun stands overhead at latitude ${Math.abs(ps.decl).toFixed(1)}° ${ps.decl >= 0 ? 'north' : 'south'}, so it is ${season} at ${loc.name === 'Your location' ? 'your location' : loc.name}. The seasons come from the 23.4° tilt of the Earth’s axis, not from its distance to the sun: the Earth is closest in early January. The year of the seasons is 365.2422 days long, which is why calendars need leap years.`;
  const mean = [north ? 'spring begins' : 'autumn begins', north ? 'the longest day' : 'the shortest day', north ? 'autumn begins' : 'spring begins', north ? 'the shortest day' : 'the longest day'];
  $('#c-next').innerHTML = [0, 90, 180, 270].map((t, i) => ({ d: nextCross(t, now.getTime()), n: pts[i][0], m: mean[i] })).sort((a, b) => a.d - b.d).map(x => `<li><b>${dayMonth(x.d, loc.tz)}</b><span>${x.n}: ${x.m}</span><em>about ${S.clock(x.d, loc.tz)}</em></li>`).join('');
}

/* =================== start =================== */
setLoc(loc, loc.rough ? 'Placed on the meridian your time zone implies. Choose a place or share your location for a true reading.' : 'Chosen from your time zone. Nothing about your position leaves this page.');
setInterval(() => { if (live) render(); measure(); }, 1000);
setInterval(cycles, 60000);
window.__time = { get loc() { return loc; }, get last() { return last; }, render, setLoc };
})();
