/* The Earth and its moon, between the question and the sky.
   A picture, not a model to scale: the moon is drawn far closer and the turning far faster than in life.
   Both are real spheres lit by one sun. The land is generated, Earth-like, and is not a map of the real continents. */
(function () {
'use strict';
const cv = document.getElementById('mo-cv'); if (!cv || !cv.getContext) return;
const ctx = cv.getContext('2d'), calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU = Math.PI * 2, clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/* ---------- noise: seeded, so the world is the same on every visit ---------- */
const P = new Uint8Array(512), G = new Float32Array(256);
let sd = 20261; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 256; i++) { P[i] = i; G[i] = rnd(); }
for (let i = 255; i > 0; i--) { const j = (rnd() * (i + 1)) | 0, t = P[i]; P[i] = P[j]; P[j] = t; }
for (let i = 0; i < 256; i++) P[i + 256] = P[i];
function vn(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z); let fx = x - xi, fy = y - yi, fz = z - zi;
  fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); fz = fz * fz * (3 - 2 * fz);
  const X = xi & 255, Y = yi & 255, Z = zi & 255, A = P[X] + Y, B = P[X + 1] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, BA = P[B] + Z, BB = P[B + 1] + Z;
  const a = G[P[AA]], b = G[P[BA]], c = G[P[AB]], d = G[P[BB]], e = G[P[AA + 1]], f = G[P[BA + 1]], g = G[P[AB + 1]], h = G[P[BB + 1]];
  const x0 = a + (b - a) * fx, x1 = c + (d - c) * fx, x2 = e + (f - e) * fx, x3 = g + (h - g) * fx, y0 = x0 + (x1 - x0) * fy, y1 = x2 + (x3 - x2) * fy;
  return y0 + (y1 - y0) * fz;
}
function fbm(x, y, z, o) { let s = 0, a = 0.5, n = 0; for (let i = 0; i < o; i++) { s += a * vn(x, y, z); n += a; a *= 0.5; x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 4.1; } return s / n; }

/* ---------- the two surfaces, painted once ---------- */
const TW = 1024, TH = 512, MW = 512, MH = 256;
const TEX = new Uint8ClampedArray(TW * TH * 4), CLD = new Uint8Array(TW * TH), LIT = new Uint8Array(TW * TH), HGT = new Float32Array(TW * TH), MOON = new Uint8Array(MW * MH);
const mix = (a, b, t, k) => a[k] + (b[k] - a[k]) * t;
const C = { forest: [30, 60, 36], jungle: [24, 66, 34], grass: [90, 102, 58], desert: [172, 147, 102], rock: [106, 97, 86], tundra: [102, 102, 84], ice: [233, 238, 243], shoal: [28, 80, 124], deep: [8, 28, 62] };
let sea = 0.5;

