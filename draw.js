/* The Shape of Time: technical illustration engine.
   Everything is drawn in millimetres from the plate data; nothing is traced.
   These are modern interpretive drawings, not manufacturer documents. */
(function () {
'use strict';
const D = Math.PI / 180, f = n => Math.round(n * 100) / 100;
const P = (a, r, cx = 0, cy = 0) => [f(cx + r * Math.sin(a * D)), f(cy - r * Math.cos(a * D))];
let uid = 0;
const C = (r, cx = 0, cy = 0, c = 'l', x = '') => `<circle class="${c}" cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" ${x}/>`;
const L = (x1, y1, x2, y2, c = 'l') => `<line class="${c}" x1="${f(x1)}" y1="${f(y1)}" x2="${f(x2)}" y2="${f(y2)}"/>`;
const Pa = (d, c = 'l', x = '') => `<path class="${c}" d="${d}" ${x}/>`;
const T = (s, x, y, sz, c = 'tx', x2 = '') => `<text class="${c}" x="${f(x)}" y="${f(y)}" font-size="${f(sz)}" text-anchor="middle" ${x2}>${s}</text>`;
const RC = (x, y, w, h, c = 'p', rx = 0, x2 = '') => `<rect class="${c}" x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}" ${x2}/>`;
const rad = (a, r1, r2, c = 'l', cx = 0, cy = 0) => { const p = P(a, r1, cx, cy), q = P(a, r2, cx, cy); return L(p[0], p[1], q[0], q[1], c); };
const circD = (r, cx = 0, cy = 0) => `M${f(cx - r)},${f(cy)}a${f(r)},${f(r)} 0 1,0 ${f(2 * r)},0a${f(r)},${f(r)} 0 1,0 ${f(-2 * r)},0Z`;
const rrD = (hw, hh, r) => `M${f(-hw + r)},${f(-hh)}H${f(hw - r)}Q${f(hw)},${f(-hh)} ${f(hw)},${f(-hh + r)}V${f(hh - r)}Q${f(hw)},${f(hh)} ${f(hw - r)},${f(hh)}H${f(-hw + r)}Q${f(-hw)},${f(hh)} ${f(-hw)},${f(hh - r)}V${f(-hh + r)}Q${f(-hw)},${f(-hh)} ${f(-hw + r)},${f(-hh)}Z`;
const polyD = pts => 'M' + pts.map(p => p.join(',')).join('L') + 'Z';
const rectEdge = (hw, hh) => a => { const s = Math.abs(Math.sin(a * D)), c = Math.abs(Math.cos(a * D)); return Math.min(s > 1e-6 ? hw / s : 1e9, c > 1e-6 ? hh / c : 1e9); };
const svg = (vb, s, cls, label) => `<svg class="${cls}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label || ''}">${s}</svg>`;
const mirror4 = one => [[1, 1], [-1, 1], [1, -1], [-1, -1]].map(s => `<g transform="scale(${s})">${one}</g>`).join('');
const star = (cx, cy, r, c = 'k') => { const p = []; for (let i = 0; i < 10; i++) p.push(P(i * 36, i % 2 ? r * 0.42 : r, cx, cy)); return Pa(polyD(p), c); };
const bps = w => w.mv.vph ? w.mv.vph / 3600 : 0;

const SQ_D = 'M-17,-19.5Q0,-20.5 17,-19.5Q19.5,-19.5 19.5,-17Q20.5,0 19.5,17Q19.5,19.5 17,19.5Q0,20.5 -17,19.5Q-19.5,19.5 -19.5,17Q-20.5,0 -19.5,-17Q-19.5,-19.5 -17,-19.5Z';
const RO_D = 'M-13.5,-23H13.5L19.5,-12V12L13.5,23H-13.5L-19.5,12V-12Z';
const SH_D = 'M-12.5,-18C2.3,-19.4 16,-9 19.4,0C16,9 2.3,19.4 -12.5,18C-10.3,7 -10.3,-7 -12.5,-18Z';
const SH_DIAL = 'M-9.4,-14.4C2.4,-15.5 13.4,-7.2 16.1,0C13.4,7.2 2.4,15.5 -9.4,14.4C-7.6,5.6 -7.6,-5.6 -9.4,-14.4Z';

/* ---------- geometry ---------- */
function geo(w) {
  const c = w.c, g = { shape: c.shape };
  if (c.shape === 'round' || c.shape === 'cushion') {
    const R = c.d / 2, bw = w.bezel ? w.bezel.w : 1.2, cu = c.shape === 'cushion';
    g.hw = R; g.hh = cu ? R * 1.12 : R; g.bezR = cu ? R * 0.9 : R; g.dialR = g.bezR - bw - 0.5;
    g.outline = cu ? rrD(R, g.hh, R * 0.6) : circD(R); g.dial = circD(g.dialR);
    g.lugW = c.lug ? c.lug[0] : 20; g.l2l = cu ? g.hh * 2 : c.d * 1.2;
    let fl = 0; if (w.dial.flange) fl = 1.7; if (w.dial.sliderule) fl = 4.6;
    g.inR = g.dialR - fl; g.edge = () => g.inR; g.hl = g.inR * 0.9; g.lugs = !cu; g.cwh = g.hh; g.dw = g.dialR;
  } else if (c.shape === 'tank') {
    g.hw = c.w / 2; g.hh = c.h / 2; g.bw = 2.7; g.bodyH = g.hh * 0.8;
    g.dhw = g.hw - g.bw - 0.6; g.dhh = g.bodyH - 1.1;
    g.outline = rrD(g.hw, g.hh, 1.3); g.dial = rrD(g.dhw, g.dhh, 0.4); g.edge = rectEdge(g.dhw, g.dhh);
    g.hl = g.dhw * 0.9; g.lugW = 2 * (g.hw - g.bw) - 0.3; g.l2l = c.h; g.lugs = false; g.cwh = g.hh; g.dw = g.dhw;
    g.bhw = g.dhw + 0.4; g.bhh = g.bodyH - 0.8;
  } else if (c.shape === 'reverso') {
    g.hw = c.w / 2; g.hh = c.h / 2; g.bodyH = 15.4; g.dhw = 8.8; g.dhh = 10.4;
    g.outline = rrD(g.hw, g.bodyH, 1.1); g.dial = rrD(g.dhw, g.dhh, 0.4); g.edge = rectEdge(g.dhw, g.dhh);
    g.hl = g.dhw * 0.86; g.lugW = 14.4; g.l2l = c.h; g.lugs = true; g.cwh = g.bodyH; g.dw = g.dhw;
    g.bhw = g.hw - 1.3; g.bhh = g.bodyH - 1.3;
  } else if (c.shape === 'square') {
    g.hw = g.hh = c.d / 2; g.outline = SQ_D; g.dial = rrD(15.4, 15.4, 2.4);
    g.inR = 13.4; g.edge = () => g.inR; g.hl = 12; g.lugW = c.lug[0]; g.l2l = 46; g.lugs = true; g.cwh = g.hh; g.dw = 15.4;
  } else if (c.shape === 'octagon') {
    g.hw = g.hh = c.d / 2; g.outline = RO_D; g.dialR = 13.9; g.dial = circD(13.9); g.bezR = 19.75;
    g.inR = 13.9; g.edge = () => g.inR; g.hl = 12.4; g.lugW = 22; g.l2l = 46; g.lugs = true; g.cwh = g.hh; g.dw = 13.9;
  } else { // shield
    g.hw = 19.4; g.x0 = -12.5; g.hh = 18; g.outline = SH_D; g.dial = SH_DIAL;
    g.inR = 7.6; g.edge = () => g.inR; g.hl = 6.9; g.lugW = 17; g.l2l = c.h; g.lugs = true; g.cwh = 18; g.dw = 16; g.crx = 18.8; g.lr = 0.62;
  }
  g.strapEnd = g.l2l / 2 + (c.shape === 'octagon' ? 10 : 6);
  return g;
}

/* ---------- case furniture ---------- */
function strap(w, g, y0, yE) {
  const hw = f(g.lugW / 2 - 0.15), st = w.strap;
  let s = Pa(`M${-hw},${f(y0)}V${f(yE)}C${f(-hw / 3)},${f(yE + 1.5)} ${f(hw / 3)},${f(yE - 1.5)} ${hw},${f(yE)}V${f(y0)}Z`, 'p');
  if (st === 'leather') s += Pa(`M${f(-hw + 0.9)},${f(y0)}V${f(yE - 0.4)}M${f(hw - 0.9)},${f(y0)}V${f(yE + 0.4)}`, 't dash');
  else if (st === 'oyster' || st === 'flat') {
    const a = hw / 2.6; s += L(-a, y0, -a, yE - 0.7, 't') + L(a, y0, a, yE + 0.7, 't');
    for (let y = y0 + 2.2; y < yE - 1.4; y += 3.2) s += L(-hw, y, -a, y, 't') + L(a, y, hw, y, 't') + L(-a, y + 1.6, a, y + 1.6, 't');
  } else if (st === 'tropic') {
    for (let y = y0 + 2.5; y < yE - 1.6; y += 2.4) s += C(0.45, -hw / 2, y, 't') + C(0.45, hw / 2, y, 't') + C(0.45, 0, y + 1.2, 't');
  }
  return s;
}
const strapBoth = (w, g, y0) => { const b = strap(w, g, y0, g.strapEnd); return b + `<g transform="scale(1,-1)">${b}</g>`; };

function lugs(w, g) {
  const R = g.hw, xi = f(g.lugW / 2), xo = f(xi + 2.5), yE = f(g.l2l / 2), y0 = f(Math.sqrt(Math.max(R * R - xi * xi, 1)) * 0.9);
  let d;
  if (w.c.straight) d = `M${xi},${y0}V${f(yE - 0.5)}Q${xi},${yE} ${f(xi + 0.5)},${yE}H${f(xo - 0.6)}Q${xo},${yE} ${xo},${f(yE - 0.6)}V${f(y0 * 0.5)}Z`;
  else if (w.c.lyre) d = `M${xi},${y0}V${f(yE - 0.5)}Q${xi},${yE} ${f(xi + 0.5)},${yE}H${f(xo - 0.9)}Q${f(xo - 0.1)},${yE} ${xo},${f(yE - 0.9)}Q${f(xo + 0.5)},${f(y0 + 1)} ${f(xo + 3.4)},${f(y0 * 0.45)}Z`;
  else d = `M${xi},${y0}V${f(yE - 0.5)}Q${xi},${yE} ${f(xi + 0.5)},${yE}H${f(xo - 0.7)}Q${xo},${yE} ${f(xo + 0.1)},${f(yE - 0.7)}L${f(xo + 1.6)},${f(y0 * 0.5)}Z`;
  let one = Pa(d, 'p');
  if (w.c.lyre) one += Pa(`M${f(xi + 0.9)},${f(yE - 0.4)}Q${f(xi + 1.6)},${f(y0 + 2)} ${f(xo + 2.2)},${f(y0 * 0.62)}`, 't');
  return mirror4(one);
}

function crown(w, g) {
  const cr = w.crown; if (!cr.pos) return '';
  const len = cr.big ? 3.3 : cr.small ? 1.9 : 2.7, h = cr.big ? 3.1 : cr.small ? 1.7 : 2.5, x0 = f((g.crx || g.hw) - 0.6);
  let s = '';
  if (cr.guards) { const gd = Pa(`M${f(x0 - 1.2)},${f(-h - 2.8)}Q${f(x0 + 2)},${f(-h - 1.7)} ${f(x0 + 2.1)},${f(-h - 0.3)}V${f(-h + 0.3)}H${f(x0 - 1.2)}Z`, 'p'); s += gd + `<g transform="scale(1,-1)">${gd}</g>`; }
  s += RC(x0, -h, len + 0.6, 2 * h, 'p', 0.5);
  for (let y = -h + 0.5; y < h - 0.2; y += 0.55) s += L(x0 + 0.9, y, x0 + len + 0.6, y, 't');
  if (cr.cabochon) s += Pa(`M${f(x0 + len + 0.6)},-1.15Q${f(x0 + len + 2.2)},0 ${f(x0 + len + 0.6)},1.15Z`, 'k');
  return cr.pos === 9 ? `<g transform="scale(-1,1)">${s}</g>` : s;
}

function pushers(w, g) {
  if (!w.pushers) return '';
  const scr = w.pushers === 'screw';
  const one = x => { let s = RC(x - 0.6, -0.75, 1.8, 1.5) + RC(x + 1, scr ? -1.6 : -1.3, scr ? 2.1 : 1.5, scr ? 3.2 : 2.6, 'p', 0.35); if (scr) for (let y = -1.2; y < 1.5; y += 0.5) s += L(x + 1.2, y, x + 3, y, 't'); return s; };
  if (g.shape === 'square') return [-8.5, 8.5].map(y => `<g transform="translate(0,${y})">${one(g.hw)}</g>`).join('');
  const r = g.shape === 'cushion' ? g.hw + 0.9 : g.hw - 0.2;
  return [60, 120].map(a => `<g transform="rotate(${a - 90})">${one(r)}</g>`).join('');
}

function base(w, g) {
  const sh = g.shape; let s = '';
  if (sh === 'round' || sh === 'cushion') {
    s += strapBoth(w, g, g.hh * 0.8); if (g.lugs) s += lugs(w, g);
    s += crown(w, g) + pushers(w, g) + Pa(g.outline, 'p');
  } else if (sh === 'tank') {
    s += strapBoth(w, g, g.bodyH - 1) + crown(w, g) + RC(-g.hw + g.bw - 0.2, -g.bodyH, 2 * (g.hw - g.bw) + 0.4, 2 * g.bodyH, 'p', 0.3);
    s += RC(-g.hw, -g.hh, g.bw, 2 * g.hh, 'p', 1.25) + RC(g.hw - g.bw, -g.hh, g.bw, 2 * g.hh, 'p', 1.25);
  } else if (sh === 'reverso') {
    s += strapBoth(w, g, g.bodyH - 1) + mirror4(RC(7.2, g.bodyH - 1, 2.6, g.hh - g.bodyH + 1, 'p', 0.5)) + crown(w, g) + Pa(g.outline, 'p');
    for (let k = 0; k < 3; k++) { const y = g.dhh + 1.1 + k * 0.95; s += L(-g.hw + 0.9, y, g.hw - 0.9, y) + L(-g.hw + 0.9, -y, g.hw - 0.9, -y); }
  } else if (sh === 'square') {
    s += strapBoth(w, g, 16) + mirror4(RC(g.lugW / 2, 16, 2.6, 7, 'p', 0.6)) + crown(w, g) + pushers(w, g) + Pa(SQ_D, 'p');
  } else if (sh === 'octagon') {
    const yE = g.strapEnd, xa = y => 13.5 - (y - 16) * (2.3 / (yE - 16));
    let b = Pa(`M-13.5,16L-11.2,${yE}C-4,${f(yE + 1.5)} 4,${f(yE - 1.5)} 11.2,${yE}L13.5,16Z`, 'p');
    for (let y = 24.6; y < yE - 1.2; y += 2.7) b += L(-xa(y), y, xa(y), y, 't') + L(-4.2, y, -4.2, y + 2.7 > yE - 1.2 ? yE - 0.6 : y + 2.7, 't') + L(4.2, y, 4.2, y + 2.7 > yE - 1.2 ? yE + 0.6 : y + 2.7, 't');
    s += b + `<g transform="scale(1,-1)">${b}</g>`;
    let cr = RC(18.9, -2.3, 3, 4.6, 'p', 0.4) + L(19.5, -1.15, 21.9, -1.15, 't') + L(19.5, 1.15, 21.9, 1.15, 't');
    s += cr + Pa(RO_D, 'p');
  } else {
    s += `<g transform="translate(-1.5,0)">${strapBoth(w, g, 13)}</g>`;
    s += [1, -1].map(sy => `<g transform="scale(1,${sy})">${RC(-10.6, 11, 2.7, 14, 'p', 0.5)}${RC(5.2, 11, 2.7, 14, 'p', 0.5)}${L(-10.6, 21.5, -7.9, 21.5, 't')}${L(5.2, 21.5, 7.9, 21.5, 't')}</g>`).join('');
    s += crown(w, g) + Pa(SH_D, 'p');
  }
  return s;
}

/* ---------- bezel ---------- */
const TACHY = [500, 400, 300, 250, 200, 175, 150, 130, 120, 110, 100, 90, 80, 70, 65, 60];
function bezel(w, g) {
  let s = '';
  if (g.shape === 'octagon') {
    const pts = []; for (let k = 0; k < 8; k++) pts.push(P(22.5 + 45 * k, g.bezR));
    s += Pa(polyD(pts), 'p') + C(14.7, 0, 0, 'l');
    for (let k = 0; k < 8; k++) {
      const a = 22.5 + 45 * k, [cx, cy] = P(a, 16.9), hx = [];
      for (let j = 0; j < 6; j++) hx.push(P(a + j * 60, 1, cx, cy));
      s += Pa(polyD(hx), 'p') + `<g transform="rotate(${a} ${cx} ${cy})">${L(cx - 0.75, cy, cx + 0.75, cy, 't')}</g>`;
    }
    return s;
  }
  const b = w.bezel; if (!b) return '';
  const R = g.bezR, ri = R - b.w;
  if (g.shape === 'cushion') s += C(R, 0, 0, 'p');
  if (b.type === 'dive') {
    for (let a = 0; a < 360; a += 5) s += rad(a, R - 0.5, R, 't');
    s += C(R - 0.55, 0, 0, 'tn') + C(ri, 0, 0, 'p');
    const ro = R - 0.55, h = ro - ri, rm = (ro + ri) / 2;
    s += Pa(polyD([P(-6, ro - 0.5), P(6, ro - 0.5), P(0, ri + 0.5)]), 'p');
    for (let m = 5; m < 60; m += 5) {
      const a = m * 6;
      if (m % 10 === 0) s += T(m, 0, 0, h * 0.6, 'tx bz', `transform="rotate(${a}) translate(0,${f(-rm + h * 0.21)})"`);
      else s += rad(a, ri + h * 0.22, ro - h * 0.22, 'bar');
    }
    if (b.first15) for (let m = 1; m < 15; m++) if (m % 5) s += rad(m * 6, ri + 0.35, ri + 1.25, 't');
  } else if (b.type === 'tachy') {
    s += C(R - 0.4, 0, 0, 'tn') + C(ri, 0, 0, 'p');
    const rm = (R - 0.4 + ri) / 2, sz = Math.min(b.w * 0.48, 1.55);
    TACHY.forEach(v => { const a = 21600 / v; s += T(v, 0, 0, sz, 'tx bz', `transform="rotate(${f(a)}) translate(0,${f(-rm + sz * 0.36)})"`); });
    for (let i = 0; i < 60; i++) { const p = P(i * 6 + 3, ri + 0.3); s += C(0.09, p[0], p[1], 'k'); }
  } else if (b.type === 'slide') {
    for (let i = 0; i < 96; i++) { const p = P(i * 3.75, R - 0.55); s += C(0.45, p[0], p[1], 'p'); }
    s += C(ri, 0, 0, 'l');
  } else s += C(ri, 0, 0, 'l');
  return s;
}

/* ---------- dial ---------- */
const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const SLIDE = [10, 12, 15, 20, 25, 30, 35, 40, 50, 60, 70, 80, 90];

function forkWorks() {
  const fd = 'M-6.5,-5V2.5Q-6.5,5.5 -3.2,5.5H3.2Q6.5,5.5 6.5,2.5V-5';
  let s = Pa(fd, 'lv1 wide') + Pa(fd, 'lv2 wide');
  for (const sx of [-1, 1]) { const x = sx * 6.5; s += RC(x - 2.6, -11.5, 5.2, 6.8, 'p', 1); for (let y = -10.8; y < -5; y += 0.55) s += L(x - 2.6, y, x + 2.6, y, 't'); }
  s += L(0, 5.5, 0, 7.2, 'bar') + C(3.9, 0, 10.6, 'p') + C(3.3, 0, 10.6, 't');
  s += C(0.9, 2.4, 0.5, 'p') + C(0.9, 2.4, 0.5, 'gear') + L(6.5, -1.5, 3.2, 0.2, 't');
  s += RC(-11.5, 1.5, 3, 2, 'p', 0.3) + RC(9, 2, 1.6, 3.4, 'p', 0.5);
  return s;
}

function markers(w, g, skip) {
  const m = w.dial.markers, E = g.edge, R0 = E(0); let s = '';
  const bat = (h, len, wd, c = 'p', off = 0.7) => { const a = h * 30, r = E(a) - off; return `<rect class="${c}" x="${f(-wd / 2)}" y="${f(-r)}" width="${wd}" height="${f(len)}" transform="rotate(${a})"/>`; };
  const dbl = (len, wd, c = 'p', off = 0.7) => { const r = E(0) - off; return RC(-wd - 0.15, -r, wd, len, c) + RC(0.15, -r, wd, len, c); };
  const num = (h, txt, sz, rr) => { const p = P(h * 30, rr); return T(txt, p[0], p[1] + sz * 0.35, sz, 'tx nm'); };
  const ticks = (len = 0.8, off = 0.25) => { let t = ''; for (let i = 0; i < 60; i++) { if (i % 5 === 0) continue; const a = i * 6, r = E(a) - off; t += rad(a, r - len, r, 't'); } return t; };
  const tri = (len, wd, off = 0.7) => { const r = E(0) - off; return Pa(polyD([[f(-wd / 2), f(-r)], [f(wd / 2), f(-r)], [0, f(-r + len)]]), 'p'); };
  const each = fn => { for (let h = 0; h < 12; h++) if (!skip.has(h)) s += fn(h); };
  switch (m) {
    case 'dive': s += ticks(); each(h => h === 0 ? tri(3.4, 3.4) : h % 3 === 0 ? bat(h, 3.2, 1.3) : (p => C(1.15, p[0], p[1], 'p'))(P(h * 30, R0 - 2.1))); break;
    case 'explorer': s += ticks(); each(h => h === 0 ? tri(3.4, 3.4) : h % 3 === 0 ? num(h, h, R0 * 0.3, R0 * 0.72) : bat(h, 3, 0.9)); break;
    case 'baton': s += ticks(); each(h => h === 0 ? dbl(2.6, 0.8) : bat(h, 2.6, 0.8)); break;
    case 'block': s += ticks(); each(h => h === 0 ? dbl(2.8, 1.3) : bat(h, 2.6, 1.7)); break;
    case 'sm300': s += ticks(); each(h => h % 3 === 0 ? num(h, h || 12, R0 * 0.25, R0 * 0.7) + bat(h, 1, 1) : bat(h, 3.6, 1.1)); break;
    case 'pie': {
      s += ticks(0.6); each(h => bat(h, 2.6, 0.7, 'k'));
      const pts = []; for (let k = 0; k < 12; k++) { pts.push(P(15 + 30 * k, R0 * 0.7)); s += rad(15 + 30 * k, R0 * 0.7, R0, 't'); }
      s += Pa(polyD(pts), 't'); break;
    }
    case 'calatrava':
      for (let i = 0; i < 60; i++) { const p = P(i * 6, R0 - 0.5); s += C(0.12, p[0], p[1], 'k'); }
      each(h => bat(h, 2.8, 0.9, 'p', 1.2) + rad(h * 30, R0 - 4, R0 - 1.2, 't')); break;
    case 'polerouter':
      for (let i = 0; i < 120; i++) s += rad(i * 3, R0 * 0.76, R0 - 0.15, 'hair');
      s += C(R0 * 0.76, 0, 0, 'l') + L(-R0 * 0.76, 0, R0 * 0.76, 0, 't') + L(0, -R0 * 0.76, 0, R0 * 0.76, 't');
      each(h => bat(h, R0 * 0.24 - 0.3, 0.55, 'k', 0.3)); break;
    case 'arabic': s += ticks(); for (let h = 1; h <= 12; h++) if (!skip.has(h % 12)) s += num(h % 12, h, 2.5, R0 - 2.1); break;
    case 'roman': {
      const a1 = g.dhw * 0.6, b1 = g.dhh * 0.6, t1 = rectEdge(a1, b1), t2 = rectEdge(a1 - 0.9, b1 - 0.9);
      s += Pa(rrD(a1, b1, 0.01), 't') + Pa(rrD(a1 - 0.9, b1 - 0.9, 0.01), 't');
      for (let i = 0; i < 60; i++) { const a = i * 6, p = P(a, t1(a)), q = P(a, t2(a)); s += L(p[0], p[1], q[0], q[1], i % 5 ? 't' : 'l'); }
      for (let h = 0; h < 12; h++) { const a = h * 30, r = (E(a) + t1(a)) / 2, sz = 2.5; s += T(ROMAN[h], 0, 0, sz, 'tx rom', `transform="rotate(${a}) translate(0,${f(-r + sz * 0.36)})"`); }
      break;
    }
    case 'rectbaton': {
      const e1 = rectEdge(g.dhw - 0.5, g.dhh - 0.5), e2 = rectEdge(g.dhw - 1.3, g.dhh - 1.3);
      s += Pa(rrD(g.dhw - 0.5, g.dhh - 0.5, 0.01), 't') + Pa(rrD(g.dhw - 1.3, g.dhh - 1.3, 0.01), 't');
      for (let i = 0; i < 60; i++) { const a = i * 6, p = P(a, e1(a)), q = P(a, e2(a)); s += L(p[0], p[1], q[0], q[1], 't'); }
      each(h => bat(h, 2.4, 0.7, 'p', 1.9)); break;
    }
    case 'monaco':
      s += C(R0, 0, 0, 't') + ticks();
      each(h => { if (h === 0) return dbl(2.6, 0.8, 'p', 1); const p = P(h * 30, R0 - 2.4); return RC(p[0] - 1.6, p[1] - 0.45, 3.2, 0.9); }); break;
    case 'ventura':
      each(h => (p => C(0.55, p[0], p[1], 'p'))(P(h * 30, R0 - 0.9)));
      s += Pa('M-6.2,0H-3.6L-2.6,-2L-0.9,2.1L0.9,-2.1L2.6,2L3.6,0H6.2', 't'); break;
    case 'spaceview':
      s += C(R0 - 2.6, 0, 0, 'l');
      for (let i = 0; i < 60; i++) if (i % 5) s += rad(i * 6, R0 - 2, R0 - 0.7, 't');
      for (let h = 0; h < 12; h++) { const p = P(h * 30, R0 - 1.3); s += C(0.5, p[0], p[1], 'k'); }
      s += `<g transform="scale(${f((R0 - 3.2) / 15.5)})">${forkWorks()}</g>`; break;
  }
  return s;
}

function subs(w, g, o = {}) {
  const d = w.dial; if (!d.subs) return ''; const R0 = g.inR || g.edge(0), b = bps(w); let s = '';
  const rs = R0 * (d.subBig ? 0.31 : 0.235), off = R0 * (d.subBig ? 0.46 : 0.5);
  for (const [pos, role] of d.subs) {
    const [cx, cy] = P(pos * 30, off), tint = d.subTints ? d.subTints[pos] : null;
    const cls = d.subDark ? 'tn2' : (d.dark ? 'tn' : 'p'), sty = tint != null ? `style="fill:var(--ink);fill-opacity:${tint}"` : '';
    s += d.subSquare ? RC(cx - rs, cy - rs, 2 * rs, 2 * rs, cls, 0.9) : C(rs, cx, cy, 'p') + C(rs, cx, cy, cls, sty);
    const n = role === 'min30' ? 30 : 12;
    if (!d.subSquare) for (let i = 0; i < n; i++) s += rad(i * 360 / n, rs - (i % (n / 6) ? 0.45 : 0.9), rs - 0.12, 't', cx, cy);
    if (!o.noHands) s += `<g transform="translate(${cx},${cy})"><g ${role === 'sec' ? `data-hand="s" data-bps="${b}"` : ''}>${L(0, 0.8, 0, -rs * 0.82, 'hd')}</g>${C(0.32, 0, 0, 'k')}</g>`;
  }
  return s;
}

function dateWin(w, g) {
  const d = w.dial; if (!d.date) return '';
  const [cx, cy] = P(d.date * 30, g.edge(d.date * 30) * 0.74), ww = d.daydate ? 6.2 : 2.7, x = d.daydate ? cx - ww + 1.35 : cx - ww / 2;
  return RC(x, cy - 0.95, ww, 1.9, 'p', 0.15) + `<text class="tx dt" ${d.daydate ? 'data-daydate=""' : 'data-date=""'} x="${f(x + ww / 2)}" y="${f(cy + 0.52)}" font-size="1.45" text-anchor="middle"></text>`;
}

function dtext(w, g, o) {
  const d = w.dial, R0 = g.hl / 0.9, sz = Math.min(R0 * 0.135, 2.1), y1 = -R0 * 0.42;
  const low6 = (d.subs && d.subs.some(x => x[0] === 6)) || d.date === 6;
  let s = '';
  d.text.forEach((t, i) => {
    const z = sz * (i ? 0.78 : 1), y = i === 0 ? y1 : (low6 ? y1 + sz * 1.3 : R0 * 0.44);
    if (o.redact) { const ww = Math.min(t.length * z * 0.62, R0 * 1.3); s += RC(-ww / 2, y - z * 0.8, ww, z, 'rd', 0.2); }
    else s += T(t, 0, y, z, 'tx dl', 'letter-spacing=".06em"');
    if (i === 1 && d.star && !o.redact) s += star(0, y - z * 1.9, 0.75);
  });
  return s;
}

function dial(w, g, o) {
  const d = w.dial; let s = Pa(g.dial, d.dark ? 'tn' : 'p');
  if (d.tapisserie) { const id = 'u' + (++uid); s += `<defs><pattern id="${id}" width="1.15" height="1.15" patternUnits="userSpaceOnUse"><path class="hair" d="M0,0H1.15M0,0V1.15"/></pattern></defs><path d="${g.dial}" fill="url(#${id})" stroke="none"/>`; }
  if (d.flange) {
    const r = g.inR; s += C(r, 0, 0, 'l');
    if (d.flange === 'fifths') for (let i = 0; i < 300; i++) s += rad(i * 1.2, r + 0.2, r + (i % 5 ? 0.75 : 1.35), i % 5 ? 'hair' : 't');
    else if (d.flange === 'tachy') { for (let i = 0; i < 60; i++) s += rad(i * 6, r + 0.15, r + 0.55, 't'); [200, 150, 120, 100, 90, 80, 70, 60].forEach(v => { s += T(v, 0, 0, 0.95, 'tx bz', `transform="rotate(${f(21600 / v)}) translate(0,${f(-r - 0.65)})"`); }); }
    else for (let i = 0; i < 60; i++) s += rad(i * 6, r + 0.2, r + (i % 5 ? 0.8 : 1.4), 't');
  }
  if (d.sliderule) {
    const rb = g.dialR - 2.3; s += C(rb, 0, 0, 'l') + C(g.inR, 0, 0, 'l');
    for (let x = 10; x < 100; x++) { const a = 360 * Math.log10(x / 10); s += rad(a, rb - (x % 5 ? 0.45 : 0.9), rb + (x % 5 ? 0.45 : 0.9), 't'); }
    SLIDE.forEach(v => { const a = f(360 * Math.log10(v / 10)); s += T(v, 0, 0, 1.05, 'tx bz', `transform="rotate(${a}) translate(0,${f(-g.dialR + 1.15)})"`) + T(v, 0, 0, 1.05, 'tx bz', `transform="rotate(${a}) translate(0,${f(-g.inR - 0.35)})"`); });
  }
  const skip = new Set(); (d.subs || []).forEach(x => skip.add(x[0] % 12)); if (d.date && Number.isInteger(d.date)) skip.add(d.date);
  s += markers(w, g, skip) + subs(w, g, o) + dateWin(w, g) + dtext(w, g, o);
  return s;
}

/* ---------- hands ---------- */
function hands(w, g) {
  const Lm = g.hl, Lh = Lm * 0.64, st = w.hands, b = bps(w); let hp, mp;
  const kite = (Ln, wd, k, tail = 1.6) => polyD([[0, tail], [wd, f(-Ln * k)], [0, f(-Ln)], [-wd, f(-Ln * k)]]);
  const pen = (Ln, wd) => `M${-wd},1.8V${f(-Ln + wd * 1.4)}L0,${f(-Ln)}L${wd},${f(-Ln + wd * 1.4)}V1.8Z`;
  if (st === 'mercedes') {
    const cy = -Lh * 0.64, r = Lh * 0.2;
    hp = Pa(`M-0.5,1.6V${f(cy + r)}H0.5V1.6Z`, 'p') + C(r, 0, cy, 'p') + [0, 120, 240].map(a => { const q = P(a, r, 0, cy); return L(0, cy, q[0], q[1], 't'); }).join('') + Pa(polyD([[-0.75, f(cy - r + 0.1)], [0.75, f(cy - r + 0.1)], [0, f(-Lh)]]), 'p');
    mp = Pa(pen(Lm, 0.7), 'p');
  } else if (st === 'sword') { hp = Pa(kite(Lh, 1.5, 0.5), 'p'); mp = Pa(kite(Lm, 1.15, 0.5), 'p'); }
  else if (st === 'dauphine') { hp = Pa(kite(Lh, 1.05, 0.12), 'p') + L(0, 0, 0, -Lh, 't'); mp = Pa(kite(Lm, 0.85, 0.1), 'p') + L(0, 0, 0, -Lm, 't'); }
  else if (st === 'epee') { hp = Pa(kite(Lh, 0.8, 0.28), 'k'); mp = Pa(kite(Lm, 0.62, 0.28), 'k'); }
  else if (st === 'pencil') { hp = Pa(pen(Lh, 0.62), 'p'); mp = Pa(pen(Lm, 0.48), 'p'); }
  else { hp = Pa(pen(Lh, 0.8), 'p'); mp = Pa(pen(Lm, 0.62), 'p'); }
  let s = `<g data-hand="h">${hp}</g><g data-hand="m">${mp}</g>`;
  if (w.chrono) s += `<g>${L(0, 3.2, 0, -Lm * 1.04, 'hd')}${Pa(polyD([[-0.5, f(-Lm * 0.9)], [0.5, f(-Lm * 0.9)], [0, f(-Lm * 1.04)]]), 'k')}</g>`;
  else if (w.sec === 'center') s += `<g data-hand="s" data-bps="${b}">${L(0, 3.4, 0, -Lm * 1.02, 'hd')}${st === 'mercedes' ? C(0.75, 0, -Lm * 0.62, 'p') : ''}${RC(-0.35, 1.6, 0.7, 1.8, 'k')}</g>`;
  return s + C(0.95, 0, 0, 'p') + C(0.3, 0, 0, 'k');
}

/* ---------- dimensions ---------- */
const arH = (x, y, d) => Pa(polyD([[f(x), f(y)], [f(x + d * 1.5), f(y - 0.42)], [f(x + d * 1.5), f(y + 0.42)]]), 'dk');
const arV = (x, y, d) => Pa(polyD([[f(x), f(y)], [f(x - 0.42), f(y + d * 1.5)], [f(x + 0.42), f(y + d * 1.5)]]), 'dk');
function dims(w, g) {
  const c = w.c, y = g.strapEnd + 4.4, x0 = g.x0 != null ? g.x0 : -g.hw, x1 = g.hw, ys = w.crown.guards ? 6.5 : 4.2; let s = '';
  s += L(x0, ys, x0, y + 1, 'dm') + L(x1, ys, x1, y + 1, 'dm') + L(x0, y, x1, y, 'dm') + arH(x0, y, 1) + arH(x1, y, -1);
  const round = c.shape === 'round' || c.shape === 'cushion', val = c.d || c.w;
  s += T(`${c.da ? '≈ ' : ''}${round ? '⌀ ' : ''}${val}`, (x0 + x1) / 2, y - 0.9, 1.9, 'an');
  if (c.lug && c.lug[1] !== 'n') {
    const lw = g.lugW / 2, yt = -y;
    s += L(-lw, -g.l2l / 2 + 2, -lw, yt - 1, 'dm') + L(lw, -g.l2l / 2 + 2, lw, yt - 1, 'dm') + L(-lw, yt, lw, yt, 'dm') + arH(-lw, yt, 1) + arH(lw, yt, -1);
    s += T(`${c.lug[1] === 'a' ? '≈ ' : ''}${c.lug[0]}`, 0, yt - 0.9, 1.9, 'an');
  }
  if (c.h) {
    const xv = x0 - 5, hh = c.h / 2;
    s += L(x0 + 1, -hh, xv - 1, -hh, 'dm') + L(x0 + 1, hh, xv - 1, hh, 'dm') + L(xv, -hh, xv, hh, 'dm') + arV(xv, -hh, 1) + arV(xv, hh, -1);
    s += T(`≈ ${c.h}`, 0, 0, 1.9, 'an', `transform="translate(${f(xv - 0.9)},0) rotate(-90)"`);
  }
  return s;
}

/* ---------- views ---------- */
function front(w, o = {}) {
  const g = geo(w);
  let s = base(w, g) + bezel(w, g) + dial(w, g, o) + hands(w, g);
  if (o.dims) s += dims(w, g);
  return svg(o.dims ? '-34 -44 68 88' : '-30 -40 60 80', s, 'fig front', o.redact ? 'Front elevation of an unidentified watch' : `${w.brand} ${w.model}, front elevation`);
}

function side(w) {
  const g = geo(w), c = w.c, t = c.t[0], cwh = g.cwh, Lh = g.l2l / 2; let s = '';
  const top = -t / 2, ch = t * 0.16, bh = t * 0.17, bT = top + ch + bh, bB = t / 2 - t * 0.2, mid = (bT + bB) / 2;
  if (g.lugs) {
    const lg = Pa(`M${f(cwh * 0.7)},${f(bT + 0.4)}Q${f(Lh * 0.93)},${f(bT + 0.6)} ${f(Lh)},${f(bB - 0.2)}Q${f(Lh)},${f(bB + 0.5)} ${f(Lh - 0.9)},${f(bB + 0.5)}Q${f(cwh * 0.95)},${f(bB + 0.3)} ${f(cwh * 0.7)},${f(bB - 0.4)}Z`, 'p') + C(0.35, Lh - 1.4, bB - 0.9, 't');
    s += lg + `<g transform="scale(-1,1)">${lg}</g>`;
  }
  const bt = w.bezel && w.bezel.type, rot = bt === 'dive' || bt === 'tachy' || bt === 'slide';
  const cr = g.shape === 'round' || g.shape === 'cushion' || g.shape === 'octagon' ? g.dialR * 1.03 : cwh * 0.78;
  s += g.shape === 'octagon'
    ? Pa(`M${f(-cr)},${f(top + ch)}L${f(-cr + 0.5)},${f(top + ch * 0.45)}H${f(cr - 0.5)}L${f(cr)},${f(top + ch)}Z`, 'p')
    : Pa(`M${f(-cr)},${f(top + ch)}Q0,${f(top - ch * 0.9)} ${f(cr)},${f(top + ch)}Z`, 'p');
  s += Pa(polyD([[f(-cwh * 0.84), f(bB)], [f(-cwh * 0.7), f(t / 2)], [f(cwh * 0.7), f(t / 2)], [f(cwh * 0.84), f(bB)]]), 'p');
  s += RC(-cwh, bT, 2 * cwh, bB - bT, 'p', 0.8);
  if (rot) { s += RC(-cwh * 0.97, top + ch, cwh * 1.94, bh, 'p', 0.3); if (bt !== 'tachy') for (let x = -cwh * 0.93; x < cwh * 0.95; x += 1) s += L(x, top + ch + 0.25, x, bT - 0.25, 't'); }
  else s += Pa(polyD([[f(-cwh * 0.95), f(bT)], [f(-cwh * 0.86), f(top + ch)], [f(cwh * 0.86), f(top + ch)], [f(cwh * 0.95), f(bT)]]), 'p');
  if (w.crown.pos) {
    const r = Math.min(w.crown.big ? 3.1 : w.crown.small ? 1.7 : 2.5, (bB - bT) / 2 + 0.9);
    s += C(r, 0, mid, 'p'); for (let a = 0; a < 360; a += 15) s += rad(a, r * 0.78, r, 't', 0, mid); s += C(r * 0.45, 0, mid, 't');
  }
  if (w.pushers) for (const sx of [-1, 1]) s += C(1.4, sx * cwh * 0.5, mid, 'p') + C(0.65, sx * cwh * 0.5, mid, 't');
  const X = (g.lugs ? Lh : cwh) + 3.6, fl = c.t[1];
  s += L(1.5, top, X + 1, top, 'dm') + L(cwh * 0.72, t / 2, X + 1, t / 2, 'dm') + L(X, top, X, t / 2, 'dm') + arV(X, top, 1) + arV(X, t / 2, -1);
  s += T(fl === 'v' ? t : fl === 'a' ? `≈ ${t}` : 'n.v.', X + 1.2, 0.65, 1.9, 'an', 'style="text-anchor:start"');
  return svg('-36 -13 78 26', s, 'fig side', `${w.brand} ${w.model}, profile`);
}

function rear(w) {
  const g = geo(w), b = w.back, R = Math.min(g.hw, g.hh); let s = `<g transform="scale(-1,1)">${base(w, g)}</g>`;
  switch (b.type) {
    case 'fluted': s += C(R * 0.9, 0, 0, 'l') + C(R * 0.8, 0, 0, 'l'); for (let a = 0; a < 360; a += 4) s += rad(a, R * 0.8, R * 0.9, 't'); s += C(R * 0.62, 0, 0, 't'); break;
    case 'screw': s += C(R * 0.9, 0, 0, 'l') + C(R * 0.72, 0, 0, 'l'); for (let k = 0; k < 6; k++) s += `<rect class="p" x="-1" y="${f(-R * 0.86)}" width="2" height="${f(R * 0.1)}" transform="rotate(${k * 60 + 30})"/>`; break;
    case 'snap': s += C(R * 0.88, 0, 0, 'l') + C(R * 0.8, 0, 0, 't') + Pa(`M${P(262, R * 0.88)}L${P(270, R * 0.96)}L${P(278, R * 0.88)}`, 't'); break;
    case 'bolts': s += C(15.6, 0, 0, 'l') + C(11.5, 0, 0, 't'); for (let k = 0; k < 8; k++) { const a = 22.5 + 45 * k, [cx, cy] = P(a, 16.9); s += C(0.95, cx, cy, 'p') + `<g transform="rotate(${a} ${cx} ${cy})">${L(cx - 0.75, cy, cx + 0.75, cy, 't')}</g>`; } break;
    case 'accutron':
      s += C(R * 0.9, 0, 0, 'l') + C(R * 0.8, 0, 0, 't');
      s += C(5, -3.6, -5, 'p') + C(4.3, -3.6, -5, 't') + L(-6.4, -5, -0.8, -5, 'bar');
      s += Pa('M1.2,4.2H9.2', 'bar') + Pa('M1.8,4.2A3.4,3.6 0 0 0 8.6,4.2', 'l') + C(0.5, 1.6, 4.2, 'k') + C(0.5, 8.8, 4.2, 'k');
      break;
    case 'plainrect': s += Pa(rrD(g.bhw, g.bhh, 0.7), 'l'); break;
    case 'plainsq': s += Pa(rrD(16, 16, 3.2), 'l') + Pa(rrD(14.6, 14.6, 2.6), 't'); break;
    case 'plainshield': s += `<g transform="scale(-0.82,0.82)">${Pa(SH_D, 'l')}</g>`; break;
  }
  if (b.emblem) { const p = b.emblem.split(' '); s += C(R * 0.38, 0, 0, 't dash') + T(p[0], 0, -0.3, 1.5, 'an') + T(p.slice(1).join(' '), 0, 1.7, 1.5, 'an'); }
  if (b.obs) {
    s += Pa('M-3.2,1.6A3.2,3.2 0 0 1 3.2,1.6Z', 'l') + RC(-3.9, 1.6, 7.8, 1.5, 'l') + L(0.6, -1.5, 0.6, 1.6, 't') + L(-0.6, -1.5, -0.6, 1.6, 't');
    for (let k = 0; k < 8; k++) { const p = P(-63 + k * 18, 7.2, 0, 1.6); s += star(p[0], p[1], 0.62); }
  }
  return svg('-30 -40 60 80', s, 'fig rear', `${w.brand} ${w.model}, caseback`);
}

function exploded(w) {
  const g = geo(w), sc = 0.28, E = g.edge, mvR = Math.min(g.hw, g.hh, g.dw * 1.05) * 0.86, parts = [];
  const hasBez = !!w.bezel || g.shape === 'octagon';
  parts.push({ n: 'Crystal', d: g.dial, s: 1.04, hw: g.dw * 1.04, th: 0.9 });
  if (hasBez) {
    const od = g.shape === 'octagon' ? polyD(Array.from({ length: 8 }, (_, k) => P(22.5 + 45 * k, g.bezR))) : circD(g.bezR);
    const bt = w.bezel && w.bezel.type;
    parts.push({ n: bt === 'dive' || bt === 'slide' ? 'Rotating bezel' : bt === 'tachy' ? 'Bezel with tachymeter insert' : g.shape === 'octagon' ? 'Octagonal bezel, eight bolts' : 'Bezel', d: od, hole: circD(g.dialR), s: 1, hw: g.shape === 'octagon' ? 18.3 : g.bezR, th: 1.1 });
  }
  parts.push({ n: w.sec === 'none' && !w.chrono ? 'Hour and minute hands' : 'Hands', hw: g.hl * 0.6, th: 0, x: rad(-55, 0, g.hl * 0.6, 'bar') + rad(62, 0, g.hl * 0.92, 'bar') + C(0.8, 0, 0, 'p') });
  let dx = ''; for (let h = 0; h < 12; h++) dx += rad(h * 30, E(h * 30) - 2.4, E(h * 30) - 0.6, 't');
  (w.dial.subs || []).forEach(([pos]) => { const p = P(pos * 30, (g.inR || E(0)) * 0.5); dx += C((g.inR || E(0)) * 0.22, p[0], p[1], 't'); });
  parts.push({ n: w.dial.markers === 'spaceview' ? 'Chapter ring (no dial)' : 'Dial', d: g.dial, s: 1, hw: g.dw, th: 0.35, x: dx });
  const md = w.mv.rect ? rrD(mvR * 0.78, mvR * 1.15, 2.2) : circD(mvR);
  const mx = w.mv.type === 'fork' ? `<g transform="scale(${f(mvR / 16)})">${forkWorks()}</g>` : C(mvR * 0.3, mvR * 0.36, mvR * 0.38, 't') + C(mvR * 0.34, -mvR * 0.28, -mvR * 0.34, 't') + Pa(`M${P(-100, mvR * 0.95)}Q0,${f(mvR * 0.1)} ${P(70, mvR * 0.95)}`, 't');
  const calKnown = !/^not /.test(w.mv.cal);
  parts.push({ n: 'Movement' + (calKnown ? `, cal. ${w.mv.cal}` : ''), d: md, s: 1, hw: w.mv.rect ? mvR * 0.78 : mvR, th: 1.8, x: mx });
  parts.push({ n: 'Case middle' + (g.lugs && g.shape === 'round' ? ' with lugs' : ''), d: g.outline, hole: g.dial, s: 1, hw: g.hw, th: 2.6, pre: g.shape === 'round' && g.lugs ? lugs(w, g) : '', kase: true });
  parts.push({ n: 'Case gasket', d: g.dial, s: 1.06, hw: g.dw * 1.06, th: 0, x: `<g transform="scale(.94)">${Pa(g.dial, 'l')}</g>`, open: true });
  parts.push({ n: 'Caseback', d: g.dial, s: Math.min(1.1, (g.hw * 0.88) / g.dw), hw: g.dw * Math.min(1.1, (g.hw * 0.88) / g.dw), th: 0.9, x: `<g transform="scale(.8)">${Pa(g.dial, 't')}</g>` });

  const lr = g.lr || 1, n = parts.length, y0 = -45, dy = 88 / (n - 1); let body = '', calls = '', num = 0; const names = [];
  parts.forEach((p, i) => { p.y = y0 + i * dy; });
  for (let i = n - 1; i >= 0; i--) {
    const p = parts[i], hw = p.hw, S = p.s || 1; let l = '';
    const grp = (y, inner) => `<g transform="translate(0,${f(y)}) scale(${f(S)},${f(S * sc)})">${inner}</g>`;
    if (p.d) {
      if (p.th) l += grp(p.y + p.th, Pa(p.d, 'p')) + RC(-hw * lr, p.y, hw * (1 + lr), p.th, 'fillp') + L(-hw * lr, p.y, -hw * lr, p.y + p.th) + L(hw, p.y, hw, p.y + p.th);
      l += grp(p.y, (p.pre || '') + (p.open ? Pa(p.d, 'l') : Pa(p.d + (p.hole || ''), 'p', 'fill-rule="evenodd"')) + (p.x || ''));
    } else l += grp(p.y, p.x);
    if (p.kase && w.crown.pos) {
      const sx = w.crown.pos === 9 ? -1 : 1, cx = (g.crx || g.hw) + 1.2, yy = p.y + p.th / 2;
      l += `<g transform="scale(${sx},1)">${L(cx, yy, cx + 4.2, yy, 'l')}${RC(cx + 4.2, yy - 1.3, 2.8, 2.6, 'p', 0.4)}${L(cx + 5, yy - 1.3, cx + 5, yy + 1.3, 't')}${L(cx + 5.8, yy - 1.3, cx + 5.8, yy + 1.3, 't')}</g>`;
      p.crownAt = [sx * (cx + 5.6), yy];
    }
    body += l;
  }
  const call = (k, x, y, tx, ty) => L(tx, ty, x - Math.sign(x) * 2, y, 'dm') + C(2, x, y, 'cb') + T(k, x, y + 0.75, 2.1, 'an');
  parts.forEach((p, i) => {
    num++; names.push(p.n);
    const sd = p.kase ? (w.crown.pos === 9 ? 1 : -1) : (i % 2 ? -1 : 1);
    calls += call(num, sd * 35, p.y, sd * (p.hw * (sd < 0 && p.d ? lr : 1) + 0.8), p.y);
    if (p.crownAt) { num++; names.push('Crown and stem'); const sx = Math.sign(p.crownAt[0]); calls += call(num, sx * 35, p.y + 5.2, p.crownAt[0], p.crownAt[1] + 1.3); }
  });
  const axis = L(0, y0 - 6, 0, y0 + 88 + 7, 'ax');
  return { svg: svg('-40 -56 80 112', axis + body + calls, 'fig expl', `${w.brand} ${w.model}, exploded view`), parts: names };
}

/* ---------- movement ---------- */
const gear = (r, cx, cy) => C(r, cx, cy, 'p') + C(r, cx, cy, 'gear') + C(r * 0.72, cx, cy, 't') + C(0.32, cx, cy, 'k');
const jewel = (cx, cy) => C(0.75, cx, cy, 'p') + C(0.32, cx, cy, 't');
const screw = (cx, cy, a = 30) => C(0.6, cx, cy, 'p') + `<g transform="rotate(${a} ${cx} ${cy})">${L(cx - 0.5, cy, cx + 0.5, cy, 't')}</g>`;
const lever = d => Pa(d, 'lv1') + Pa(d, 'lv2');
function balance(cx, cy, r, w, extra = '') {
  let sp = 'M0,0'; for (let th = 0; th <= 26; th += 0.3) sp += `L${f((0.35 + th * 0.11) * Math.cos(th))},${f((0.35 + th * 0.11) * Math.sin(th))}`;
  const b = bps(w), per = b ? f(2 / b) : 0.4;
  return `<g transform="translate(${cx},${cy})"><path class="hair2" d="${sp}"/><g class="bal" style="animation-duration:${per}s">${C(r, 0, 0, 'l')}${C(r - 0.5, 0, 0, 't')}${L(-r + 0.5, 0, r - 0.5, 0, 't')}${L(0, -r + 0.5, 0, r - 0.5, 't')}${extra}</g>${C(0.4, 0, 0, 'k')}</g>`;
}
function movement(w) {
  const mv = w.mv, t = mv.type, R = 15; let s = '';
  const chr = /chrono/.test(t), micro = /micro/.test(t), rot = t === 'auto' || t === 'autochrono';
  if (t === 'fork') s = C(R, 0, 0, 'p') + C(R - 0.7, 0, 0, 't') + forkWorks();
  else if (t === 'electric') {
    s = RC(14.6, -0.5, 3.4, 1) + C(R, 0, 0, 'p') + C(R - 0.7, 0, 0, 't');
    s += C(6.3, -5.4, -5.2, 'p') + C(5.5, -5.4, -5.2, 't') + T('+', -5.4, -4.4, 3, 'tx');
    s += Pa(`M${P(-100, 14.3)}A14.3,14.3 0 0 0 ${P(-175, 14.3)}Q-2,7 -3,3Q-7,1.5 ${P(-100, 14.3)}Z`, 'p') + gear(2, -8, 6.2) + gear(1.4, -4.4, 9.6) + screw(-11.4, 4.2) + screw(-3.6, 12.4, 70);
    s += RC(10.4, 3.2, 1.5, 2.2, 'k') + RC(10.4, 6.6, 1.5, 2.2, 'k');
    s += balance(5.6, 6.2, 5.2, w, Pa(polyD([[0.6, 0], [4.4, -1.7], [4.4, 1.7]]), 'tn'));
    s += Pa('M5.6,6.2L-1.6,10.4M5.6,6.2L-0.6,11.8', 't');
  } else {
    s = RC(14.6, -0.5, 4.2, 1) + RC(17.6, -1.2, 1.4, 2.4, 'p', 0.3) + C(R, 0, 0, 'p') + C(R - 0.7, 0, 0, 't');
    const A = P(-100, 14.3), B = P(62, 14.3), E = P(-104, 14.3), F = P(-172, 14.3);
    s += Pa(`M${A}A14.3,14.3 0 0 1 ${B}Q5,-2.5 1,-1.2Q-5,1 ${A}Z`, 'p');
    if (micro) {
      s += C(5.6, -5.6, -6.6, 'p') + Pa('M-11.2,-6.6A5.6,5.6 0 0 1 0,-6.6Z', 'tn') + C(4.9, -5.6, -6.6, 't') + C(0.8, -5.6, -6.6, 'p');
      s += gear(2.3, 5.6, -9.4) + gear(1.9, 10, -5.8) + screw(1.6, -12.6);
    } else s += gear(4.6, 1.5, -7.5) + gear(2.3, 8.6, -5.6) + screw(-9.4, -4.6) + screw(-6.2, -11.2, 100) + screw(10.6, -9.2, 60);
    s += Pa(`M${E}A14.3,14.3 0 0 0 ${F}Q-1,8 -2,3.5Q-6,1.5 ${E}Z`, 'p');
    s += jewel(-4.2, 5.6) + jewel(-7.6, 7.8) + jewel(-9.6, 4.4) + screw(-11.8, 6.4) + screw(-4.6, 11.8, 80);
    s += gear(1.5, -0.2, 9.4);
    s += balance(6.2, 6.8, 4.7, w);
    const G = P(118, 14.3), H = P(150, 14.3);
    s += Pa(`M${G}A14.3,14.3 0 0 1 ${H}L6.3,8Q5,6.3 7.2,5.7Z`, 'p') + jewel(6.2, 6.8) + screw(10.6, 9.6, 10) + L(6.2, 6.8, 9.6, 4.6, 't');
    if (chr) {
      s += gear(2.6, 0, 0) + gear(2, -7.6, 1.2);
      if (t !== 'microchrono') { s += C(1.6, -10.6, -2.2, 'p'); for (let k = 0; k < 6; k++) { const p = P(k * 60, 1.6, -10.6, -2.2); s += RC(p[0] - 0.3, p[1] - 0.3, 0.6, 0.6, 'k'); } s += lever(`M${P(60, 14)}Q5,-13.6 -4,-12.6T-10.2,-4`); }
      else s += lever(`M${P(60, 14)}Q9,-3 3,-1.6`);
      s += lever(`M${P(120, 14)}Q9.6,1.8 2.4,1.2`);
    }
    if (rot) {
      s += Pa(`M${P(196, 14)}A14,14 0 0 1 ${P(14, 14)}L${P(14, 10.6)}A10.6,10.6 0 0 0 ${P(196, 10.6)}Z`, 'rot');
      s += L(...P(240, 1.6), ...P(215, 10.6), 'l') + L(...P(330, 1.6), ...P(355, 10.6), 'l') + C(1.6, 0, 0, 'p') + C(0.5, 0, 0, 'k');
    }
  }
  if (mv.rect) { const id = 'm' + (++uid), d = rrD(10.5, 14.5, 3); s = `<defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><g clip-path="url(#${id})">${s}</g>` + Pa(d, 'l'); }
  return svg('-20 -20 40 40', s, 'fig mvt', `${w.brand} ${w.model}, movement schematic`);
}

/* ---------- face texture for the 3D workbench (bezel + dial, no hands) ---------- */
const REAL = ".l{fill:none;stroke:#8d8d88;stroke-width:.14}.p{fill:#ebe5cf;stroke:#0d0d0d;stroke-width:.06}.t{fill:none;stroke:#e9e6da;stroke-width:.13}.hair{fill:none;stroke:#e9e6da;stroke-width:.05}.k{fill:#e9e6da}.tn,.tn2{fill:#121212;stroke:#2b2b2b;stroke-width:.12}.bar{fill:none;stroke:#e9e6da;stroke-width:.5}text{fill:#f0ede2;font-family:Georgia,'Times New Roman',serif}.bz{font-family:Helvetica,Arial,sans-serif;font-weight:bold}";
const REAL_LIGHT = ".l{fill:none;stroke:#6d6657;stroke-width:.14}.p{fill:#ece6d4;stroke:#3a3428;stroke-width:.1}.t{fill:none;stroke:#3a3428;stroke-width:.11}.hair{fill:none;stroke:#3a3428;stroke-width:.05}.k{fill:#3a3428}.tn,.tn2{fill:#cfc6ae;stroke:#3a3428;stroke-width:.12}.bar{fill:none;stroke:#3a3428;stroke-width:.5}text{fill:#2b271f;font-family:Georgia,'Times New Roman',serif}.bz{font-family:Helvetica,Arial,sans-serif;font-weight:bold}";
const TECH = ".l{fill:none;stroke:#242521;stroke-width:.2}.p{fill:#EDE6D8;stroke:#242521;stroke-width:.2}.t{fill:none;stroke:#242521;stroke-width:.1}.hair{fill:none;stroke:#242521;stroke-width:.05}.k{fill:#242521}.tn,.tn2{fill:#D9CEB9;stroke:#242521;stroke-width:.2}.bar{fill:none;stroke:#242521;stroke-width:.5}text{fill:#242521;font-family:Georgia,'Times New Roman',serif}.bz{font-family:Helvetica,Arial,sans-serif;font-weight:bold}";
function face(w, real) {
  const g = geo(w), R = g.bezR || g.hw;
  const s = `<style>${real ? (w.dial.dark ? REAL : REAL_LIGHT) : TECH}</style><circle r="${R}" fill="${real ? '#b5b5af' : '#EDE6D8'}"/>` + bezel(w, g) + dial(w, g, { noHands: true });
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${s}</svg>`, R, dialR: g.dialR, inR: g.inR, bezelInner: R - (w.bezel ? w.bezel.w : 0), handLen: g.hl };
}

window.Draw = { front, side, rear, exploded, movement, bps, face };
})();
