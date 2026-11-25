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
  /* each pusher is marked with its job and given a larger unseen area to press, so that a page can make it work */
  const hit = x => `<rect class="hit" x="${f(x - 1.5)}" y="-4" width="8" height="8" fill="transparent" stroke="none"/>`;
  if (g.shape === 'square') return [-8.5, 8.5].map(y => `<g transform="translate(0,${y})" data-push="${y < 0 ? 'start' : 'reset'}">${one(g.hw)}${hit(g.hw)}</g>`).join('');
  const r = g.shape === 'cushion' ? g.hw + 0.9 : g.hw - 0.2;
  return [60, 120].map(a => `<g transform="rotate(${a - 90})" data-push="${a === 60 ? 'start' : 'reset'}">${one(r)}${hit(r)}</g>`).join('');
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
    s += Pa(polyD([P(-6, ro - 0.5), P(6, ro - 0.5), P(0, ri + 0.5)]), 'p') + C(h * 0.2, 0, -(ro - 0.5 - h * 0.27), 'p') + C(h * 0.11, 0, -(ro - 0.5 - h * 0.27), 't'); // the luminous pearl set in the triangle
    for (let m = 5; m < 60; m += 5) {
      const a = m * 6;
      if (m % 10 === 0) s += T(m, 0, 0, h * 0.6, 'tx bz', `transform="rotate(${a}) translate(0,${f(-rm + h * 0.21)})"`);
      else s += rad(a, ri + h * 0.22, ro - h * 0.22, 'bar');
    }
    if (b.first15) for (let m = 1; m < 15; m++) if (m % 5) s += rad(m * 6, ri + 0.35, ri + 1.25, 't');
  } else if (b.type === 'tachy') {
    s += C(R - 0.4, 0, 0, 'tn') + C(ri, 0, 0, 'p');
    if (b.scale === '105') { /* the insert of the Speedmaster 105.003, read from photographs: these figures, each nearly level and not turned to follow the ring; the word TACHYMÈTRE after twelve;
         a dot above the 90, and dots beside the 75 and the 70. Each figure stands at 3600 divided by its value, in seconds. The slight lean of the figures is approximated, and the fine marks between them are left out. */
      const rm = (R - 0.4 + ri) / 2 + 0.1, sz = Math.min(b.w * 0.36, 1.15), dg = Math.PI / 180;
      [500, 400, 350, 300, 275, 250, 225, 200, 190, 180, 170, 160, 150, 140, 130, 120, 110, 100, 90, 85, 80, 75, 70, 65, 60].forEach(v => {
        const a = 21600 / v, p = P(a, rm), tilt = (Math.cos(a * dg) > 0 ? 30 : 10) * Math.sin(2 * a * dg);
        s += T(v, 0, sz * 0.36, sz, 'tx bz', `transform="translate(${f(p[0])},${f(p[1])}) rotate(${f(tilt)})"`) + rad(a, ri + 0.08, ri + 0.38, 't');
        if (v === 90) s += C(0.13, p[0] + sz * 0.15, p[1] - sz * 0.85, 'k'); else if (v === 75) s += C(0.13, p[0] + sz * 0.85, p[1], 'k'); else if (v === 70) s += C(0.13, p[0] + sz * 0.85, p[1] + sz * 0.3, 'k');
      });
      [...'TACHYMÈTRE'].forEach((ch, i) => { s += T(ch, 0, 0, sz * 0.92, 'tx bz', `transform="rotate(${f(9 + i * 3.05)}) translate(0,${f(-rm + sz * 0.33)})"`); });
      return s;
    }
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
    case 'dive': s += `<g class="gt">${ticks(1.0)}</g>`; each(h => h === 0 ? tri(4.3, 2.9, 0.9) : h % 3 === 0 ? bat(h, 3.0, 1.2, 'p', 1.35) : (p => C(1.15, p[0], p[1], 'p'))(P(h * 30, R0 - 2.3))); break; // the triangle is tall and narrow, as on the watch
    case 'explorer': s += '<g class="gt">'; for (let i = 0; i < 60; i++) s += rad(i * 6, E(i * 6) - 1.7, E(i * 6) - 0.2, 't'); s += '</g>'; each(h => h === 0 ? tri(3.3, 3.0, 2.0) : h % 3 === 0 ? num(h, h, R0 * 0.27, R0 * 0.7) : bat(h, 2.5, 0.85, 'p', 2.0)); break; // long printed minute marks at the edge, with the luminous hour marks set inside them
    case 'speed': { // the Speedmaster's dial, from photographs of a 105.003: a track in fifths of a second, long thin luminous bars, short ones beside the registers, and two dots flanking the bar at twelve
      for (let i = 0; i < 300; i++) { const a = i * 1.2, r = E(a) - 0.25; if (i % 25 === 0 || (i > 142 && i < 158 && i % 5)) continue; /* the fine marks give way to the words at the foot */ s += i % 5 ? rad(a, r - 0.75, r, 'hair') : rad(a, r - 2.1, r, 't'); }
      for (let h = 0; h < 12; h++) s += bat(h, h && h % 3 === 0 ? 1.7 : 3.4, 0.5, 'p', h === 6 ? 1.0 : 0.25);
      s += C(0.28, -0.72, -(R0 - 3.35), 'p') + C(0.28, 0.72, -(R0 - 3.35), 'p') + C(R0 - 4.0, 0, 0, 'hair'); // the last circle is the step in the dial
      break; }
    case 'carrera': // the first Carrera's dial, from OnTheDash's photographs of a 2447 S: no printed track, since the scale is on the ring under the crystal; long applied steel bars, a wider one at twelve, short ones beside the registers, and a luminous dot at the outer end of each
      for (let h = 0; h < 12; h++) { const q = h && h % 3 === 0, wd = h ? 0.75 : 1.5, r = E(h * 30); s += bat(h, q ? 1.3 : 3.7, wd, 'p ap', 1.0); (h ? [0] : [-0.42, 0.42]).forEach(dx => { s += `<circle class="p" r="0.2" cx="${dx}" cy="${f(-r + 0.62)}" transform="rotate(${h * 30})"/>`; }); }
      break;
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
    case 'breguet': { // applied numerals where there is room, dots elsewhere, and a fine dotted minute track
      for (let i = 0; i < 60; i++) if (i % 5) { const p = P(i * 6, R0 - 0.45); s += C(0.07, p[0], p[1], 'k'); }
      const sz = R0 * 0.2; [0, 1, 2, 4, 8, 10, 11].forEach(h => { const p = P(h * 30, R0 - 2.5); s += T(h || 12, p[0], p[1] + sz * 0.35, sz, 'tx nm', 'font-style="italic"'); });
      [3, 5, 7, 9].forEach(h => { const p = P(h * 30, R0 - 1.0); s += C(0.34, p[0], p[1], 'p hc'); });
      break;
    }
    case 'railway': { // two fine circles with a tick for each minute and each fifth of a second, and upright numerals inside
      s += C(R0 - 0.25, 0, 0, 't') + C(R0 - 1.25, 0, 0, 't');
      for (let i = 0; i < 300; i++) s += rad(i * 1.2, R0 - (i % 25 ? (i % 5 ? 0.75 : 1.25) : 1.25), R0 - 0.25, i % 5 ? 'hair' : 't');
      const sz = R0 * 0.17; for (let h = 1; h <= 12; h++) if (!skip.has(h % 12)) { const p = P(h * 30, R0 - 3.7); s += T(h, p[0], p[1] + sz * 0.35, sz, 'tx nm'); }
      break;
    }
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

/* A perpetual calendar's sub-dials: day with a 24-hour hand, month with the leap-year cycle, date with the phase of the moon.
   The drawing is made once, so their hands are set to the date and hour at which the page was opened and do not move. */
const CAL_ROLES = ['day24', 'monthleap', 'datemoon', 'dayde', 'date31', 'moonsec'], DAYS_DE = ['SON', 'MON', 'DIE', 'MIT', 'DON', 'FRE', 'SAM']; // German day names, as on a Lange
const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'], MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function calSub(w, g, pos, role, o = {}) {
  const R0 = g.inR || g.edge(0), now = new Date(), big = role === 'datemoon', rs = R0 * (big ? 0.34 : 0.27), [cx, cy] = P(pos * 30, R0 * (big ? 0.5 : 0.52));
  const lab = (txt, a, r, sz) => T(txt, 0, 0, sz, 'tx cal', `transform="translate(${cx},${cy}) rotate(${f(a)}) translate(0,${f(-r + sz * 0.36)})"`);
  const hand = (a, len, wd = 0.3) => `<g transform="translate(${cx},${cy}) rotate(${f(a)})">${Pa(`M0,${f(len * 0.16)}L${wd},0L0,${f(-len)}L${-wd},0Z`, 'p hc')}</g>`;
  let s = C(rs, cx, cy, 'p') + C(rs, cx, cy, w.dial.dark ? 'tn' : 'p');
  const moon = (rm, wy) => { // a window with the moon passing across it; ph is 0 at new moon and 0.5 at full
    const id = 'u' + (++uid), ph = ((Date.now() / 86400000 - 10962.76) % 29.530588853 + 29.530588853) % 29.530588853 / 29.530588853, win = `M${f(cx - rm)},${f(wy)}A${f(rm)},${f(rm)} 0 0 1 ${f(cx + rm)},${f(wy)}Z`;
    return `<defs><clipPath id="${id}"><path d="${win}"/></clipPath></defs>` + Pa(win, 'tn mw') + `<g clip-path="url(#${id})">${star(cx - rm * 0.55, wy - rm * 0.72, rm * 0.13, 'k mn')}${star(cx + rm * 0.5, wy - rm * 0.8, rm * 0.1, 'k mn')}${C(rm * 0.42, cx - rm * 1.4 + ph * rm * 2.8, wy - rm * 0.42, 'p mn')}</g>` + Pa(win, 't');
  };
  if (role === 'dayde') {
    DAYS_DE.forEach((t, i) => { s += lab(t, i * 360 / 7, rs * 0.79, rs * 0.2); });
    s += C(rs * 0.52, cx, cy, 'hair') + hand(now.getDay() * 360 / 7, rs * 0.72);
  } else if (role === 'date31') {
    for (let d = 1; d <= 31; d++) { const a = (d - 1) * 360 / 31; s += d % 2 ? lab(d, a, rs * 0.81, rs * 0.17) : (p => C(0.08, p[0], p[1], 'k'))(P(a, rs * 0.81, cx, cy)); }
    s += C(rs * 0.52, cx, cy, 'hair') + hand((now.getDate() - 1) * 360 / 31, rs * 0.68);
  } else if (role === 'moonsec') { // running seconds round the edge, the moon above the centre, and the scale of fifths for the flying seconds
    for (let i = 0; i < 60; i++) s += rad(i * 6, rs - (i % 5 ? 0.4 : 0.75), rs - 0.12, 't', cx, cy);
    [5, 1, 2, 3, 4].forEach((n, i) => { s += lab(n, i * 72, rs * 0.74, rs * 0.19); });
    s += moon(rs * 0.5, cy - rs * 0.06);
    if (!o.noHands) s += `<g transform="translate(${cx},${cy})"><g data-hand="s" data-bps="${bps(w)}">${L(0, 0.8, 0, -rs * 0.86, 'hd')}</g></g>`;
  } else if (role === 'day24') {
    DAYS.forEach((t, i) => { s += lab(t, i * 360 / 7, rs * 0.79, rs * 0.2); });
    s += C(rs * 0.6, cx, cy, 'hair'); [[12, 0], [18, 90], [24, 180], [6, 270]].forEach(q => { s += lab(q[0], q[1], rs * 0.4, rs * 0.19); });
    s += hand((now.getHours() + now.getMinutes() / 60 - 12) * 15, rs * 0.42, 0.22) + hand(now.getDay() * 360 / 7, rs * 0.72);
  } else if (role === 'monthleap') {
    MONTHS.forEach((t, i) => { s += i % 2 ? rad(i * 30, rs * 0.72, rs * 0.86, 't', cx, cy) : lab(t, i * 30, rs * 0.79, rs * 0.2); });
    s += C(rs * 0.6, cx, cy, 'hair'); [1, 2, 3, 4].forEach(n => { s += lab(n, n * 90 - 45, rs * 0.38, rs * 0.19); });
    s += L(cx - rs * 0.6, cy, cx + rs * 0.6, cy, 'hair') + L(cx, cy - rs * 0.6, cx, cy + rs * 0.6, 'hair');
    const yc = (now.getFullYear() + 3) % 4; // 0, 1, 2 for the three ordinary years; 3 for the leap year, which is quarter "4"
    s += hand(yc * 90 + (now.getMonth() + 0.5) * 7.5, rs * 0.42, 0.22) + hand(now.getMonth() * 30, rs * 0.72);
  } else {
    for (let d = 1; d <= 31; d++) { const a = (d - 1) * 360 / 31; s += d % 2 ? lab(d, a, rs * 0.83, rs * 0.15) : (p => C(0.08, p[0], p[1], 'k'))(P(a, rs * 0.83, cx, cy)); }
    const rm = rs * 0.5, id = 'u' + (++uid), wy = cy - rs * 0.04, ph = ((Date.now() / 86400000 - 10962.76) % 29.530588853 + 29.530588853) % 29.530588853 / 29.530588853; // 0 new moon, 0.5 full
    const win = `M${f(cx - rm)},${f(wy)}A${f(rm)},${f(rm)} 0 0 1 ${f(cx + rm)},${f(wy)}Z`;
    s += `<defs><clipPath id="${id}"><path d="${win}"/></clipPath></defs>` + Pa(win, 'tn mw') + `<g clip-path="url(#${id})">${star(cx - rm * 0.55, wy - rm * 0.72, rm * 0.13, 'k mn')}${star(cx + rm * 0.5, wy - rm * 0.8, rm * 0.1, 'k mn')}${C(rm * 0.42, cx - rm * 1.4 + ph * rm * 2.8, wy - rm * 0.42, 'p mn')}</g>` + Pa(win, 't');
    s += hand((now.getDate() - 1) * 360 / 31, rs * 0.74);
  }
  return s + C(0.36, cx, cy, 'p hc');
}

