/* The Nature of Time: astronomy and the solar dial.
   Solar position follows the NOAA Global Monitoring Laboratory method (after Meeus,
   Astronomical Algorithms): good to about a minute of time at ordinary latitudes.
   Longitude is east-positive. Sunrise and sunset use the standard -0.833 degrees. */
(function () {
'use strict';
const R = Math.PI / 180, D = 180 / Math.PI, mod = (a, n) => ((a % n) + n) % n, f = n => Math.round(n * 100) / 100;

// Fallback places, used when the visitor's own position is not shared. [name, lat, lon, IANA zone]
const CITIES = [
  ['Geneva', 46.20, 6.14, 'Europe/Zurich'], ['London', 51.51, -0.13, 'Europe/London'], ['Paris', 48.86, 2.35, 'Europe/Paris'], ['Berlin', 52.52, 13.40, 'Europe/Berlin'],
  ['Madrid', 40.42, -3.70, 'Europe/Madrid'], ['Rome', 41.90, 12.50, 'Europe/Rome'], ['Stockholm', 59.33, 18.07, 'Europe/Stockholm'], ['Reykjavik', 64.15, -21.94, 'Atlantic/Reykjavik'],
  ['Moscow', 55.76, 37.62, 'Europe/Moscow'], ['Cairo', 30.04, 31.24, 'Africa/Cairo'], ['Nairobi', -1.29, 36.82, 'Africa/Nairobi'], ['Johannesburg', -26.20, 28.05, 'Africa/Johannesburg'],
  ['Dubai', 25.20, 55.27, 'Asia/Dubai'], ['Mumbai', 19.08, 72.88, 'Asia/Kolkata'], ['Singapore', 1.35, 103.82, 'Asia/Singapore'], ['Hong Kong', 22.32, 114.17, 'Asia/Hong_Kong'],
  ['Tokyo', 35.68, 139.69, 'Asia/Tokyo'], ['Seoul', 37.57, 126.98, 'Asia/Seoul'], ['Sydney', -33.87, 151.21, 'Australia/Sydney'], ['Auckland', -36.85, 174.76, 'Pacific/Auckland'],
  ['Honolulu', 21.31, -157.86, 'Pacific/Honolulu'], ['Anchorage', 61.22, -149.90, 'America/Anchorage'], ['Vancouver', 49.28, -123.12, 'America/Vancouver'], ['Los Angeles', 34.05, -118.24, 'America/Los_Angeles'],
  ['Denver', 39.74, -104.99, 'America/Denver'], ['Chicago', 41.88, -87.63, 'America/Chicago'], ['Mexico City', 19.43, -99.13, 'America/Mexico_City'], ['New York', 40.71, -74.01, 'America/New_York'],
  ['Toronto', 43.65, -79.38, 'America/Toronto'], ['São Paulo', -23.55, -46.63, 'America/Sao_Paulo'], ['Buenos Aires', -34.60, -58.38, 'America/Argentina/Buenos_Aires']
].map(c => ({ name: c[0], lat: c[1], lon: c[2], tz: c[3] }));

/* ---------- civil time in a named zone ---------- */
const fmts = {};
function parts(date, tz) {
  const F = fmts[tz] || (fmts[tz] = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const o = {}; F.formatToParts(date).forEach(p => { o[p.type] = +p.value; });
  return { y: o.year, m: o.month, d: o.day, h: o.hour % 24, mi: o.minute, s: o.second };
}
const tzOffset = (date, tz) => { const p = parts(date, tz); return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) - Math.floor(date.getTime() / 1000) * 1000) / 60000; };
function instant(y, m, d, minutes, tz) { // the moment at which the zone's clocks read this date and time
  const t = Date.UTC(y, m - 1, d, 0, minutes); let off = tzOffset(new Date(t), tz); off = tzOffset(new Date(t - off * 60000), tz);
  return new Date(t - off * 60000);
}
const pad = n => String(n).padStart(2, '0');
const clock = (date, tz, secs) => { if (!date) return '-'; const p = parts(date, tz); return `${pad(p.h)}:${pad(p.mi)}${secs ? ':' + pad(p.s) : ''}`; };
const hm = minutes => { const m = Math.round(mod(minutes, 1440)); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; };

/* ---------- the sun ---------- */
function sun(date) {
  const T = (date.getTime() / 86400000 + 2440587.5 - 2451545) / 36525;
  const L0 = mod(280.46646 + T * (36000.76983 + T * 0.0003032), 360), M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = Math.sin(M * R) * (1.914602 - T * (0.004817 + 0.000014 * T)) + Math.sin(2 * M * R) * (0.019993 - 0.000101 * T) + Math.sin(3 * M * R) * 0.000289;
  const om = 125.04 - 1934.136 * T, lam = L0 + C - 0.00569 - 0.00478 * Math.sin(om * R);
  const eps = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60 + 0.00256 * Math.cos(om * R);
  const decl = Math.asin(Math.sin(eps * R) * Math.sin(lam * R)) * D, y = Math.tan(eps * R / 2) ** 2;
  const eot = 4 * D * (y * Math.sin(2 * L0 * R) - 2 * e * Math.sin(M * R) + 4 * e * y * Math.sin(M * R) * Math.cos(2 * L0 * R) - 0.5 * y * y * Math.sin(4 * L0 * R) - 1.25 * e * e * Math.sin(2 * M * R));
  return { decl, eot, lam: mod(lam, 360), tilt: eps };
}
function position(date, lat, lon) {
  const s = sun(date), utc = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60 + date.getUTCMilliseconds() / 60000;
  const tst = mod(utc + s.eot + 4 * lon, 1440), ha = tst / 4 - 180;
  const alt = Math.asin(Math.sin(lat * R) * Math.sin(s.decl * R) + Math.cos(lat * R) * Math.cos(s.decl * R) * Math.cos(ha * R)) * D;
  const az = mod(Math.atan2(Math.sin(ha * R), Math.cos(ha * R) * Math.sin(lat * R) - Math.tan(s.decl * R) * Math.cos(lat * R)) * D + 180, 360);
  return { alt, az, ha, tst, mean: mod(utc + 4 * lon, 1440), decl: s.decl, eot: s.eot, lam: s.lam };
}
// The events of one civil day at a place. Times are Date objects, or null when the event does not happen.
function day(y, m, d, loc) {
  let base = Date.UTC(y, m - 1, d);
  const s0 = sun(new Date(base + 43200000 - loc.lon * 240000));
  let noon = base + (720 - 4 * loc.lon - s0.eot) * 60000;
  const p = parts(new Date(noon), loc.tz), diff = Math.round((Date.UTC(p.y, p.m - 1, p.d) - base) / 86400000);
  if (diff) { noon -= diff * 86400000; }
  const s = sun(new Date(noon)), cosH = h0 => (Math.sin(h0 * R) - Math.sin(loc.lat * R) * Math.sin(s.decl * R)) / (Math.cos(loc.lat * R) * Math.cos(s.decl * R));
  const span = h0 => { const c = cosH(h0); return c > 1 ? null : c < -1 ? Infinity : Math.acos(c) * D * 4; }; // minutes either side of noon
  const ev = h0 => { const w = span(h0); return (w == null || w === Infinity) ? [null, null] : [new Date(noon - w * 60000), new Date(noon + w * 60000)]; };
  const [rise, set] = ev(-0.833), [dawn, dusk] = ev(-6), w = span(-0.833);
  return { noon: new Date(noon), rise, set, dawn, dusk, length: w == null ? 0 : w === Infinity ? 1440 : 2 * w, polar: w == null ? 'night' : w === Infinity ? 'day' : null, decl: s.decl, eot: s.eot };
}
function phase(alt, ha) {
  if (alt > -0.833) return ha < 0 ? 'Daylight, morning' : 'Daylight, afternoon';
  const side = ha < 0 ? 'dawn' : 'dusk';
  return alt > -6 ? `Civil twilight, ${side}` : alt > -12 ? `Nautical twilight, ${side}` : alt > -18 ? `Astronomical twilight, ${side}` : 'Night';
}
const band = alt => alt > -0.833 ? 'day' : alt > -6 ? 'civ' : alt > -12 ? 'nau' : alt > -18 ? 'ast' : 'night';

/* ---------- other clocks in the sky ---------- */
function sidereal(date, lon) { const d = date.getTime() / 86400000 + 2440587.5 - 2451545; return mod(280.46061837 + 360.98564736629 * d + lon, 360) / 15 * 60; } // minutes
const SYNODIC = 29.530588853;
function moon(date) { // mean lunation: phase names are right to within about a day
  const age = mod((date.getTime() - Date.UTC(2000, 0, 6, 18, 14)) / 86400000, SYNODIC), fr = age / SYNODIC;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  const next = target => new Date(date.getTime() + mod(target - fr, 1) * SYNODIC * 86400000);
  return { age, fraction: fr, lit: (1 - Math.cos(fr * 2 * Math.PI)) / 2, name: names[Math.round(fr * 8) % 8], nextNew: next(0), nextFull: next(0.5) };
}

/* ---------- where is the visitor, without asking ---------- */
function guess() {
  let tz = 'Europe/Zurich'; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}
  const hit = CITIES.find(c => c.tz === tz); if (hit) return Object.assign({ guessed: true }, hit);
  // Unknown zone: place the visitor on the meridian their standard time implies, at a temperate latitude, and keep their own zone.
  const jan = -new Date(new Date().getFullYear(), 0, 1).getTimezoneOffset(), jul = -new Date(new Date().getFullYear(), 6, 1).getTimezoneOffset(), std = Math.min(jan, jul);
  return { name: tz.split('/').pop().replace(/_/g, ' '), lat: jan < jul ? 45 : jan > jul ? -35 : 20, lon: std / 4, tz, guessed: true, rough: true };
}