function earthHeights(y) {
  const lat = (0.5 - (y + 0.5) / TH) * Math.PI, cl = Math.cos(lat), py = Math.sin(lat);
  for (let x = 0; x < TW; x++) {
    const lo = (x + 0.5) / TW * TAU, px = cl * Math.sin(lo), pz = cl * Math.cos(lo);
    const w1 = fbm(px * 1.2 + 11, py * 1.2 + 3, pz * 1.2 + 7, 3) - 0.5, w2 = fbm(px * 1.2 - 5, py * 1.2 + 17, pz * 1.2 + 1, 3) - 0.5;
    HGT[y * TW + x] = fbm(px * 1.5 + w1 * 0.9 + 31, py * 1.5 + w2 * 0.9 + 47, pz * 1.5 + w1 * 0.9 + 13, 6);
  }
}
function seaLevel() { // set the shoreline so about three tenths of the globe is land, as on Earth
  const bins = new Float64Array(512); let tot = 0;
  for (let y = 0; y < TH; y++) { const w = Math.cos((0.5 - (y + 0.5) / TH) * Math.PI); for (let x = 0; x < TW; x += 2) { bins[clamp((HGT[y * TW + x] * 512) | 0, 0, 511)] += w; tot += w; } }
  let acc = 0; for (let i = 0; i < 512; i++) { acc += bins[i]; if (acc >= tot * 0.69) { sea = (i + 1) / 512; return; } }
}
function earthColours(y) {
  const lat = (0.5 - (y + 0.5) / TH) * Math.PI, cl = Math.cos(lat), py = Math.sin(lat), al = Math.abs(lat) * 180 / Math.PI, band = 0.03 * Math.cos(lat * 6);
  const col = [0, 0, 0];
  for (let x = 0; x < TW; x++) {
    const i = y * TW + x, lo = (x + 0.5) / TW * TAU, px = cl * Math.sin(lo), pz = cl * Math.cos(lo), h = HGT[i];
    const m = fbm(px * 3.1 + 20, py * 3.1 + 20, pz * 3.1 + 20, 3), grain = (vn(px * 46, py * 46, pz * 46) - 0.5) * 16;
    let ocean = 0, lights = 0;
    if (h > sea) {
      const e = clamp((h - sea) * 7, 0, 1), arid = clamp(Math.exp(-Math.pow((al - 23) / 12, 2)) * 1.25 - (m - 0.42) * 3, 0, 1);
      const base = al < 16 ? C.jungle : C.forest, dry = clamp((0.55 - m) * 3, 0, 1), rk = clamp((e - 0.4) * 2.4, 0, 1);
      const cold = clamp((al - 52 + (m - 0.5) * 14) / 12, 0, 1), ice = clamp((al - 66 + (m - 0.5) * 16 + e * 18) / 5, 0, 1);
      for (let k = 0; k < 3; k++) { let v = base[k] + (C.grass[k] - base[k]) * dry; v += (C.desert[k] - v) * arid; v += (C.rock[k] - v) * rk; v += (C.tundra[k] - v) * cold; v += (C.ice[k] - v) * ice; col[k] = v + grain * (1 - ice * 0.7); }
      if (ice < 0.2 && arid < 0.75 && al < 62) { const v = vn(px * 74, py * 74, pz * 74), pop = fbm(px * 5 + 40, py * 5 + 40, pz * 5 + 40, 2); if (v > 0.68 && pop > 0.5) lights = clamp((v - 0.68) / 0.32 * (pop - 0.5) * 5, 0, 1); }
    } else {
      const d = clamp((sea - h) * 12, 0, 1), si = clamp((al - 73 + (m - 0.5) * 14) / 4, 0, 1);
      for (let k = 0; k < 3; k++) { let v = mix(C.shoal, C.deep, d, k); v += (C.ice[k] - v) * si; col[k] = v + grain * 0.25; }
      ocean = 1 - si;
    }
    TEX[i * 4] = col[0]; TEX[i * 4 + 1] = col[1]; TEX[i * 4 + 2] = col[2]; TEX[i * 4 + 3] = ocean * 255; LIT[i] = lights * 255;
    const cw = fbm(px * 2 + 60, py * 2 + 60, pz * 2 + 60, 3) - 0.5, c = fbm(px * 2.4 + cw * 1.4 + 80, py * 4.2 + 90, pz * 2.4 + cw * 1.4 + 70, 5);
    CLD[i] = sstep(0.5 - band, 0.67 - band, c) * 235;
  }
}
const craters = []; { let s2 = 977; const r2 = () => (s2 = (s2 * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) { const z = r2() * 2 - 1, a = r2() * TAU, q = Math.sqrt(1 - z * z), big = r2(); craters.push([q * Math.cos(a), z, q * Math.sin(a), big > 0.93 ? 0.13 + r2() * 0.06 : big > 0.6 ? 0.05 + r2() * 0.04 : 0.018 + r2() * 0.025, r2() > 0.9 ? 1 : 0]); } }
function moonRow(y) {
  const lat = (0.5 - (y + 0.5) / MH) * Math.PI, cl = Math.cos(lat), py = Math.sin(lat);
  for (let x = 0; x < MW; x++) {
    const lo = ((x + 0.5) / MW - 0.5) * TAU, px = cl * Math.cos(lo), pz = cl * Math.sin(lo);
    let a = 0.66 + (fbm(px * 4 + 5, py * 4 + 5, pz * 4 + 5, 5) - 0.5) * 0.3;
    const mare = sstep(0.5, 0.58, fbm(px * 1.5 + 3, py * 1.5 + 8, pz * 1.5 + 2, 4) + px * 0.07); a += (0.3 - a) * mare * 0.85; // the dark seas, a little commoner on the face that looks at the Earth
    for (let k = 0; k < craters.length; k++) { const c = craters[k], dt = px * c[0] + py * c[1] + pz * c[2]; if (dt < 0.9) continue;
      const d = Math.acos(dt > 1 ? 1 : dt) / c[3]; if (d < 1) a *= 0.8 + 0.14 * d; const rim = d - 1; a += 0.13 * Math.exp(-rim * rim * 55); if (c[4] && d < 5) a += 0.09 * Math.exp(-d * 0.9); }
    MOON[y * MW + x] = clamp(a, 0.08, 1) * 255;
  }
}

/* ---------- the geometry: one sun, a tilted orbit, both kept in view ---------- */
const rot = (v, g) => [v[0] * Math.cos(g) - v[1] * Math.sin(g), v[0] * Math.sin(g) + v[1] * Math.cos(g), v[2]];
const TILT = 18 * Math.PI / 180, LEAN = 16 * Math.PI / 180, ORB = 2.6, RM = 0.27;
const E1 = rot([1, 0, 0], LEAN), E2 = rot([0, -Math.sin(TILT), Math.cos(TILT)], LEAN), NRM = rot([0, Math.cos(TILT), Math.sin(TILT)], LEAN);
const L = (() => { const v = [0, 0, 0]; for (let k = 0; k < 3; k++) v[k] = -0.62 * E1[k] + 0.78 * E2[k] + 0.13 * NRM[k]; const n = Math.hypot(v[0], v[1], v[2]); return [v[0] / n, v[1] / n, v[2] / n]; })();
const AX = -0.36; // the Earth's axis leans a little

let W = 0, H = 0, dpr = 1, R = 0, K = 0, S = 0, SM = 0, eImg, mImg, eCv, mCv, halo, T = {};
function setup() {
  const box = cv.parentNode.getBoundingClientRect(); W = Math.round(box.width); H = Math.round(box.height); if (!W || !H) return;
  dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr;
  R = clamp(Math.min(W * 0.175, H * 0.23), 40, 150); const Rp = R * dpr; S = 2 * Math.ceil(Rp) + 4; const c = S / 2;
  eCv = document.createElement('canvas'); eCv.width = eCv.height = S; eImg = eCv.getContext('2d').createImageData(S, S);
  const n = S * S, PI4 = new Int32Array(n), U = new Float32Array(n), V = new Int32Array(n), NX = new Float32Array(n), NY = new Float32Array(n), NZ = new Float32Array(n), DIF = new Float32Array(n), DAY = new Float32Array(n), SPC = new Float32Array(n), RIM = new Float32Array(n), AAl = new Float32Array(n);
  const hl = Math.hypot(L[0], L[1], L[2] + 1), HX = L[0] / hl, HY = L[1] / hl, HZ = (L[2] + 1) / hl; K = 0;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    let dx = (x + 0.5 - c) / Rp, dy = -(y + 0.5 - c) / Rp; const r = Math.hypot(dx, dy), aa = clamp((1 - r) * Rp + 0.5, 0, 1); if (aa <= 0) continue;
    if (r > 0.9995) { dx *= 0.9995 / r; dy *= 0.9995 / r; } const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const bx = dx * Math.cos(AX) + dy * Math.sin(AX), by = -dx * Math.sin(AX) + dy * Math.cos(AX), nl = dx * L[0] + dy * L[1] + nz * L[2], day = sstep(-0.1, 0.2, nl);
    PI4[K] = (y * S + x) * 4; U[K] = Math.atan2(bx, nz) / TAU + 1; V[K] = clamp(((0.5 - Math.asin(clamp(by, -1, 1)) / Math.PI) * TH) | 0, 0, TH - 1) * TW;
    NX[K] = dx; NY[K] = dy; NZ[K] = nz; DAY[K] = day; DIF[K] = Math.max(day * 0.05, Math.pow(Math.max(0, nl), 0.85) * (0.62 + 0.38 * Math.sqrt(nz)));
    SPC[K] = Math.pow(Math.max(0, dx * HX + dy * HY + nz * HZ), 46) * 0.7; RIM[K] = Math.pow(1 - nz, 2.6) * day; AAl[K] = aa * 255; K++;
  }
  T = { PI4, U, V, NX, NY, NZ, DIF, DAY, SPC, RIM, AAl };
  // the thin shell of air: a faint light on the sunward limb only
  const hs = Math.ceil(Rp * 1.09) * 2 + 2, hc = hs / 2; halo = document.createElement('canvas'); halo.width = halo.height = hs; const hx = halo.getContext('2d'), hi = hx.createImageData(hs, hs);
  for (let y = 0; y < hs; y++) for (let x = 0; x < hs; x++) { const dx = (x + 0.5 - hc) / Rp, dy = -(y + 0.5 - hc) / Rp, r = Math.hypot(dx, dy); if (r < 0.985 || r > 1.08) continue;
    const f = clamp(1 - (r - 1) / 0.08, 0, 1), lit = sstep(-0.35, 0.45, (dx * L[0] + dy * L[1]) / r), j = (y * hs + x) * 4; hi.data[j] = 96; hi.data[j + 1] = 156; hi.data[j + 2] = 236; hi.data[j + 3] = f * f * lit * 84; }
  hx.putImageData(hi, 0, 0);
  SM = 2 * Math.ceil(Rp * RM) + 4; mCv = document.createElement('canvas'); mCv.width = mCv.height = SM; mImg = mCv.getContext('2d').createImageData(SM, SM);
}