function subs(w, g, o = {}) {
  const d = w.dial; if (!d.subs) return ''; const R0 = g.inR || g.edge(0), b = bps(w); let s = '';
  const rs = R0 * (d.subBig ? 0.31 : 0.235), off = R0 * (d.subBig ? 0.46 : 0.5);
  for (const [pos, role] of d.subs) {
    if (CAL_ROLES.includes(role)) { s += calSub(w, g, pos, role, o); continue; }
    const [cx, cy] = P(pos * 30, off), tint = d.subTints ? d.subTints[pos] : null;
    const cls = d.subDark ? 'tn2' : d.subLight ? 'p' : (d.dark ? 'tn' : 'p'), sty = tint != null ? `style="fill:var(--sf${pos}, var(--ink));fill-opacity:var(--so, ${tint})"` : ''; // the Workbench's dial picture can give each register its true colour; elsewhere it is a tint of the ink
    s += d.subSquare ? RC(cx - rs, cy - rs, 2 * rs, 2 * rs, cls, 0.9) : C(rs, cx, cy, 'p') + C(rs, cx, cy, cls, sty);
    const n = role === 'min30' ? 30 : 12;
    if (!d.subSquare) for (let i = 0; i < n; i++) s += rad(i * 360 / n, rs - (i % (n / 6) ? 0.45 : 0.9), rs - 0.12, 't sk' + pos, cx, cy);
    if (d.subRings) for (const k of [0.12, 0.2, 0.28, 0.36]) { // the fine circles turned into each register, a few of them, kept inside the figures; in the register at six they break for the word printed there
      if (d.subWord && pos === 6 && k > 0.15) { const r = rs * k, g0 = 55 * Math.PI / 180, x = r * Math.sin(g0), y = r * Math.cos(g0); s += Pa(`M${f(cx + x)},${f(cy + y)}A${f(r)},${f(r)} 0 1 0 ${f(cx - x)},${f(cy + y)}`, 'hair'); }
      else s += C(rs * k, cx, cy, 'hair'); }
    if (d.subWord && pos === 6) s += T(d.subWord, cx, cy + rs * 0.3, rs * 0.14, 'tx dl', 'style="font-family:Helvetica,Arial,sans-serif"');
    if (d.subNums && !d.subSquare) (role === 'hr12' ? [[0, 12], [90, 3], [180, 6], [270, 9]] : role === 'min30' ? [[0, 30], [120, 10], [240, 20]] : [[0, 60], [120, 20], [240, 40]]).forEach(q => { const p = P(q[0], rs * 0.56, cx, cy), z = rs * 0.3; s += T(q[1], p[0], p[1] + z * 0.36, z, 'tx sn', 'style="font-family:Helvetica,Arial,sans-serif"'); }); // the figures printed in each register
    if (!o.noHands) s += `<g transform="translate(${cx},${cy})"><g ${role === 'sec' ? `data-hand="s" data-bps="${b}"` : `data-chr="${role === 'min30' ? 'm' : 'h'}"`}>${L(0, 0.8, 0, -rs * 0.82, 'hd')}</g>${C(0.32, 0, 0, 'k')}</g>`;
  }
  return s;
}