/* ---------- the dial ---------- */
const P = (a, r) => [f(r * Math.sin(a * R)), f(-r * Math.cos(a * R))];
const ang = minutes => minutes / 1440 * 360 + 180; // midnight at the foot of the dial, noon at the top
function mount(el, opt = {}) {
  const mini = !!opt.mini;
  el.innerHTML = `<svg class="sol${mini ? ' mini' : ''}" viewBox="${mini ? '-112 -112 224 224' : '-121 -121 242 242'}" role="img" aria-label="Solar clock"><g class="sol-static"></g><g class="sol-live"></g></svg>`;
  const S = el.querySelector('.sol-static'), L = el.querySelector('.sol-live'), svg = el.querySelector('svg');
  let key = '', base = 0, loc = null, south = false, sky = [];
  const skyXY = (alt, az) => { const a = south ? mod(az + 180, 360) - 180 : az - 180, x = (south ? -1 : 1) * a / 125 * 56; return [f(Math.max(-60, Math.min(60, x))), f(10 - alt / 90 * 56)]; };
  function drawStatic(l, p, ev) {
    loc = l; south = l.lat < 0; base = instant(p.y, p.m, p.d, 0, l.tz).getTime();
    let s = `<circle class="sol-case" r="108"/><circle class="sol-rim" r="100.5"/>`;
    for (let i = 0; i < 288; i++) { // five-minute slices of the day, shaded by how far the sun is above or below the horizon
      const t = new Date(base + (i * 5 + 2.5) * 60000), a0 = ang(i * 5) - 0.05, a1 = ang(i * 5 + 5) + 0.05, p0 = P(a0, 90), p1 = P(a1, 90);
      s += `<path class="sg sg-${band(position(t, l.lat, l.lon).alt)}" d="M${p0}A90,90 0 0 1 ${p1}"/>`;
    }
    s += `<circle class="sol-line" r="97.5"/><circle class="sol-line" r="82.5"/>`;
    for (let h = 0; h < 24; h++) { const a = ang(h * 60), q0 = P(a, 82.5), q1 = P(a, h % 3 ? 79.5 : 77); s += `<line class="sol-tick" x1="${q0[0]}" y1="${q0[1]}" x2="${q1[0]}" y2="${q1[1]}"/>`; if (h % 3 === 0 && !mini) { const q = P(a, 71.5); s += `<text class="sol-num" x="${q[0]}" y="${q[1]}">${pad(h)}</text>`; } }
    const mark = (date, label, cls) => { if (!date) return ''; const a = ang((date.getTime() - base) / 60000), q0 = P(a, 82.5), q1 = P(a, 106), q = P(a, 114.5); return `<line class="sol-ev ${cls}" x1="${q0[0]}" y1="${q0[1]}" x2="${q1[0]}" y2="${q1[1]}"/>` + (mini ? '' : `<text class="sol-evt" x="${q[0]}" y="${q[1]}" transform="rotate(${f(a > 90 && a < 270 ? a - 180 : a)} ${q[0]} ${q[1]})">${label}</text>`); };
    s += mark(ev.rise, 'RISE', 'r') + mark(ev.noon, 'NOON', 'n') + mark(ev.set, 'SET', 's');
    // the sky as the visitor would face it: the sun's path for this day, horizon across the middle
    sky = []; let d = '';
    for (let i = 0; i <= 144; i++) { const ps = position(new Date(base + i * 10 * 60000), l.lat, l.lon), xy = skyXY(ps.alt, ps.az); if (i && Math.abs(xy[0] - sky[sky.length - 1][0]) > 40) d += `M${xy}`; else d += (i ? 'L' : 'M') + xy; sky.push(xy); }
    const id = 's' + Math.random().toString(36).slice(2, 8);
    s += `<defs><clipPath id="${id}a"><rect x="-64" y="-64" width="128" height="74"/></clipPath><clipPath id="${id}b"><rect x="-64" y="10" width="128" height="54"/></clipPath><clipPath id="${id}c"><circle r="63"/></clipPath></defs>`;
    s += `<g clip-path="url(#${id}c)"><rect class="sol-ground" x="-64" y="10" width="128" height="54"/><path class="sol-path up" d="${d}" clip-path="url(#${id}a)"/><path class="sol-path down" d="${d}" clip-path="url(#${id}b)"/><line class="sol-hz" x1="-64" y1="10" x2="64" y2="10"/></g><circle class="sol-line" r="63"/>`;
    if (!mini) s += `<text class="sol-card" x="-52" y="18">${south ? 'W' : 'E'}</text><text class="sol-card" x="52" y="18">${south ? 'E' : 'W'}</text><text class="sol-card" x="0" y="18">${south ? 'N' : 'S'}</text>`;
    S.innerHTML = s;
  }
  return {
    // Draw the dial for a place and a moment. Returns what it worked out, for the read-outs.
    set(l, date) {
      const p = parts(date, l.tz), k = [l.lat, l.lon, l.tz, p.y, p.m, p.d].join('|'), ev = day(p.y, p.m, p.d, l);
      if (k !== key) { key = k; drawStatic(l, p, ev); }
      const ps = position(date, l.lat, l.lon), minutes = (date.getTime() - base) / 60000, a = ang(minutes), q = P(a, 90), h0 = P(a, 64), h1 = P(a, 82), xy = skyXY(ps.alt, ps.az), up = ps.alt > -0.833;
      L.innerHTML = `<line class="sol-hand" x1="${h0[0]}" y1="${h0[1]}" x2="${h1[0]}" y2="${h1[1]}"/><circle class="sol-sun-ring ${up ? 'up' : 'down'}" cx="${q[0]}" cy="${q[1]}" r="5.4"/><circle class="sol-sun ${up ? 'up' : 'down'}" cx="${xy[0]}" cy="${xy[1]}" r="${mini ? 4 : 3.4}"/>`
        + (mini ? '' : `<text class="sol-time" x="0" y="38">${clock(date, l.tz)}</text>${(w => w.length > 1 ? `<text class="sol-phase two" x="0" y="46.5">${w[0]}<tspan x="0" dy="1.08em">${w.slice(1).join(' ')}</tspan></text>` : `<text class="sol-phase" x="0" y="48.5">${w[0]}</text>`)(phase(ps.alt, ps.ha).split(',')[0].toUpperCase().split(' '))}`);
      svg.setAttribute('aria-label', `Solar clock for ${l.name}: ${clock(date, l.tz)}, ${phase(ps.alt, ps.ha).toLowerCase()}. Sunrise ${clock(ev.rise, l.tz)}, solar noon ${clock(ev.noon, l.tz)}, sunset ${clock(ev.set, l.tz)}.`);
      return { parts: p, ev, pos: ps, phase: phase(ps.alt, ps.ha) };
    }
  };
}