function drawEarth(t, M) {
  const { PI4, U, V, NX, NY, NZ, DIF, DAY, SPC, RIM, AAl } = T, d = eImg.data, turn = t / 76, drift = t / 61;
  const ml = M[0] * L[0] + M[1] * L[1] + M[2] * L[2], ecl = ml > 0 && Math.hypot(M[0] - ml * L[0], M[1] - ml * L[1], M[2] - ml * L[2]) < 1 + RM * 1.5;
  for (let i = 0; i < K; i++) {
    let u = U[i] - turn; u -= Math.floor(u); const t0 = V[i] + ((u * TW) | 0), j = t0 * 4;
    let uc = U[i] - drift; uc -= Math.floor(uc); const ca = CLD[V[i] + ((uc * TW) | 0)] / 255;
    let sh = 1; if (ecl) { const vx = M[0] - NX[i], vy = M[1] - NY[i], vz = M[2] - NZ[i], s = vx * L[0] + vy * L[1] + vz * L[2]; if (s > 0) sh = 0.1 + 0.9 * sstep(0.5, 1.45, Math.sqrt(Math.max(0, vx * vx + vy * vy + vz * vz - s * s)) / RM); }
    const li = 0.012 + DIF[i] * 1.06 * sh, sp = SPC[i] * (TEX[j + 3] / 255) * (1 - ca) * sh * 190, rm = RIM[i] * sh, nt = LIT[t0] * (1 - DAY[i]) * (1 - ca) * 0.8, o = PI4[i];
    d[o] = (TEX[j] + (238 - TEX[j]) * ca) * li + sp + rm * 34 + nt;
    d[o + 1] = (TEX[j + 1] + (240 - TEX[j + 1]) * ca) * li + sp * 0.96 + rm * 72 + nt * 0.72;
    d[o + 2] = (TEX[j + 2] + (243 - TEX[j + 2]) * ca) * li + sp * 0.86 + rm * 138 + nt * 0.4;
    d[o + 3] = AAl[i];
  }
  eCv.getContext('2d').putImageData(eImg, 0, 0);
}
function drawMoon(M) {
  // the moon keeps one face to the Earth, so it turns once on its axis in each orbit
  const d = mImg.data, c = SM / 2, rp = R * dpr * RM, ml = Math.hypot(M[0], M[1], M[2]), A = [-M[0] / ml, -M[1] / ml, -M[2] / ml];
  const B = [NRM[1] * A[2] - NRM[2] * A[1], NRM[2] * A[0] - NRM[0] * A[2], NRM[0] * A[1] - NRM[1] * A[0]];
  for (let y = 0; y < SM; y++) for (let x = 0; x < SM; x++) {
    let dx = (x + 0.5 - c) / rp, dy = -(y + 0.5 - c) / rp; const r = Math.hypot(dx, dy), aa = clamp((1 - r) * rp + 0.5, 0, 1), o = (y * SM + x) * 4; if (aa <= 0) { d[o + 3] = 0; continue; }
    if (r > 0.9995) { dx *= 0.9995 / r; dy *= 0.9995 / r; } const nz = Math.sqrt(Math.max(0, 1 - dx * dx - dy * dy));
    const lo = Math.atan2(dx * B[0] + dy * B[1] + nz * B[2], dx * A[0] + dy * A[1] + nz * A[2]), la = Math.asin(clamp(dx * NRM[0] + dy * NRM[1] + nz * NRM[2], -1, 1));
    const a = MOON[clamp(((0.5 - la / Math.PI) * MH) | 0, 0, MH - 1) * MW + (clamp((lo / TAU + 0.5) * MW, 0, MW - 1) | 0)] / 255, nl = dx * L[0] + dy * L[1] + nz * L[2];
    let li = Math.pow(Math.max(0, nl), 0.62) * 1.02, cr = 1, cg = 1, cb = 1;
    const qx = M[0] + dx * RM, qy = M[1] + dy * RM, qz = M[2] + nz * RM, s = qx * L[0] + qy * L[1] + qz * L[2];
    if (s < 0) { const f = sstep(0.86, 1.12, Math.sqrt(Math.max(0, qx * qx + qy * qy + qz * qz - s * s))); cr = f + (1 - f) * 0.2; cg = f + (1 - f) * 0.07; cb = f + (1 - f) * 0.045; } // in the Earth's shadow it dims to a dull copper
    d[o] = a * (li * 212 * cr + 5); d[o + 1] = a * (li * 208 * cg + 6); d[o + 2] = a * (li * 200 * cb + 9); d[o + 3] = aa * 255;
  }
  mCv.getContext('2d').putImageData(mImg, 0, 0);
}
function frame(t) {
  const th = 0.9 - TAU * t / 36, M = [0, 0, 0]; for (let k = 0; k < 3; k++) M[k] = ORB * (Math.cos(th) * E1[k] + Math.sin(th) * E2[k]);
  drawEarth(t, M); drawMoon(M);
  const cx = W / 2, cy = H / 2, e = S / dpr, hs = halo.width / dpr, m = SM / dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
  const moon = () => ctx.drawImage(mCv, cx + M[0] * R - m / 2, cy - M[1] * R - m / 2, m, m);
  if (M[2] < 0) moon();
  ctx.drawImage(halo, cx - hs / 2, cy - hs / 2, hs, hs); ctx.drawImage(eCv, cx - e / 2, cy - e / 2, e, e);
  if (M[2] >= 0) moon();
}