function dateWin(w, g) {
  const d = w.dial; if (!d.date) return '';
  const [cx, cy] = P(d.date * 30, g.edge(d.date * 30) * 0.74), ww = d.daydate ? 6.2 : 2.7, x = d.daydate ? cx - ww + 1.35 : cx - ww / 2;
  return RC(x, cy - 0.95, ww, 1.9, 'p', 0.15) + `<text class="tx dt" ${d.daydate ? 'data-daydate=""' : 'data-date=""'} x="${f(x + ww / 2)}" y="${f(cy + 0.52)}" font-size="1.45" text-anchor="middle"></text>`;
}

function dtext(w, g, o) {
  const d = w.dial, R0 = g.hl / 0.9, sz = Math.min(R0 * 0.135, 2.1) * (d.textScale || 1), y1 = -R0 * (d.textY || 0.42); // a crowded dial can ask for smaller lettering, set lower
  const low6 = (d.subs && d.subs.some(x => x[0] === 6)) || d.date === 6;
  let s = '';
  /* A dial whose lettering has been checked line by line against photographs carries it as a set: a coronet, the lines above the centre, the lines below, and the word at the foot.
     Places and sizes are fractions of the dial's radius, read from those photographs. The coronet is a simple five-pointed figure, not the maker's exact drawing. */
  if (d.set && !o.redact) {
    const q = d.set, sans = 'style="font-family:Helvetica,Arial,sans-serif" letter-spacing=".03em"';
    if (q.omega != null) s += T('Ω', 0, R0 * q.omega, R0 * 0.13, 'tx om', 'style="font-family:Helvetica,Arial,sans-serif"'); // the applied metal emblem, shown as the letter
    if (q.shield != null) { const W = R0 * 0.3, H = R0 * 0.15, y0 = R0 * q.shield; s += Pa(polyD([[f(-W / 2), f(y0)], [f(W / 2), f(y0)], [f(W / 2 - W * 0.06), f(y0 + H * 0.6)], [0, f(y0 + H)], [f(-W / 2 + W * 0.06), f(y0 + H * 0.6)]]), 't') + T('HEUER', 0, y0 + H * 0.56, H * 0.48, 'tx dl', 'style="font-family:Helvetica,Arial,sans-serif;font-weight:bold"'); } // Heuer's printed shield, as a plain five-sided outline
    if (q.crown != null) { const u = R0 * 0.075, y0 = R0 * q.crown; s += Pa(polyD([[-.55, 0], [-.95, -.7], [-.45, -.32], [-.5, -.98], [-.12, -.38], [0, -1.12], [.12, -.38], [.5, -.98], [.45, -.32], [.95, -.7], [.55, 0]].map(p => [f(p[0] * u), f(y0 + p[1] * u)])), 'k dl') + [[-.95, -.7], [-.5, -.98], [0, -1.12], [.5, -.98], [.95, -.7]].map(p => C(u * 0.1, p[0] * u, y0 + p[1] * u, 'k dl')).join('') + RC(-0.55 * u, y0 + 0.08 * u, 1.1 * u, 0.12 * u, 'k dl'); }
    q.lines.forEach(l => { s += T(l[0].replace(/&/g, '&amp;'), 0, R0 * l[1], R0 * l[2], 'tx dl', l[3] === 2 ? 'style="font-style:italic"' : l[3] ? sans : 'letter-spacing=".06em"'); }); // 2: a script line, approximated in italic
    if (q.foot) s += T(q.foot, 0, R0 - 0.12, R0 * 0.042, 'tx dl', sans);
    return s;
  }
  /* With registers at three and nine, the second line has to sit above their tops, or its ends run into them; the first line moves up with it. */
  const side = d.subs && d.subs.some(x => x[0] === 3 || x[0] === 9) && low6 && d.textY == null, top = -(g.inR || R0) * (d.subBig ? 0.31 : 0.235) - 0.5;
  const yb = side ? Math.min(y1 + sz * 1.3, top) : y1 + sz * 1.3, ya = side ? Math.min(y1, yb - sz * 1.2) : y1;
  d.text.forEach((t, i) => {
    const z = sz * (i ? 0.78 : 1), y = i === 0 ? ya : (low6 ? yb : R0 * 0.44);
    if (o.redact) { const ww = Math.min(t.length * z * 0.62, R0 * 1.3); s += RC(-ww / 2, y - z * 0.8, ww, z, 'rd', 0.2); }
    else s += T(t.replace(/&/g, '&amp;'), 0, y, z, 'tx dl', 'letter-spacing=".06em"'); // an ampersand has to be written this way inside a drawing
    if (i === 1 && d.star && !o.redact) s += star(0, y - z * 1.9, 0.75);
  });
  return s;
}