/* A click (or Enter) on a dial opens a short guide to its parts. One dialog is shared by every dial on the page. */
function guide(el) {
  let pop = document.getElementById('dial-pop');
  if (!pop) {
    document.body.insertAdjacentHTML('beforeend', `<dialog class="dial-pop" id="dial-pop" aria-labelledby="dp-h"><button type="button" class="dp-x" id="dp-x" aria-label="Close">×</button><h3 id="dp-h">How to read this clock</h3><ul><li><i class="dp-ring"></i><p><b>The ring is one day.</b> Midnight at the bottom, midday at the top. Gold is daylight, dark blue is night.</p></li><li><i class="dp-now"></i><p><b>The small circle is now.</b> It goes once round the ring every 24 hours.</p></li><li><i class="dp-marks"></i><p><b>Rise, noon and set</b> mark today’s sunrise, the sun’s highest point and sunset.</p></li><li><i class="dp-sky"></i><p><b>The middle is the sky.</b> The curve is the sun’s path today. The line across is the horizon, and the dot is the sun.</p></li></ul></dialog>`);
    pop = document.getElementById('dial-pop');
    pop.querySelector('#dp-x').addEventListener('click', () => pop.close());
    pop.addEventListener('click', e => { if (e.target === pop) pop.close(); }); // a click on the dimmed page behind closes it
  }
  const open = () => { if (pop.showModal) pop.showModal(); else pop.setAttribute('open', ''); };
  el.setAttribute('role', 'button'); el.setAttribute('tabindex', '0'); el.setAttribute('aria-haspopup', 'dialog'); el.setAttribute('aria-controls', 'dial-pop'); el.setAttribute('title', 'How to read this clock'); el.classList.add('dial-btn');
  el.addEventListener('click', e => { e.preventDefault(); open(); });
  el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
}
window.Sol = { CITIES, parts, instant, tzOffset, clock, hm, sun, position, day, phase, sidereal, moon, guess, mount, guide, SYNODIC };
})();