/* ---------- paint the surfaces a few rows at a time, then run only while in view ---------- */
let ready = false, seen = false, onscreen = false, last = 0, t0 = 0;
function loop(now) { if (!onscreen || document.hidden) { last = 0; return; } requestAnimationFrame(loop); if (now - last < 31) return; last = now; if (!t0) t0 = now; frame((now - t0) / 1000); }
function go() { if (!ready || !R) return; cv.classList.add('on'); if (calm) { frame(8); return; } if (onscreen && !last) requestAnimationFrame(loop); }
function build() {
  let stage = 0, y = 0; const stages = [[earthHeights, TH], [null, 0], [earthColours, TH], [moonRow, MH]];
  (function step() { const end = performance.now() + 9;
    while (stage < stages.length && performance.now() < end) { const [fn, n] = stages[stage]; if (!fn) { seaLevel(); stage++; y = 0; continue; } fn(y++); if (y >= n) { stage++; y = 0; } }
    if (stage < stages.length) setTimeout(step, 0); else { ready = true; setup(); go(); } })();
}
if ('IntersectionObserver' in window) {
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !seen) { seen = true; build(); } }), { rootMargin: '1400px 0px' }).observe(cv);
  new IntersectionObserver(es => es.forEach(e => { onscreen = e.isIntersecting; go(); })).observe(cv);
} else { onscreen = true; build(); }
document.addEventListener('visibilitychange', go);
let rz = 0; window.addEventListener('resize', () => { clearTimeout(rz); rz = setTimeout(() => { if (ready) { setup(); go(); if (calm) frame(8); } }, 180); });
})();