/* The open front of the Jaeger-LeCoultre Gyrotourbillon 3: no single dial, but three separate ones over the movement, and an opening for the tourbillon.
   Centres and sizes are measured from a front photograph of the watch, in millimetres from the centre of the case (x to the right, y upwards):
   time dial, chronograph seconds dial with its digital minute window, day and night disc, tourbillon opening. Everything between them is simplified. */
const G3 = { time: [3.0, 9.4, 9.4], sec: [-10.5, 1.5, 8.2], dn: [13.1, 1.1, 5.0], tb: [2.8, -10.3, 6.4], cw: [-9.0, 10.2, 2.0] }; // cw: the chronograph's column wheel, under its steel cap
function gyro3(w, g, o) {
  const [tx, ty, tr] = G3.time, [sx, sy, sr] = G3.sec, [nx, ny, nr] = G3.dn, [bx, by, br] = G3.tb, now = new Date();
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647; // the same scatter of flecks every time
  const flecks = (cx, cy, r0, r1, n) => { let t = ''; for (let i = 0; i < n; i++) { const a = rnd() * 360, r = Math.sqrt(r0 * r0 + rnd() * (r1 * r1 - r0 * r0)), q = P(a, r, cx, cy); t += C(0.04 + rnd() * 0.05, q[0], q[1], 'k g3-star'); } return t; };
  let s = Pa(g.dial, 'tn g3-base');
  /* two grey panels stand in for the bridges inlaid with meteorite; their real outlines are not reproduced */
  s += Pa(`M${f(bx + 7.6)},${f(-by - 6)}Q${f(bx + 15)},${f(-by - 5)} ${f(bx + 13.5)},${f(-by + 3)}Q${f(bx + 9)},${f(-by + 6)} ${f(bx + 7.2)},${f(-by + 2)}Z`, 'tn g3-met') + Pa(`M${f(sx - 4)},${f(-sy + 9)}Q${f(sx + 2)},${f(-sy + 14)} ${f(sx + 9)},${f(-sy + 11.5)}L${f(sx + 6)},${f(-sy + 8.6)}Q${f(sx + 1)},${f(-sy + 10)} ${f(sx - 2)},${f(-sy + 8.2)}Z`, 'tn g3-met');
  /* three steel levers stand in for the chronograph work that shows at the lower left of the real watch; their shapes are not reproduced */
  s += Pa(`M${f(sx - 4.5)},${f(-sy + 11.5)}Q${f(sx + 1)},${f(-sy + 13)} ${f(sx + 5.5)},${f(-sy + 16.5)}L${f(sx + 4.6)},${f(-sy + 17.4)}Q${f(sx + 0.5)},${f(-sy + 14.4)} ${f(sx - 4.8)},${f(-sy + 12.9)}Z`, 'p g3-steel') + Pa(`M${f(sx + 1.5)},${f(-sy + 11.2)}L${f(sx + 7.6)},${f(-sy + 13.6)}L${f(sx + 7.2)},${f(-sy + 14.7)}L${f(sx + 1.1)},${f(-sy + 12.3)}Z`, 'p g3-steel') + C(1.1, sx - 1.5, -sy + 15.6, 'p g3-steel') + C(0.45, sx - 1.5, -sy + 15.6, 'p g3-rim');
  s += C(br + 0.5, bx, -by, 'p g3-rim') + C(br, bx, -by, 'k g3-hole');
  for (let i = 0; i < 72; i++) s += rad(i * 5, br + 0.02, br + 0.42, 't g3-teeth', bx, -by); // the fixed toothed ring round the tourbillon
  [[-7.3, 14.7], [15.8, 6.7], [6.8, -3.0], [-0.6, -3.3], [11.9, -8.3], [2.9, -1.0]].forEach((q, k) => { s += C(0.55, q[0], -q[1], 'p g3-screw') + `<g transform="rotate(${k * 37} ${f(q[0])} ${f(-q[1])})">${L(q[0] - 0.42, -q[1], q[0] + 0.42, -q[1], 't g3-ink')}</g>`; }); // blued screws, placed from a close-up
  s += C(G3.cw[2], G3.cw[0], -G3.cw[1], 'p g3-steel') + C(G3.cw[2] * 0.62, G3.cw[0], -G3.cw[1], 'p g3-steel') + L(G3.cw[0] - 0.8, -G3.cw[1] + 0.35, G3.cw[0] + 0.8, -G3.cw[1] - 0.35, 't g3-ink'); // the capped column wheel, with the slot of its screw
  /* day and night: a disc that turns once in 24 hours, set to the hour at which the page was opened */
  s += `<g transform="translate(${nx},${-ny}) rotate(${f((now.getHours() + now.getMinutes() / 60) * 15)})">` + C(nr, 0, 0, 'p g3-rim') + C(nr - 0.35, 0, 0, 'p g3-day') + Pa(`M${f(-nr + 0.35)},0A${f(nr - 0.35)},${f(nr - 0.35)} 0 0 1 ${f(nr - 0.35)},0Z`, 'tn g3-blue')
    + Pa(`M-1.5,-2.6A1.5,1.5 0 1 0 0.6,-1.2A1.15,1.15 0 1 1 -1.5,-2.6Z`, 'p g3-sun') + star(1.7, -2.6, 0.42, 'k g3-sun') + star(-2.6, -1.3, 0.34, 'k g3-sun') + C(0.75, 0, 2.3, 'p g3-sun');
  for (let i = -5; i <= 5; i++) s += rad(180 + i * 15, 1.1, nr - 0.7, 't g3-ray', 0, 2.3);
  s += '</g>';
  /* chronograph: seconds round the white ring, minutes as two digits in the window. Shown at rest */
  s += C(sr, sx, -sy, 'p g3-rim') + C(sr - 0.3, sx, -sy, 'p g3-white') + C(sr - 2.6, sx, -sy, 'tn g3-blue') + flecks(sx, -sy, 0, sr - 2.8, 46);
  for (let i = 0; i < 60; i++) s += rad(i * 6, sr - (i % 5 ? 0.9 : 1.25), sr - 0.45, 't g3-ink', sx, -sy);
  [60, 10, 20, 30, 40, 50].forEach((n, i) => { const q = P(i * 60, sr - 1.85, sx, -sy); s += T(n, q[0], q[1] + 0.42, 1.2, 'tx g3-inkf'); });
  s += RC(sx + 2.35, -sy - 1.8, 4.8, 3.6, 'p g3-rim', 0.2) + RC(sx + 2.6, -sy - 1.55, 4.3, 3.1, 'p g3-white', 0.15) + L(sx + 4.75, -sy - 1.55, sx + 4.75, -sy + 1.55, 'hair g3-ink') + T('00', sx + 4.75, -sy + 0.95, 2.7, 'tx g3-inkf');
  if (!o.noHands) s += L(sx, -sy + 1.2, sx, -sy - sr + 1.1, 'hd') + C(0.4, sx, -sy, 'k');
  /* time: a ring flecked like a night sky round a centre of meteorite */
  s += C(tr, tx, -ty, 'p g3-rim') + C(tr - 0.3, tx, -ty, 'tn g3-blue') + flecks(tx, -ty, 6.1, tr - 0.9, 70) + C(tr - 0.65, tx, -ty, 't g3-wt');
  for (let i = 0; i < 60; i++) s += rad(i * 6, tr - 0.95, tr - 0.65, 'hair g3-wt', tx, -ty);
  for (let h = 0; h < 12; h++) { const b = dx => `<rect class="p g3-gold" x="${f(dx - 0.2)}" y="${f(-tr + 1.35)}" width="0.4" height="1.9" transform="translate(${tx},${-ty}) rotate(${h * 30})"/>`; s += h ? b(0) : b(-0.36) + b(0.36); }
  s += C(6.1, tx, -ty, 'tn g3-met');
  [[-5.2, -1.6, 4.6, 3.2], [-4.6, 2.4, 5.4, -0.4], [-3.4, -4.4, 2.6, 4.6], [-1.2, -5.6, 5.2, 0.8], [-5.6, 0.6, -0.6, 5.6], [0.8, -5.8, 3.8, 4.2]].forEach(q => { s += L(tx + q[0], -ty + q[1], tx + q[2], -ty + q[3], 'hair g3-streak'); });
  if (!o.redact) s += T('JAEGER-LECOULTRE', tx, -ty - 2.2, 0.72, 'tx g3-txt', 'letter-spacing=".04em"');
  return s;
}
const handsAt = (w, g) => w.dial.handsAt ? `<g transform="translate(${w.dial.handsAt[0]},${-w.dial.handsAt[1]}) scale(${w.dial.handsAt[2]})">${hands(w, g)}</g>` : hands(w, g); // a watch whose time dial is off centre and small

function dial(w, g, o) {
  if (w.dial.custom === 'gyro3') return gyro3(w, g, o);
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
  else if (st === 'leaf') { const lf = (Ln, wd) => `M0,1.6Q${wd},${f(-Ln * 0.42)} 0,${f(-Ln)}Q${-wd},${f(-Ln * 0.42)} 0,1.6Z`; hp = Pa(lf(Lh, 1.5), 'p hc'); mp = Pa(lf(Lm, 1.25), 'p hc'); }
  else if (st === 'epee') { hp = Pa(kite(Lh, 0.8, 0.28), 'k'); mp = Pa(kite(Lm, 0.62, 0.28), 'k'); }
  else if (st === 'pencil') { hp = Pa(pen(Lh, 0.62), 'p'); mp = Pa(pen(Lm, 0.48), 'p'); }
  else { hp = Pa(pen(Lh, 0.8), 'p'); mp = Pa(pen(Lm, 0.62), 'p'); }
  let s = `<g data-hand="h">${hp}</g><g data-hand="m">${mp}</g>`;
  if (w.chrono) s += `<g data-chr="s" data-bps="${b}">${L(0, 3.2, 0, -Lm * 1.04, 'hd')}${Pa(polyD([[-0.5, f(-Lm * 0.9)], [0.5, f(-Lm * 0.9)], [0, f(-Lm * 1.04)]]), 'k')}</g>`;
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
  let s = base(w, g) + bezel(w, g) + dial(w, g, o) + handsAt(w, g);
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
/* The watches on the Workbench have a movement laid out from a source (see each watch's History there). These are the same positions, in the same units
   as workbench/model.js (millimetres, at the scale of a 27 mm movement; x and y as seen from the back, crown to the left unless noted), so Fig. 5 shows the same plan.
   pr: plate radius in those units. Each wheel is [x, y, radius]; bridges are lists of [x, y, r] circles whose outline is drawn. Keep in step with the model. */
const PLAN = {
  speedy105003: { cal: '321', pr: 13.5, barrel: [-3.3, -6.7, 5.85], centre: [0, 0, 3.95], third: [3.95, -2.05, 3.15], fourth: [6.95, 0, 2.92], esc: [6.9, 3.3, 1.75], pal: [4.6, 5.3], bal: [2.1, 7.6, 5.16],
    tq: { r: 13.2, open: 6.5, bay: 2.5 }, bridges: [[[6.9, 3.3, 1.0], [9.6, 4.6, 0.9]]], cock: [[2.1, 7.6, 1.4], [-4.25, 11.0, 1.5]],
    chrono: { run: 3.1, drive: [6.95, 0, 2.9], coup: [3.9, -4.0, 2.15], rec: [[-7.1, 0, 1.9]], cw: [-1.05, -8.85], small: [[-5.0, -2.0, 0.9]], bridge: [[[0, 0, 1.15], [-7.1, 0, 1.05]], [[-3.5, 0, 1.0], [-4.6, 5.4, 1.0]], [[-3.5, 0, 1.0], [-4.0, -5.6, 1.0]]] } },
  a386: { cal: '3019 PHC', pr: 14.65, barrel: [-3.0, -7.3, 6.6], centre: [0, 0, 3.5], third: [3.5, -2.1, 3.3], fourth: [6.85, 0, 3.2], esc: [8.6, 3.3, 1.6], pal: [8.3, 5.3], bal: [5.7, 6.3, 4.31],
    bridges: [[[-3.0, -7.3, 5.6]], [[0, 0, 1.6], [3.5, -2.1, 1.5], [6.85, 0, 1.5]], [[8.6, 3.3, 1.0], [11.2, 2.4, 0.9]]], cock: [[5.7, 6.3, 1.3], [2.0, 13.0, 1.3]], rotor: 0,
    chrono: { run: 2.8, drive: [6.85, 0, 2.9], coup: [3.5, -4.4, 2.63], rec: [[-6.8, 0, 1.9]], cw: [-1.0, -8.5], bridge: [[[0, 0, 1.15], [-6.8, 0, 1.05]], [[0, 0, 1.0], [0.4, -5.6, 0.9]], [[-3.4, 0, 1.0], [-4.2, 5.0, 0.9]]] } },
  sub5513: { cal: '1530', pr: 14.25, barrel: [-1.93, 7.12, 5.75], centre: [0, 0, 3.95], third: [-2.55, -3.65, 3.0], fourth: [-1.46, -6.94, 2.7], esc: [1.64, -6.88, 1.7], pal: [4.0, -4.5], bal: [7.84, -2.43, 5.56],
    bridges: [[[-1.93, 7.12, 5.2]], [[0, 0, 1.5], [-2.55, -3.65, 1.5], [-1.46, -6.94, 1.4], [1.64, -6.88, 1.3]]], cock: [[7.84, -2.43, 1.4], [10.2, 5.0, 1.4]], over: [[-2.55, -3.65, 4.0]], rotor: 0 },
  daytona6263: { cal: '727', pr: 14.75, barrel: [-3.5, -6.62, 6.6], centre: [0, 0, 4.8], third: [4.92, -2.63, 3.5], fourth: [8.05, 0, 3.15], esc: [7.6, 3.79, 2.85], pal: [4.6, 5.6], bal: [0.85, 8.0, 5.9],
    bridges: [[[-3.5, -6.62, 5.8], [0, 0, 1.7]], [[4.92, -2.63, 1.5], [8.05, 0, 1.5], [7.6, 3.79, 1.2]]], cock: [[0.85, 8.0, 1.4], [-5.8, 11.6, 1.4]],
    chrono: { run: 3.45, drive: [8.05, 0, 3.3], coup: [4.24, -4.25, 2.4], rec: [[-7.85, 0, 1.9]], cw: [-2.3, -10.0], small: [[-4.7, -1.4, 0.9]], bridge: [[[0, 0, 1.15], [-7.85, 0, 1.05]], [[-3.9, 0, 1.0], [-6.2, 5.3, 0.9]], [[-3.9, 0, 1.0], [-3.7, -2.8, 0.9]]] } },
  monaco: { cal: '11', pr: 15.5, crown: 1, barrel: [4.5, -7.7, 6.1], centre: [3.55, -0.85, 3.35], third: [2.4, 3.1, 2.55], fourth: [6.0, 3.9, 2.8], esc: [5.4, 7.2, 1.7], pal: [3.1, 8.5], bal: [0.4, 10.25, 4.86],
    bridges: [[[4.5, -7.7, 5.2]], [[3.55, -0.85, 1.4], [2.4, 3.1, 1.3], [6.0, 3.9, 1.5]]], cock: [[0.4, 10.25, 1.4], [-8.2, 10.3, 1.4]], micro: [-8.3, -0.1, 7.0],
    chrono: { run: 3.8, drive: [6.0, 3.9, 2.3], coup: [3.7, 2.4, 0.45], rec: [[-7.8, 0, 1.9], [8.35, 0.1, 1.9]], cam: [-10.0, -6.5], bridge: [[[0, 0, 1.15], [-7.8, 0, 1.05]], [[-3.9, 0, 1.0], [-3.2, 5.5, 0.9]], [[-3.9, 0, 1.0], [-6.4, 4.6, 0.9]]] } },
  royaloak: { cal: '2121', pr: 14.2, barrel: [-6.6, -0.1, 5.2], centre: [0, 0, 4.0], third: [4.6, 0, 2.9], fourth: [6.22, -3.0, 2.05], esc: [4.9, -5.2, 1.5], pal: [2.3, -5.67], bal: [-0.7, -6.74, 4.28],
    bridges: [[[-6.6, -0.1, 4.2]], [[0, 0, 1.5], [4.6, 0, 1.5], [6.22, -3.0, 1.3]]], cock: [[-0.7, -6.74, 1.3], [-6.4, -6.7, 1.3]], rotor: 180 },
  '62mas': { cal: '6217A', pr: 13.8, barrel: [-2.04, 6.65, 5.6], centre: [0, 0, 3.4], third: [-2.8, -3.1, 3.2], fourth: [0, 0, 3.75], esc: [3.72, -2.37, 1.4], pal: [6.15, -0.57], bal: [9.8, 2.1, 3.7],
    bridges: [[[-2.04, 6.65, 4.6], [0, 0, 1.6], [-2.8, -3.1, 1.5], [3.72, -2.37, 1.2]]], cock: [[9.8, 2.1, 1.3], [7.3, -7.5, 1.3]], rotor: 0 },
  calatrava: { cal: '12‴-120', pr: 13.5, turn: 1, barrel: [-6.4, -3.1, 5.9], centre: [0, 0, 4.05], third: [4.3, -2.05, 3.3], fourth: [7.68, 0, 3.15], esc: [7.5, 3.9, 2.2], pal: [5.15, 5.1], bal: [1.35, 7.4, 5.7],
    bridges: [[[-6.4, -3.1, 5.4]], [[0, 0, 1.5], [4.3, -2.05, 1.4], [9.6, -7.2, 1.1]], [[7.68, 0, 1.15], [11.6, -3.0, 1.0]], [[7.5, 3.9, 1.0], [11.4, 2.3, 0.9]]], cock: [[1.35, 7.4, 1.4], [-5.15, 10.8, 1.3]] },
  tanklc: { cal: 'LeCoultre 818', pr: 13.5, barrel: [-3.05, 6.23, 5.6], centre: [0, 0, 4.5], third: [-2.6, -4.67, 3.3], fourth: [0, -7.79, 2.7], esc: [2.99, -9.09, 1.6], pal: [4.67, -6.23], bal: [6.88, -2.01, 5.54],
    bridges: [[[-3.05, 6.23, 5.0]], [[0, 0, 1.15], [-2.6, -4.67, 1.4], [0, -7.79, 1.2]]], cock: [[6.88, -2.01, 1.4], [9.6, 5.6, 1.3]] },
  spaceview: { cal: '214', fork: 1, pr: 14.5 }
};
PLAN.navitimer = { cal: 'Venus 178', pr: 15.5, barrel: [-4.0, -6.76, 6.95], centre: [0, 0, 5.3], third: [5.31, -2.99, 3.3], fourth: [8.2, -0.41, 3.3], esc: [9.68, 3.27, 2.72], pal: [7.0, 5.1], bal: [4.04, 7.59, 6.48],
  bridges: [[[-4.0, -6.76, 6.1], [0, 0, 1.7]], [[5.31, -2.99, 1.5], [8.2, -0.41, 1.5], [9.68, 3.27, 0.5]]], cock: [[4.04, 7.59, 1.4], [-3.2, 13.0, 1.4]],
  chrono: { run: 3.5, drive: [8.2, -0.41, 3.4], coup: [4.07, -4.34, 2.3], rec: [[-8.37, -0.1, 2.6]], cw: [2.32, -9.6], small: [[-4.6, -2.6, 0.9]], bridge: [[[0, 0, 1.15], [-8.37, -0.1, 1.05]], [[-4.2, 0, 1.0], [-4.4, 5.9, 0.9]]] } };
PLAN.explorer1016 = Object.assign({}, PLAN.sub5513, { cal: '1560' }); // same layout as the Submariner: both are read from photographs of a calibre 1560
PLAN.carrera = Object.assign({}, PLAN.daytona6263, { cal: 'Valjoux 72' }); // the Carrera 2447 uses the same calibre as the Daytona's 727, so it shares that layout
function planMovement(w, pl) {
  const k = 15 / pl.pr, X = q => (pl.turn ? [q[1] * k, q[0] * k] : [q[0] * k, -q[1] * k]); // to drawing units; y runs down the page. A "turned" movement (the Calatrava) is drawn a quarter turn round, as the bench mounts it
  const hull = cs => { // outline round a set of circles
    const pts = []; cs.forEach(c => { const [x, y] = X(c), r = c[2] * k; for (let i = 0; i < 28; i++) pts.push([x + r * Math.cos(i * Math.PI / 14), y + r * Math.sin(i * Math.PI / 14)]); });
    pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]); const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of pts) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of pts.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return polyD(lo.slice(0, -1).concat(up.slice(0, -1)).map(q => [f(q[0]), f(q[1])]));
  };
  const G = (c, r) => { const [x, y] = X(c); return gear((r || c[2]) * k, x, y); }, J = c => jewel(...X(c));
  const sx = pl.crown ? 1 : -1; let s = RC(sx > 0 ? 14.6 : -18.8, -0.5, 4.2, 1) + RC(sx > 0 ? 17.6 : -19, -1.2, 1.4, 2.4, 'p', 0.3) + C(15, 0, 0, 'p') + C(14.3, 0, 0, 't');
  if (pl.fork) return svg('-20 -20 40 40', C(15, 0, 0, 'p') + C(14.3, 0, 0, 't') + forkPlan(k), 'fig mvt', `${w.brand} ${w.model}, movement plan`);
  if (pl.micro) { const [x, y] = X(pl.micro), r = pl.micro[2] * k; s += C(r, x, y, 't') + Pa(`M${f(x)},${f(y - r)}A${f(r)},${f(r)} 0 0 0 ${f(x)},${f(y + r)}Z`, 'tn') + C(0.8, x, y, 'p'); }
  s += G(pl.barrel) + C(pl.barrel[2] * k * 0.34, ...X(pl.barrel), 't') + G(pl.centre) + G(pl.third) + G(pl.fourth) + G(pl.esc);
  const [px, py] = X(pl.pal), [ex, ey] = X(pl.esc), [bx, by] = X(pl.bal);
  s += L(px, py, px + (ex - px) * 0.55, py + (ey - py) * 0.55, 'hd') + L(px, py, px + (bx - px) * 0.6, py + (by - py) * 0.6, 'hd') + C(0.45, px, py, 'k');
  if (pl.tq) { // the Speedmaster's three-quarter plate: a disc, opened round the balance, with a bay for the escape wheel
    const R = pl.tq.r, B = pl.bal, E = pl.esc, cut = a => { const dx = E[0] - B[0], dy = E[1] - B[1], bq = dx * Math.cos(a) + dy * Math.sin(a), dq = bq * bq - (dx * dx + dy * dy - pl.tq.bay * pl.tq.bay); return Math.max(pl.tq.open, dq > 0 ? bq + Math.sqrt(dq) : 0); };
    const inC = (x, y) => Math.hypot(x - B[0], y - B[1]) < cut(Math.atan2(y - B[1], x - B[0])), tc = Math.atan2(B[1], B[0]), pts = [];
    for (let i = 0; i < 180; i++) { const a = tc + i / 180 * Math.PI * 2, x = R * Math.cos(a), y = R * Math.sin(a); if (!inC(x, y)) pts.push(X([x, y])); }
    for (let i = 0; i < 180; i++) { const a = tc - i / 180 * Math.PI * 2, r = cut(a), x = B[0] + r * Math.cos(a), y = B[1] + r * Math.sin(a); if (Math.hypot(x, y) < R) pts.push(X([x, y])); }
    s += Pa(polyD(pts.map(q => [f(q[0]), f(q[1])])), 'l');
  }
  (pl.bridges || []).forEach(b => { s += Pa(hull(b), 'l'); });
  s += J(pl.third) + J(pl.fourth) + J(pl.esc) + (pl.chrono || pl.rotor != null ? '' : J(pl.centre));
  (pl.over || []).forEach(c => { s += G(c); }); // a wheel riding above the bridge (the Submariner's seconds drive)
  s += balance(f(bx), f(by), f(pl.bal[2] * k), w) + Pa(hull(pl.cock), 'l') + J(pl.bal);
  if (pl.chrono) { const c = pl.chrono;
    s += G([0, 0], c.run) + G(c.drive) + G(c.coup); c.rec.forEach(r => { s += G(r); }); (c.small || []).forEach(r => { s += G(r); });
    if (c.cw) { const [x, y] = X(c.cw); s += C(1.6, x, y, 'p'); for (let i = 0; i < 6; i++) { const q = P(i * 60, 1.6, x, y); s += RC(q[0] - 0.3, q[1] - 0.3, 0.6, 0.6, 'k'); } }
    if (c.cam) { const [x, y] = X(c.cam); s += Pa(hull([[c.cam[0], c.cam[1], 1.0], [c.cam[0] + 1.5, c.cam[1] + 0.5, 0.55], [c.cam[0] - 0.9, c.cam[1] + 1.1, 0.5]]), 'tn') + C(0.3, x, y, 'k'); }
    c.bridge.forEach(b => { s += Pa(hull(b), 't', 'stroke-dasharray=".6 .4"'); });
  }
  if (pl.rotor != null) { // a full rotor, drawn over half the movement and see-through, as at rest
    s += `<g transform="rotate(${pl.rotor})">` + Pa(`M${P(270, 14)}A14,14 0 0 0 ${P(90, 14)}L${P(90, 10.6)}A10.6,10.6 0 0 1 ${P(270, 10.6)}Z`, 'rot') + L(-10.6, 0, -1.6, 0, 'l') + L(1.6, 0, 10.6, 0, 'l') + '</g>' + C(1.6, 0, 0, 'p') + C(0.5, 0, 0, 'k');
  }
  return svg('-20 -20 40 40', s, 'fig mvt', `${w.brand} ${w.model}, movement plan`);
}
/* The Accutron from the dial side, as Bulova draws it: a plate with three openings, the coils at twelve, the fork, the electronics. The wheels behind the plate are dashed. */
function forkPlan(k) {
  const Y = y => -y * k, Xx = x => x * k, dash = 'stroke-dasharray=".5 .4"'; let s = '';
  s += RC(Xx(-8.75), Y(11.15), 17.1 * k, 6.7 * k, 'tn', 3.35 * k) + C(5.5 * k, Xx(-7.8), Y(-1.6), 'tn') + C(4.6 * k, Xx(8.5), Y(-2.0), 'tn');
  s += C(4.4 * k, Xx(-7.8), Y(-1.6), 'p') + T('+', Xx(-7.8), Y(-1.6) + 1, 3, 'tx');
  s += RC(Xx(9.0), Y(0.5), 2.6 * k, 5 * k, 'p') + C(0.8 * k, Xx(10.1), Y(-0.7), 'k') + RC(Xx(9.9), Y(-2.2), 0.8 * k, 1.5 * k, 'k');
  s += C(2.9 * k, 0, 0, 't', dash) + C(2.9 * k, Xx(2.4), Y(2.19), 't', dash) + C(1.2 * k, Xx(5.4), Y(3.3), 't', dash) + C(0.3, 0, 0, 'k');
  s += RC(Xx(-5.25), Y(-7.3), 10.5 * k, 2.2 * k, 'p', 0.4);
  for (const sx of [-1, 1]) {
    s += RC(Xx(sx * 4.7) - 0.55 * k, Y(7.2), 1.1 * k, 14.6 * k, 'p');
    s += RC(Xx(sx * 5.6) - 1.25 * k, Y(9.25), 2.5 * k, 2.5 * k, 'tn2', 0.3) + RC(Xx(sx * 7.6) - 1.5 * k, Y(8.85), 3.0 * k, 1.7 * k, 'k', 0.3);
  }
  return s;
}
function movement(w) {
  if (PLAN[w.id]) return planMovement(w, PLAN[w.id]);
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
const REAL_LIGHT = ".l{fill:none;stroke:#4a453a;stroke-width:.14}.p{fill:#ece6d4;stroke:#14120e;stroke-width:.1}.t{fill:none;stroke:#14120e;stroke-width:.11}.hair{fill:none;stroke:#14120e;stroke-width:.05}.k{fill:#14120e}.tn,.tn2{fill:#cfc6ae;stroke:#14120e;stroke-width:.12}.bar{fill:none;stroke:#14120e;stroke-width:.5}text{fill:#0c0b09;font-family:Georgia,'Times New Roman',serif}.bz{font-family:Helvetica,Arial,sans-serif;font-weight:bold}"; // inks are near black: the studio lighting lifts anything paler to a weak tan
const TECH = ".l{fill:none;stroke:#242521;stroke-width:.2}.p{fill:#EDE6D8;stroke:#242521;stroke-width:.2}.t{fill:none;stroke:#242521;stroke-width:.1}.hair{fill:none;stroke:#242521;stroke-width:.05}.k{fill:#242521}.tn,.tn2{fill:#D9CEB9;stroke:#242521;stroke-width:.2}.bar{fill:none;stroke:#242521;stroke-width:.5}text{fill:#242521;font-family:Georgia,'Times New Roman',serif}.bz{font-family:Helvetica,Arial,sans-serif;font-weight:bold}";
function face(w, real) {
  const g = geo(w), R = g.bezR || g.hw;
  // A light dial can still carry a black bezel and dark registers (the Daytona): those keep the dark palette.
  const mixed = real && !w.dial.dark ? `${w.bezel && w.bezel.dark ? '.bzd .tn{fill:#121212;stroke:#2b2b2b}.bzd text{fill:#f0ede2}.bzd .t,.bzd .hair{stroke:#e9e6da}.bzd .bar{stroke:#e9e6da}.bzd .k{fill:#e9e6da}' : ''}${w.dial.subDark ? '.tn2{fill:#161616;stroke:#2b2b2b}' : ''}` : '';
  const gold = real && w.dial.gold ? '.nm,.cal,.dl{fill:#cfa13a}.hc{fill:#cfa13a;stroke:#4a3c16}.mw{fill:#1b2a55;stroke:#cfa13a;stroke-width:.08}.mn{fill:#e3c060;stroke:none}.t,.hair{stroke:#b08a34}.k{fill:#cfa13a}' : '';
  const gilt = real && w.dial.gilt ? '.dl{fill:#c9a45c}.gt .t{stroke:#c9a45c}' : ''; // printing in gilt, as on the early glossy dials
  const ap = real && !w.dial.dark ? '.ap{fill:#a7a8a4}' : ''; // applied steel bars on a pale dial
  const sf = real && w.dial.subFills ? 'svg{--so:1;' + Object.entries(w.dial.subFills).map(q => `--sf${q[0]}:${q[1][0]}`).join(';') + '}' + Object.entries(w.dial.subFills).filter(q => q[1][1]).map(q => `.sk${q[0]}{stroke:#ecece8}`).join('') : ''; // each register's colour, and pale marks on the dark ones
  const pinkHands = real && w.dial.goldHands ? '.hc{fill:#cf9a78;stroke:#5a3b2a}.mw{fill:#1b2a55;stroke:#5a3b2a;stroke-width:.08}.mn{fill:#e3c060;stroke:none}' : '';
  const g3 = real && w.dial.custom === 'gyro3' ? '.g3-base{fill:#050506;stroke:none}.g3-met{fill:#5d5f63;stroke:#2f3033;stroke-width:.08}.g3-streak{stroke:#9a9c9f;stroke-width:.07}.g3-rim{fill:#c98d6b;stroke:#5a3b2a;stroke-width:.06}.g3-hole{fill:#09090a}.g3-blue{fill:#0a1340;stroke:#c98d6b;stroke-width:.06}.g3-white{fill:#f2f0e9;stroke:#8a8a86;stroke-width:.05}.g3-ink{stroke:#1a1a1a}.g3-inkf{fill:#1a1a1a;font-family:Helvetica,Arial,sans-serif}.g3-gold{fill:#dba886;stroke:#5a3b2a;stroke-width:.04}.g3-star{fill:#d5dcff}.g3-day{fill:#e3e1da;stroke:none}.g3-steel{fill:#b9bbbd;stroke:#4a4c4f;stroke-width:.07}.g3-screw{fill:#2a55a8;stroke:#0d1f45;stroke-width:.06}.g3-teeth{stroke:#c9cbcd;stroke-width:.09}.g3-sun{fill:#dba886;stroke:none}.g3-ray{stroke:#b98a64;stroke-width:.06}.g3-wt{stroke:#eef0ff}.g3-txt{fill:#e6e6e6}' : '';
  const s = `<style>${real ? (w.dial.dark ? REAL : REAL_LIGHT) : TECH}${mixed}${gold}${gilt}${ap}${pinkHands}${g3}${sf}</style><circle r="${R}" fill="${real ? '#b5b5af' : '#EDE6D8'}"/><g class="bzd">${bezel(w, g)}</g>` + dial(w, g, { noHands: true });
  // The dial is drawn once as a picture, so the date window is filled here with today's date; on the plates it is filled live.
  const today = new Date(), DAYS3 = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const dated = s.replace(new RegExp('(data-date=""[^>]*>)', 'g'), `$1${today.getDate()}`).replace(new RegExp('(data-daydate=""[^>]*>)', 'g'), `$1${DAYS3[today.getDay()]} ${today.getDate()}`);
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="${-R} ${-R} ${2 * R} ${2 * R}">${dated}<style>.dt{fill:#1a1a1a}</style></svg>`, R, dialR: g.dialR, inR: g.inR, bezelInner: R - (w.bezel ? w.bezel.w : 0), handLen: g.hl };
}

window.Draw = { front, side, rear, exploded, movement, bps, face, G3, plan: id => PLAN[id] || null };
})();
