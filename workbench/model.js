/* Workbench 3D models.
   buildProcedural() makes an approximate watch from measurements, in millimetres.
   loadGLTF() wraps a supplied .glb so it behaves the same way.
   Axes: the dial faces +Z, twelve o'clock is +Y. */
import * as THREE from 'three';

const INK = 0x242521, BRASS_HI = 0xE2C27A;
const KIND = {
  steel:    { real: { color: 0xcfcfcb, metalness: 1, roughness: 0.3 }, tech: 0xEDE6D8 },
  gold:     { real: { color: 0xd9b25c, metalness: 1, roughness: 0.24 }, tech: 0xEDE6D8 },
  steelDark:{ real: { color: 0x9c9c99, metalness: 1, roughness: 0.36 }, tech: 0xE1D8C4 },
  ink:      { real: { color: 0x1f2022, metalness: 0, roughness: 0.55 }, tech: 0x55544e },
  iron:     { real: { color: 0x8e8e8a, metalness: 1, roughness: 0.5 }, tech: 0xE3DAC6 },
  copper:   { real: { color: 0xd39c7a, metalness: 1, roughness: 0.38 }, tech: 0xE8DFCB },
  brass:    { real: { color: 0xd2aa52, metalness: 1, roughness: 0.3 }, tech: 0xEDE6D8 },
  red:      { real: { color: 0xc0282d, metalness: 0, roughness: 0.5 }, tech: 0xC98A7A },
  ruby:     { real: { color: 0xb3122e, metalness: 0, roughness: 0.15 }, tech: 0xC98A7A },
  white:    { real: { color: 0xf3f1e8, metalness: 0, roughness: 0.6 }, tech: 0xFFFFFF },
  leather:  { real: { color: 0x2a2320, metalness: 0, roughness: 0.9 }, tech: 0xD9CEB9 },
  face:     { real: { color: 0xffffff, metalness: 0.15, roughness: 0.7 }, tech: 0xFFFFFF },
  coil:     { real: { color: 0x2f7a55, metalness: 0, roughness: 0.55 }, tech: 0xCFE0D2 },
  blue:     { real: { color: 0x1f3f8a, metalness: 0.6, roughness: 0.25 }, tech: 0xB9C6D6 },
  acrylic:  { real: { color: 0xffffff, metalness: 0, roughness: 0.03, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }, tech: 0xFFFFFF, techOpacity: 0.1 }
};
const lineMat = new THREE.LineBasicMaterial({ color: INK });
const hiLine = new THREE.LineBasicMaterial({ color: 0x8a6a2a });

function mk(geo, kind, x = {}) {
  const k = KIND[kind];
  const real = new THREE.MeshStandardMaterial({ envMapIntensity: 1.7, ...k.real, ...(x.real || {}) }); if (real.metalness === 1) real.metalness = 0.82;
  const tech = new THREE.MeshBasicMaterial({ color: k.tech, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, transparent: !!k.techOpacity, opacity: k.techOpacity || 1, depthWrite: !k.techOpacity, side: k.real.side || THREE.FrontSide, ...(x.tech || {}) });
  const m = new THREE.Mesh(geo, tech);
  m.userData.real = real; m.userData.tech = tech; m.userData.baseTech = tech.color.getHex();
  if (!x.noEdges) { const e = new THREE.LineSegments(new THREE.EdgesGeometry(geo, x.edgeAngle || 28), lineMat); e.raycast = () => {}; e.userData.edge = true; m.add(e); }
  return m;
}
const lathe = (pts, seg = 96) => new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(Math.max(p[0], 0.0001), p[1])), seg).rotateX(Math.PI / 2);
const cyl = (r, h, seg = 40) => new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2);
const at = (o, x, y, z) => { o.position.set(x, y, z); return o; };
// A rectangle with rounded corners, optionally with a hole (round, or another rounded rectangle): used for flat-sided cases, their crystal and dial.
function rrShape(w, h, r, hole) {
  const s = new THREE.Shape(); s.moveTo(-w + r, -h); s.lineTo(w - r, -h); s.absarc(w - r, -h + r, r, -Math.PI / 2, 0, false); s.lineTo(w, h - r); s.absarc(w - r, h - r, r, 0, Math.PI / 2, false);
  s.lineTo(-w + r, h); s.absarc(-w + r, h - r, r, Math.PI / 2, Math.PI, false); s.lineTo(-w, -h + r); s.absarc(-w + r, -h + r, r, Math.PI, Math.PI * 1.5, false);
  if (hole) { const p = new THREE.Path(); if (hole.w) p.setFromPoints(rrShape(hole.w, hole.h, hole.r).getPoints(12).reverse()); else p.absarc(0, 0, hole.R, 0, Math.PI * 2, true); s.holes.push(p); }
  return s;
}
const extr = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });

function gearShape(R, n, tooth, spokes = 5) {
  const s = new THREE.Shape(), da = Math.PI * 2 / n;
  for (let i = 0; i < n; i++) {
    const a = i * da, p = (r, f) => [r * Math.cos(a + da * f), r * Math.sin(a + da * f)];
    const pts = [p(R - tooth, 0), p(R, 0.18), p(R, 0.42), p(R - tooth, 0.6)];
    pts.forEach((q, j) => (i === 0 && j === 0 ? s.moveTo(q[0], q[1]) : s.lineTo(q[0], q[1])));
  }
  s.closePath();
  if (spokes && R > 1.9) {
    const r0 = Math.max(0.55, R * 0.2), r1 = R - tooth - R * 0.16, gap = 0.2;
    for (let k = 0; k < spokes; k++) {
      const a0 = k * Math.PI * 2 / spokes + gap, a1 = (k + 1) * Math.PI * 2 / spokes - gap, h = new THREE.Path();
      h.absarc(0, 0, r1, a0, a1, false); h.absarc(0, 0, r0, a1 - gap * 0.6, a0 + gap * 0.6, true); h.closePath(); s.holes.push(h);
    }
  }
  return s;
}
function escapeShape(R, n = 15) {
  const s = new THREE.Shape(), da = Math.PI * 2 / n;
  for (let i = 0; i < n; i++) { const a = i * da, q = (r, f) => [r * Math.cos(a + da * f), r * Math.sin(a + da * f)]; const pts = [q(R * 0.62, 0), q(R, 0.3), q(R * 0.66, 0.45)]; pts.forEach((p, j) => (i === 0 && j === 0 ? s.moveTo(p[0], p[1]) : s.lineTo(p[0], p[1]))); }
  s.closePath(); return s;
}
// Convex outline around a set of circles: used for simplified bridges and levers.
function hullShape(circles) {
  const pts = [];
  circles.forEach(([x, y, r]) => { for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10; pts.push([x + r * Math.cos(a), y + r * Math.sin(a)]); } });
  pts.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
  for (const p of pts) { while (lo.length > 1 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  for (const p of pts.slice().reverse()) { while (up.length > 1 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  const h = lo.slice(0, -1).concat(up.slice(0, -1)), s = new THREE.Shape();
  h.forEach((p, i) => (i ? s.lineTo(p[0], p[1]) : s.moveTo(p[0], p[1]))); s.closePath(); return s;
}

export function buildProcedural(watch, face, tex) {
  const P = watch.asset.params, R = face.R, ri = P.bezel === 'octagon' ? face.dialR : face.bezelInner, // an octagonal bezel frames the round dial opening
     sub = (P.chrono === false && !P.subSeconds) ? 8 : face.inR * (P.subOffset || 0.5);
  const CASE = P.metal === 'gold' ? 'gold' : 'steel', inner = R - (P.wall || 3.25), HAND = P.handKind || (P.metal === 'gold' ? 'gold' : 'white');
  const chrono = P.chrono !== false, mvR = (P.movementDiameter || 27) / 2, tank = P.caseShape === 'tank', square = P.caseShape === 'square' || tank, dh = P.dialHalf || 15.4; /* 'square' covers any flat-sided case; a tank is a rectangle between two side bars */
  const BW = tank ? (P.brancard || 2.7) : 0, CW = tank ? R - BW : R, CH = tank ? P.bodyHalfH : R, DW = tank ? P.dialHalfW : dh, DH = tank ? P.dialHalfH : dh, CR = tank ? 0.7 : 3.2, DR = tank ? 0.4 : 2.4;
  const root = new THREE.Group(), parts = {}, asm = [], layers = [];
  const part = (id, parent = root) => { const g = new THREE.Group(); g.userData.part = id; parent.add(g); parts[id] = g; return g; };
  const assembly = (g, ez, ex = 0, ey = 0) => asm.push({ g, ez, ex, ey, home: g.position.clone() });
  const layer = (o, dz) => layers.push({ o, dz, z0: o.position.z });

  /* ----- case, crown, pushers, strap ----- */
  const kase = part('case');
  const BAND = P.bezel === 'octagon' ? 'steelDark' : CASE; // a darker band lets the eight-sided bezel read against the round case beneath it
  /* A Tank's movement can be wider than the body seen between the bars: the real case is a hollow box and the movement reaches under the brancards.
     When that is so, the body below the dial is only its two ends and a thin wall each side, and the bars are solid only at their ends. */
  const wideMv = tank && mvR + 0.3 > CW - 0.6, cavR = mvR + 0.3, cavY = wideMv ? Math.sqrt(cavR * cavR - CW * CW) : 0;
  if (wideMv) {
    kase.add(at(mk(new THREE.ExtrudeGeometry(rrShape(CW, CH, CR, { R: inner }), { depth: 0.5, bevelEnabled: false, curveSegments: 16 }), CASE), 0, 0, 2.0)); // the plate lies just under the dial, so the wide cavity runs up to there
    const t0 = Math.atan2(cavY, CW);
    for (const sy of [-1, 1]) { const cs = new THREE.Shape(); cs.moveTo(-CW, sy * CH); cs.lineTo(CW, sy * CH); cs.lineTo(CW, sy * cavY); cs.absarc(0, 0, cavR, sy * t0, sy * (Math.PI - t0), sy < 0); cs.closePath(); kase.add(at(mk(extr(cs, 6.6), CASE), 0, 0, -4.6)); }
    for (const sx of [-1, 1]) kase.add(at(mk(new THREE.BoxGeometry(0.55, 2 * cavY + 1, 6.5), CASE), sx * (R - 0.275), 0, -1.25));
  } else if (square) kase.add(at(mk(new THREE.ExtrudeGeometry(rrShape(CW, CH, CR, { R: inner }), { depth: 7.1, bevelEnabled: false, curveSegments: 16 }), CASE), 0, 0, -4.6));
  else kase.add(mk(lathe([[inner, -4.6], [R - 1.45, -4.6], [R, -3.3], [R, 1.7], [R - 0.7, 2.5], [inner, 2.5], [inner, -4.6]]), BAND));
  const lugL = Math.max(5, P.lugToLug / 2 - R + 5.5), lugT = P.lugThick || 2.7;
  if (tank && wideMv) { const L = P.lugToLug / 2, bl = L - cavY - 0.2; for (const sx of [-1, 1]) { kase.add(at(mk(extr(rrShape(BW / 2, L, 1.1), 1.7), CASE), sx * (R - BW / 2), 0, 2.0)); for (const sy of [-1, 1]) kase.add(at(mk(new THREE.BoxGeometry(BW, bl, 6.5), CASE), sx * (R - BW / 2), sy * (cavY + 0.2 + bl / 2), -1.25)); } }
  else if (tank) { for (const sx of [-1, 1]) kase.add(at(mk(extr(rrShape(BW / 2, P.lugToLug / 2, 1.1), 8.2), CASE), sx * (R - BW / 2), 0, -4.5)); } // two side bars run the full length and carry the strap between their ends
  else if (P.integrated) { for (const sy of [-1, 1]) { const sh = mk(new THREE.BoxGeometry(P.lugWidth + 1.5, 7, 3.6), 'steelDark'); sh.position.set(0, sy * (R - 1.2), -1.6); sh.rotation.x = -sy * 0.2; kase.add(sh); } } // no separate lugs: the case runs straight into the bracelet
  else for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const lug = mk(new THREE.BoxGeometry(lugT, lugL, 3.4), CASE); lug.position.set(sx * (P.lugWidth / 2 + lugT / 2), sy * (P.lugToLug / 2 - lugL / 2 + 0.55), -2.0); lug.rotation.x = -sy * 0.28; kase.add(lug); }
  if (P.crownGuards) for (const sy of [-1, 1]) { const gd = mk(new THREE.BoxGeometry(3.2, 2.4, 3.4), CASE); gd.position.set(R + 0.7, sy * 3.9, -0.9); gd.rotation.z = -sy * 0.5; kase.add(gd); }
  const crown = part('crown');
  const cR = P.crownR || 2.9, cL = cR > 2.4 ? 3 : 2;
  const backCrown = P.crown === 'back'; // an Accutron 214 has no crown on the flank: it is set from the back
  if (!backCrown) crown.add(at(mk(new THREE.CylinderGeometry(cR, cR, cL, P.crownHex ? 6 : 28).rotateZ(Math.PI / 2), CASE, { edgeAngle: 10 }), R + 0.6 + cL / 2, 0, -0.9), at(mk(new THREE.CylinderGeometry(1.1, 1.1, 1.2, 16).rotateZ(Math.PI / 2), CASE), R + 0.3, 0, -0.9));
  if (P.cabochon && !backCrown) crown.add(at(mk(new THREE.SphereGeometry(cR * 0.62, 16, 12), 'blue', { noEdges: true }), R + 0.6 + cL, 0, -0.9));
  if (P.crownLeft) crown.rotation.z = Math.PI; // the Calibre 11 watches carry the crown at nine
  const push = chrono ? part('pushers') : null;
  if (push) for (const a of [-1, 1]) { const g = new THREE.Group(); if (square) g.position.y = a * 7; else g.rotation.z = a * Math.PI / 6; /* on a square case the pushers stand straight out of the flank */ g.add(at(mk(new THREE.CylinderGeometry(1.9, 1.9, 2, 22).rotateZ(Math.PI / 2), 'steel'), R + 2.2, 0, -0.9), at(mk(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 16).rotateZ(Math.PI / 2), 'steel'), R + 0.6, 0, -0.9)); if (P.screwPushers) g.add(at(mk(new THREE.CylinderGeometry(2.3, 2.3, 1.3, 20).rotateZ(Math.PI / 2), 'steelDark', { edgeAngle: 12 }), R + 0.95, 0, -0.9)); /* a knurled collar that screws down over each pusher */ push.add(g); }
  const strap = part('strap');
  for (const sy of [-1, 1]) { const s = mk(new THREE.BoxGeometry(P.lugWidth - 0.4, 13, 2.2), P.integrated || P.bracelet ? 'steelDark' : 'leather'); if (P.bracelet) s.userData.real.roughness = 0.62; s.position.set(0, sy * (P.lugToLug / 2 + 2.6), P.integrated ? -3.2 : -4.3); s.rotation.x = -sy * (P.integrated ? 0.3 : 0.5); if (P.integrated) s.userData.real.roughness = 0.62; strap.add(s); }
  assembly(kase, -15); if (!backCrown) assembly(crown, -15, P.crownLeft ? -9 : 9); if (push) assembly(push, -15, 5); assembly(strap, -15);

  /* ----- bezel, crystal, dial, hands ----- */
  const bezel = part('bezel');
  if (square) bezel.add(at(mk(new THREE.ExtrudeGeometry(rrShape(CW - (tank ? 0 : 0.4), CH - (tank ? 0 : 0.4), CR, { w: DW, h: DH, r: DR }), { depth: 1.4, bevelEnabled: false, curveSegments: 12 }), CASE), 0, 0, 2.5)); // no separate bezel: a flat frame around a square opening
  else if (P.bezel === 'octagon') { // eight flat sides, a round opening, and a hexagonal bolt at each corner
    const o = new THREE.Shape(), hole = new THREE.Path(), A = k => (22.5 + 45 * k) * Math.PI / 180;
    for (let k = 0; k < 8; k++) (k ? o.lineTo(R * Math.cos(A(k)), R * Math.sin(A(k))) : o.moveTo(R * Math.cos(A(k)), R * Math.sin(A(k)))); o.closePath();
    hole.absarc(0, 0, ri, 0, Math.PI * 2, true); o.holes.push(hole);
    bezel.add(at(mk(new THREE.ExtrudeGeometry(o, { depth: 1.45, bevelEnabled: false, curveSegments: 48 }), CASE), 0, 0, 2.5));
    const br = ri + (R - ri) * 0.56;
    for (let k = 0; k < 8; k++) bezel.add(at(mk(new THREE.CylinderGeometry(1.05, 1.05, 0.4, 6).rotateX(Math.PI / 2), 'white', { edgeAngle: 20 }), br * Math.cos(A(k)), br * Math.sin(A(k)), 4.05), (sl => { sl.rotation.z = A(k) + Math.PI / 2; return sl; })(at(mk(new THREE.BoxGeometry(1.5, 0.2, 0.1), 'iron', { noEdges: true }), br * Math.cos(A(k)), br * Math.sin(A(k)), 4.3)));
  } else
  bezel.add(mk(lathe([[ri, 2.5], [R, 2.5], [R - 0.3, 3.9], [ri, 3.95], [ri, 2.5]]), CASE));
  if (P.bezelInsert !== false) bezel.add(at(mk(new THREE.RingGeometry(ri + 0.05, R - 0.45, 128), 'face', { noEdges: true, real: { map: tex.real }, tech: { map: tex.tech } }), 0, 0, 3.97));
  assembly(bezel, 21);
  const crystal = part('crystal'), dome = [];
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; dome.push([ri * Math.cos(a), 3.95 + (P.dome || 3.3) * Math.sin(a)]); }
  if (square) crystal.add(at(mk(extr(rrShape(DW + 0.25, DH + 0.25, DR), tank ? 0.9 : 1.5), 'acrylic', { edgeAngle: 80 }), 0, 0, 3.7)); else crystal.add(mk(lathe(dome), 'acrylic', { edgeAngle: 80 }));
  assembly(crystal, 29);
  const openDial = P.dial === 'open', dial = part('dial'), dg = square ? new THREE.ShapeGeometry(rrShape(DW, DH, DR), 12) : openDial ? new THREE.RingGeometry(ri - 2.7, ri, 128) : new THREE.CircleGeometry(ri, 128), uv = dg.attributes.uv; // an open dial is only its chapter ring
  if (square) { const ps = dg.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + ps.getX(i) / (2 * R), 0.5 + ps.getY(i) / (2 * R)); }
  else for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * ri / R, 0.5 + (uv.getY(i) - 0.5) * ri / R);
  dial.add(at(mk(dg, 'face', { noEdges: true, real: { map: tex.real }, tech: { map: tex.tech } }), 0, 0, square ? 2.58 : 2.32)); /* a square dial is wider than the round opening in the case, so it sits just above the case top */ if (!square && !openDial) dial.add(at(mk(cyl(ri, 0.3, 64), 'brass'), 0, 0, 2.15));
  assembly(dial, 8);
  const hands = part('hands'), Lm = face.handLen, Lh = Lm * 0.64;
  const kite = (w, L) => { const k = new THREE.Shape(); k.moveTo(0, -1.3); k.lineTo(w / 2, L * 0.14); k.lineTo(0, L - 1.3); k.lineTo(-w / 2, L * 0.14); k.closePath(); return extr(k, 0.14).translate(0, 0, -0.07); };
  const hand = (w, L, z, kind = HAND) => { const p = new THREE.Group(); let g; if (P.hands === 'dauphine' && w > 0.5) g = kite(w * 1.25, L); else { g = new THREE.BoxGeometry(w, L, 0.14); g.translate(0, L / 2 - 1.3, 0); } p.add(mk(g, kind)); p.position.z = z; hands.add(p); return p; };
  const hHour = hand(1.5, Lh, 2.7), hMin = hand(1.15, Lm, 2.95), hChr = hand(0.28, Lm * 1.05, 3.2, P.chronoHand || HAND);
  if (P.hands === 'mercedes') { hHour.add(at(mk(cyl(1.75, 0.14, 28), 'white'), 0, Lh * 0.62, 0)); for (let k = 0; k < 3; k++) { const sp = mk(new THREE.BoxGeometry(0.2, 1.75, 0.05), 'ink', { noEdges: true }); const a = k * Math.PI * 2 / 3; sp.position.set(-Math.sin(a) * 0.875, Lh * 0.62 + Math.cos(a) * 0.875, 0.1); sp.rotation.z = a; hHour.add(sp); } hChr.add(at(mk(cyl(0.8, 0.1, 18), 'white'), 0, Lm * 0.62, 0)); }
  hands.add(at(mk(cyl(0.95, 0.9, 20), CASE), 0, 0, 3.0));
  const subHand = (x, y) => { const p = hand(0.26, 4.2, square ? 2.66 : 2.5, P.subHandKind || HAND); p.position.x = x; p.position.y = y; p.children[0].geometry.translate(0, -0.5, 0); return p; };
  const two = P.registers === 2; // two registers and no running seconds, as on the Calibre 11
  const hSec = chrono ? (two ? new THREE.Group() : subHand(-sub, 0)) : P.subSeconds === 6 ? subHand(0, -sub) : hChr; if (chrono) { subHand(sub, 0); if (two) subHand(-sub, 0); else subHand(0, -sub); }
  if (P.subSeconds || P.noSeconds) hChr.visible = false;
  assembly(hands, 13);

  /* ----- spacer ring, dust cover, caseback ----- */
  if (P.spacer !== false && !wideMv) { const spacer = part('spacer'); spacer.add(mk(lathe([[mvR + 0.05, -3.6], [inner - 0.1, -3.6], [inner - 0.1, 2.0], [mvR + 0.05, 2.0], [mvR + 0.05, -3.6]]), 'steelDark')); assembly(spacer, -7); }
  const dust = P.dustCover === false ? null : part('dustcover'); if (dust) { dust.add(at(mk(cyl(inner - 0.3, 0.25, 64), 'iron'), 0, 0, -4.3)); assembly(dust, -24); }
  const back = part('caseback'); if (tank) back.add(at(mk(extr(rrShape(wideMv ? R - 0.05 : CW, CH, CR), 1.2), CASE), 0, 0, -5.8)); else back.add(mk(lathe([[0, -6.4], [R - 6.85, -6.4], [R - 2.25, -5.4], [R - 1.45, -4.6], [0, -4.6]]), CASE)); assembly(back, -31);

  /* ----- tuning-fork movement (Bulova Accutron 214) -----
     The works of a 214 face the dial, which is why a Spaceview can do without one. So this movement is not
     turned over like the others: local +Z points out of the front, and "opening" the watch lifts the
     crystal, chapter ring and hands away, and drops the back as well.
     Which side each thing is on, the three openings in the plate and the place of the index wheel follow the plan drawings in Bulova's
     "Accutron Service Manual, Series 214", scaled to 29 mm: the coils show from both sides at twelve, the fork and the electronics face the dial,
     and the index wheel, its two jewels, the gear train and the power cell are on the back. The manual gives the index wheel as 2.40 mm across
     with 300 teeth. Positions are read off small drawings, to about 0.7 mm; the shape of the fork, the two-stage train and all heights are simplified. */
  if (P.oscillator === 'fork') {
    const mv = new THREE.Group(); mv.position.z = -0.4; root.add(mv); assembly(mv, 0);
    /* the pillar plate: a ring and a central island, with a long opening for the two coils at twelve and a round opening each side, one for the power cell and one for the electronics */
    const CELL = [-7.8, -1.6], ELEC = [8.5, -2.0], plateS = new THREE.Shape(); plateS.absarc(0, 0, mvR, 0, Math.PI * 2, false);
    const slot = new THREE.Path(); slot.absarc(5.0, 7.8, 3.35, -Math.PI / 2, Math.PI / 2, false); slot.absarc(-5.4, 7.8, 3.35, Math.PI / 2, Math.PI * 1.5, false); slot.closePath(); plateS.holes.push(slot);
    for (const [c, r] of [[CELL, 5.5], [ELEC, 4.6]]) { const h = new THREE.Path(); h.absarc(c[0], c[1], r, 0, Math.PI * 2, true); plateS.holes.push(h); }
    part('plate', mv).add(at(mk(extr(plateS, 1), 'steel', { real: { color: 0x7f7f7c, roughness: 0.72 }, edgeAngle: 40 }), 0, 0, -1));
    // the fork: a U with its foot at six o'clock and a cup magnet on the tip of each tine
    const TX = 4.7, fork = part('fork', mv), tines = [];
    fork.add(at(mk(new THREE.BoxGeometry(2 * TX + 1.1, 2.2, 0.9), 'steelDark'), 0, -8.4, 0.75), at(mk(cyl(0.7, 1.3, 16), 'steel'), 0, -8.4, 0.9));
    for (const sx of [-1, 1]) {
      const t = new THREE.Group(); t.position.set(sx * TX, -7.4, 0);
      t.add(at(mk(new THREE.BoxGeometry(1.1, 14.6, 0.9), 'steelDark'), 0, 7.3, 0.75), at(mk(new THREE.CylinderGeometry(1.25, 1.25, 2.5, 28).rotateZ(Math.PI / 2), 'steelDark', { edgeAngle: 20 }), sx * 0.9, 15.4, 1.3));
      fork.add(t); tines.push(t);
    }
    fork.userData.anchor = [-TX, -3, 1.4];
    // one fixed drive coil reaches into each magnet cup; the circuit that switches them sits between
    const coils = part('coils', mv);
    for (const sx of [-1, 1]) coils.add(at(mk(new THREE.CylinderGeometry(0.85, 0.85, 3.0, 24).rotateZ(Math.PI / 2), 'coil', { edgeAngle: 20 }), sx * (TX + 2.9), 8.0, 1.3), at(mk(new THREE.BoxGeometry(1.2, 1.6, 0.5), 'steel'), sx * (TX + 4.0), 8.0, 0.25));
    coils.userData.anchor = [TX + 2.9, 8, 2.2];
    const circuit = part('circuit', mv);
    circuit.add(at(mk(new THREE.BoxGeometry(2.6, 5.0, 0.3), 'coil'), ELEC[0] + 1.6, ELEC[1], -0.35), at(mk(cyl(0.8, 1.1, 18), 'steelDark'), ELEC[0] + 1.6, ELEC[1] + 1.3, 0.35), at(mk(new THREE.BoxGeometry(0.7, 1.5, 0.7), 'copper'), ELEC[0] + 1.9, ELEC[1] - 0.9, 0.15), at(mk(cyl(0.42, 0.8, 12), 'brass'), ELEC[0] + 1.0, ELEC[1] - 1.1, 0.2));
    circuit.userData.anchor = [ELEC[0] + 1.6, ELEC[1], 1.0];
    // index wheel and the short train to the seconds hand: on the back of the movement, so everything here sits below the plate (negative z)
    const spins = {}, IX = 5.4, IY = 3.3, TRX = 2.4, TRY = 2.19;
    const mobile = (id, x, y, o) => {
      const g = at(part(id, mv), x, y, 0), sp = new THREE.Group(); g.add(sp);
      sp.add(at(mk(extr(gearShape(o.R, o.n, o.tooth || 0.2, o.spokes), 0.2), o.kind || 'brass', { edgeAngle: 40 }), 0, 0, o.z));
      if (o.pin) sp.add(at(mk(cyl(o.pin, 0.45, 12), 'steelDark'), 0, 0, o.pinZ));
      sp.add(at(mk(cyl(0.16, 1.9, 10), 'steelDark', { noEdges: true }), 0, 0, -1.95));
      g.userData.anchor = [0, 0, -3.1]; return sp;
    };
    spins.index = mobile('index-wheel', IX, IY, { R: 1.2, n: 300, tooth: 0.035, spokes: 0, z: -2.7, kind: 'steel', pin: 0.3, pinZ: -1.9 });
    spins.inter = mobile('train', TRX, TRY, { R: 2.9, n: 72, z: -2.0, pin: 0.35, pinZ: -1.4, spokes: 4 });
    spins.sec = mobile('seconds-wheel', 0, 0, { R: 2.9, n: 72, z: -1.5, spokes: 4 });
    // the index jewel is carried by a finger from the tine beside the wheel and pushes it; the pawl jewel is fixed and stops it running back
    const ij = part('index-jewel', tines[1]), jx = IX - 1.2 - 0.11 - TX, jy = IY + 7.4;
    ij.add(at(mk(new THREE.BoxGeometry(0.22, 2.7, 0.22), 'steel'), jx, jy + 1.35, -2.6), at(mk(new THREE.BoxGeometry(0.34, 0.34, 0.34), 'ruby'), jx + 0.11, jy, -2.6), at(mk(cyl(0.2, 3.6, 10), 'steel'), jx, jy + 2.7, -0.95));
    ij.userData.anchor = [jx, jy, -3.0];
    const pawl = part('pawl', mv), px = IX + 1.2 + 0.11;
    pawl.add(at(mk(new THREE.BoxGeometry(0.22, 0.9, 0.22), 'steel'), px, IY + 0.45, -2.6), at(mk(new THREE.BoxGeometry(0.34, 0.34, 0.34), 'ruby'), px - 0.11, IY, -2.6), at(mk(cyl(0.35, 1.7, 12), 'steel'), px, IY + 0.9, -1.85));
    pawl.userData.anchor = [px, IY + 0.45, -3.0];
    const bridge = part('train-bridge', mv);
    bridge.add(at(mk(extr(hullShape([[TRX, TRY, 0.9], [0, 0, 0.9], [1.6, -3.2, 1.0]]), 0.35), 'steel', { edgeAngle: 40 }), 0, 0, -3.5), at(mk(cyl(0.34, 0.14, 14), 'ruby'), TRX, TRY, -3.52), at(mk(cyl(0.45, 2.5, 12), 'steel', { noEdges: true }), 1.6, -3.2, -2.25));
    bridge.userData.anchor = [1.0, -1.6, -3.7]; layer(bridge, -5);
    // the cell sits behind the plate, under a hatch in the back; the setting handle is on the back too
    const cell = part('battery', mv); cell.add(at(mk(cyl(4.4, 2.6, 40), 'steel'), CELL[0], CELL[1], -2.4), at(mk(cyl(3.6, 0.2, 32), 'brass'), CELL[0], CELL[1], -3.8));
    cell.userData.anchor = [CELL[0], CELL[1], -3.9]; assembly(cell, -8);
    const hatch = part('hatch', back); hatch.add(at(mk(cyl(4.8, 0.3, 40), CASE), CELL[0], CELL[1], -6.5), at(mk(new THREE.BoxGeometry(5, 0.5, 0.2), 'steelDark'), CELL[0], CELL[1], -6.7));
    back.add(crown); crown.add(at(mk(cyl(2.4, 0.5, 28), CASE), 0, 6.0, -6.6), at(mk(new THREE.TorusGeometry(1.7, 0.22, 8, 24, Math.PI), CASE), 0, 6.0, -6.95));

    const TAU = Math.PI * 2;
    function animate(tv, now) {
      const v = Math.sin(tv * TAU * 360) * 0.006; tines[0].rotation.z = v; tines[1].rotation.z = -v; // 360 Hz is far faster than a screen refreshes, so it shows only as a shimmer
      const idx = tv * 1.2 * TAU; spins.index.rotation.z = -idx; spins.inter.rotation.z = idx / 8.5; spins.sec.rotation.z = -tv * TAU / 60; // 360 teeth a second on a 300-tooth wheel is 1.2 turns a second; the train ratios are illustrative
      hSec.rotation.z = -tv * TAU / 60; // no beat: the seconds hand glides
      const s = now.getSeconds() + now.getMilliseconds() / 1000, m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
      hMin.rotation.z = -m * TAU / 60; hHour.rotation.z = -h * TAU / 12;
    }
    const setExplode = v => asm.forEach(a => a.g.position.set(a.home.x + a.ex * v, a.home.y + a.ey * v, a.home.z + a.ez * v));
    function setOpen(v) { // lift the crystal and bezel, then the chapter ring and hands, and set them aside; the back drops away too, since the index wheel and the train are on that side
      const u = Math.min(1, v * 2), s = Math.max(0, v * 2 - 1);
      back.position.z -= 6 * u; back.position.y -= 46 * s;
      for (const g of [bezel, crystal]) { g.position.z += 5 * u; g.position.x += -46 * s; }
      for (const g of [dial, hands]) { g.position.z += 3 * u; g.position.x += 46 * s; }
    }
    const setLayers = v => layers.forEach(l => { l.o.position.z = l.z0 + l.dz * v; });
    root.scale.z = (P.thickness || 14) / 14;
    return finish({ root, parts, animate, setExplode, setOpen, setLayers, frontMovement: true, fit: { h: P.lugToLug / 2 + 10, w: R + 7, d: 62 } });
  }

  /* ----- movement: local +Z points out of the back of the watch ----- */
  const MK = mvR < 13 ? mvR / 13.5 : 1; /* the layout below is drawn for a movement about 27 mm across; a smaller one is the same layout, scaled */
  const mv = new THREE.Group(); mv.position.z = 0.2; mv.rotation.y = Math.PI; mv.scale.set(MK, MK, 1); if (P.subSeconds === 6) mv.rotation.z = -Math.PI / 2; /* puts the fourth wheel under the six o'clock register */ root.add(mv); assembly(mv, 0);
  part('plate', mv).add(at(mk(cyl(mvR / MK, 1.78, 72), P.plate || 'copper', { real: { color: P.plate === 'steel' ? 0x7f7f7c : 0x9a6649, roughness: 0.72 } }), 0, 0, -0.89)); /* matte and darker than the bridges, so they read against it */
  const spins = {};
  const mobile = (id, x, y, o, parent) => {
    const g = parent || at(part(id, mv), x, y, 0), sp = new THREE.Group(); if (parent) sp.position.set(x, y, 0); g.add(sp);
    sp.add(at(mk(extr(o.shape || gearShape(o.R, o.n, o.tooth || 0.22, o.spokes), o.th || 0.22), o.kind || 'brass', { edgeAngle: 40 }), 0, 0, o.z));
    if (o.pin) sp.add(at(mk(cyl(o.pin, 0.5, 14), 'steelDark'), 0, 0, o.pinZ + 0.11));
    sp.add(at(mk(cyl(0.2, o.arbor || 2.4, 10), 'steelDark', { noEdges: true }), 0, 0, (o.arbor || 2.4) / 2));
    return sp;
  };
  const M = {}; // what the animation needs from whichever layout is built
  const flat = (id, circles, z, th, kind = P.plate || 'copper') => { const g = part(id, mv), cx = circles[0][0], cy = circles[0][1]; g.position.set(cx, cy, 0); const m = at(mk(extr(hullShape(circles.map(c => [c[0] - cx, c[1] - cy, c[2]])), th), kind, { edgeAngle: 40 }), 0, 0, z); g.add(m); return g; };
  const jw = part('jewels', mv), jewel = (x, y, z, host) => { const j = at(mk(cyl(0.36, 0.16, 16), 'ruby'), x, y, z); jw.add(j); layer(j, host); return j; };
  const multi = (id, hulls, z, th, kind) => { const g = part(id, mv), cx = hulls[0][0][0], cy = hulls[0][0][1]; g.position.set(cx, cy, 0); for (const h of hulls) g.add(at(mk(extr(hullShape(h.map(c => [c[0] - cx, c[1] - cy, c[2]])), th), kind, { edgeAngle: 40 }), 0, 0, z)); return g; };
  if (P.calibre === '321') {
    /* Omega calibre 321. Positions of the barrel, the wheels, the pallets, the balance and the chronograph wheels are measured off Omega's spare-parts sheet
       GF 620-4 (1958): its 1:1 photograph of the plate and its photograph of the assembled movement, to about 0.3 mm. Seen from the back, the crown is towards -x.
       Heights, tooth counts, pinion sizes and the outlines of the bridges and levers are estimated, and several levers and all springs are left out. */
    const bX = -3.3, bY = -6.7, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.5, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.85, 72, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 3.9; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.25, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    /* going train: each wheel sits at its measured centre; wheel radius + next pinion radius = the measured distance between them */
    spins.centre = mobile('centre', 0, 0, { R: 3.95, n: 64, z: 1.4, pin: 1.6, pinZ: 0.45 });
    spins.third = mobile('third', 3.95, -2.05, { R: 3.15, n: 60, z: 1.85, pin: 0.5, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 6.95, 0, { R: 2.92, n: 52, z: 1.35, pin: 0.48, pinZ: 1.85, arbor: 3.35 });
    const eX = 6.9, eY = 3.3;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.75, P.escapeTeeth || 15), z: 0.8, pin: 0.38, pinZ: 1.35, kind: 'steelDark', arbor: 2.0 });
    const BX = 2.1, BY = 7.6, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(4.9, 0.26, 10, 72), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(9.4, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 9.4, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 4.6, pmy = 5.3, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.4, 0.2), 'steelDark'), 0, 0.3, 1.1), at(mk(new THREE.BoxGeometry(1.9, 0.4, 0.2), 'steelDark'), 0, -1.7, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.85, -1.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.85, -1.9, 1.1));

    /* bridges. The three-quarter plate covers the barrel and the train and is cut away round the balance and the escape wheel, as on the sheet's photograph of part 321.1002 */
    const RQ = 13.2, cutR = f => { const dx = eX - BX, dy = eY - BY, bq = dx * Math.cos(f) + dy * Math.sin(f), dq = bq * bq - (dx * dx + dy * dy - 2.5 * 2.5); return Math.max(6.5, dq > 0 ? bq + Math.sqrt(dq) : 0); }; /* the opening round the balance, with a bay for the escape wheel */
    const inCut = (x, y) => Math.hypot(x - BX, y - BY) < cutR(Math.atan2(y - BY, x - BX)), tc = Math.atan2(BY, BX), tqP = [];
    for (let k = 0; k < 360; k++) { const a = tc + k / 360 * Math.PI * 2, x = RQ * Math.cos(a), y = RQ * Math.sin(a); if (!inCut(x, y)) tqP.push([x, y]); } // round the rim, anticlockwise, from one side of the opening to the other
    for (let k = 0; k < 360; k++) { const f = tc - k / 360 * Math.PI * 2, r = cutR(f), x = BX + r * Math.cos(f), y = BY + r * Math.sin(f); if (Math.hypot(x, y) < RQ) tqP.push([x, y]); } // then back along the edge of the opening
    const tqS = new THREE.Shape(); tqP.forEach((q, k) => (k ? tqS.lineTo(q[0], q[1]) : tqS.moveTo(q[0], q[1]))); tqS.closePath();
    const tq = part('train-bridge', mv); tq.add(at(mk(extr(tqS, 0.45), P.plate || 'copper', { edgeAngle: 40 }), 0, 0, 2.35)); layer(tq, 4); tq.userData.anchor = [-7, -1, 2.9];
    layer(flat('escape-bridge', [[eX, eY, 1.0], [9.6, 4.6, 0.9]], 1.95, 0.3), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [6.6, 6.6, 0.7]], 1.45, 0.3), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [-4.25, 11.0, 1.5]], 3.3, 0.45), 4);
    jewel(3.95, -2.05, 2.86, 4); jewel(eX, eY, 2.3, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);

    /* chronograph works, on top of the three-quarter plate */
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.1, n: 150, tooth: 0.1, z: 3.0, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.5 }, run);
    runSpin.add(at(mk(cyl(0.6, 0.25, 3), 'steelDark'), 0, 0, 3.32)); layer(run, 8);
    /* the driving wheel rides on the fourth wheel's long pivot and always turns the coupling wheel; the coupling wheel stands just clear of the runner, as it does with the chronograph stopped */
    const cp = at(part('coupling', mv), 3.9, -4.0, 0);
    spins.drive = mobile(null, 6.95 - 3.9, 4.0, { R: 2.9, n: 108, tooth: 0.1, z: 3.0, th: 0.18, spokes: 5, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 2.15, n: 80, tooth: 0.1, z: 3.0, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    cp.add(at(mk(extr(hullShape([[0, 0, 0.75], [5.2, -2.8, 0.6]]), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 3.3)); layer(cp, 8);
    const mr = part('minute-recorder', mv), mrSpin = mobile(null, -7.1, 0, { R: 1.9, n: 40, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, mr);
    mrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 1.0, 10), 'steelDark', { noEdges: true }), 0, 0, 3.0)); layer(mr, 8); mr.userData.anchor = [-7.1, 0, 3.3];
    const sg = at(part('sliding-gear', mv), -5.0, -2.0, 0); sg.add(at(mk(extr(gearShape(0.9, 20, 0.16, 0), 0.18), 'brass', { edgeAngle: 40 }), 0, 0, 3.0), at(mk(cyl(0.5, 0.1, 14), 'steel'), 0, 0, 3.23)); layer(sg, 8); sg.userData.anchor = [0, 0, 3.3];
    const cw = at(part('column-wheel', mv), -1.05, -8.85, 0); cw.add(at(mk(extr(gearShape(2.0, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.95));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, pl = mk(new THREE.BoxGeometry(0.5, 0.42, 0.7), 'steelDark'); pl.position.set(1.25 * Math.cos(a), 1.25 * Math.sin(a), 3.55); pl.rotation.z = a; cw.add(pl); }
    layer(cw, 8);
    layer(multi('hammer', [[[-4.6, -10.4, 0.7], [-0.6, -1.3, 0.45]], [[-4.6, -10.4, 0.7], [-6.4, -1.4, 0.45]]], 3.3, 0.2, 'steel'), 8);
    layer(flat('operating-lever', [[-11.2, -5.0, 0.6], [-6.6, -10.0, 0.5]], 3.3, 0.2, 'steel'), 8);
    const cb = multi('chrono-bridge', [[[0, 0, 1.15], [-7.1, 0, 1.05]], [[-3.5, 0, 1.0], [-4.6, 5.4, 1.0]], [[-3.5, 0, 1.0], [-4.0, -5.6, 1.0]]], 3.55, 0.4, P.plate || 'copper');
    cb.add(at(mk(cyl(0.5, 0.75, 14), 'steelDark', { noEdges: true }), -4.6, 5.4, 3.175), at(mk(cyl(0.5, 0.75, 14), 'steelDark', { noEdges: true }), -4.0, -5.6, 3.175)); layer(cb, 12); cb.userData.anchor = [-3.5, 0, 4];
    jewel(0, 0, 4.0, 12); jewel(-7.1, 0, 4.0, 12);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 2.9 / 2.15 });
  } else if (P.calibre === '3019') {
    /* Zenith calibre 3019 PHC (El Primero). Positions of the barrel, the centre, third and fourth wheels, the balance, the column wheel and the chronograph wheels are measured off the
       stage-by-stage assembly photographs in Zenith's booklet "3019 PHC, Informations techniques No 16", to about 0.4 mm. Seen from the back, the crown is towards -x.
       The escape wheel and pallets could not be read from the photographs and are placed between the fourth wheel and the balance. Heights, tooth counts, sizes and every outline are estimated.
       The automatic winding gears, the date ring and the hour counter are left out. */
    const bX = -3.0, bY = -7.3, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(6.2, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(6.6, 80, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 4.6; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.9, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 3.5, n: 64, z: 1.4, pin: 1.3, pinZ: 0.45 });
    spins.third = mobile('third', 3.5, -2.1, { R: 3.3, n: 60, z: 1.85, pin: 0.58, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 6.85, 0, { R: 3.2, n: 56, z: 1.35, pin: 0.65, pinZ: 1.85, arbor: 3.35 });
    const eX = 8.6, eY = 3.3;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.6, P.escapeTeeth || 15), z: 0.8, pin: 0.54, pinZ: 1.35, kind: 'steelDark', arbor: 1.75 });
    const BX = 5.7, BY = 6.3, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(4.05, 0.26, 10, 64), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(7.7, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 7.7, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 8.3, pmy = 5.3, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 3.6, 0.2), 'steelDark'), 0, 0.2, 1.1), at(mk(new THREE.BoxGeometry(1.7, 0.4, 0.2), 'steelDark'), 0, -1.4, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.75, -1.6, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.75, -1.6, 1.1));
    /* bridges: placed over the measured pivots, with simplified outlines */
    layer(flat('barrel-bridge', [[bX, bY, 5.6]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[0, 0, 1.6], [3.5, -2.1, 1.5], [6.85, 0, 1.5]], 2.35, 0.45), 4);
    layer(flat('escape-bridge', [[eX, eY, 1.0], [11.2, 2.4, 0.9]], 1.72, 0.26), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [10.2, 5.0, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.3], [2.0, 13.0, 1.3]], 3.3, 0.45), 4);
    jewel(3.5, -2.1, 2.86, 4); jewel(6.85, 0, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    /* chronograph works */
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 2.8, n: 140, tooth: 0.1, z: 3.0, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.5 }, run);
    runSpin.add(at(mk(cyl(0.6, 0.25, 3), 'steelDark'), 0, 0, 3.32)); layer(run, 8);
    const cp = at(part('coupling', mv), 3.5, -4.4, 0);
    spins.drive = mobile(null, 6.85 - 3.5, 4.4, { R: 2.9, n: 108, tooth: 0.1, z: 3.0, th: 0.18, spokes: 5, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 2.63, n: 98, tooth: 0.1, z: 3.0, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    cp.add(at(mk(extr(hullShape([[0, 0, 0.75], [4.6, -5.6, 0.6]]), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 3.3)); layer(cp, 8);
    const mr = part('minute-recorder', mv), mrSpin = mobile(null, -6.8, 0, { R: 1.9, n: 40, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, mr);
    mrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 3.5, 10), 'steelDark', { noEdges: true }), 0, 0, 1.75)); layer(mr, 8); mr.userData.anchor = [-6.8, 0, 3.3];
    const cw = at(part('column-wheel', mv), -1.0, -8.5, 0); cw.add(at(mk(extr(gearShape(2.0, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.95));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, pl = mk(new THREE.BoxGeometry(0.5, 0.42, 0.7), 'steelDark'); pl.position.set(1.25 * Math.cos(a), 1.25 * Math.sin(a), 3.55); pl.rotation.z = a; cw.add(pl); }
    layer(cw, 8);
    layer(multi('hammer', [[[-5.0, -9.0, 0.7], [-0.7, -1.4, 0.45]], [[-5.0, -9.0, 0.7], [-6.2, -1.5, 0.45]]], 3.3, 0.2, 'steel'), 8);
    const cb = multi('chrono-bridge', [[[0, 0, 1.15], [-6.8, 0, 1.05]], [[0, 0, 1.0], [0.4, -5.6, 0.9]], [[-3.4, 0, 1.0], [-4.2, 5.0, 0.9]]], 3.55, 0.4, P.plate || 'copper');
    cb.add(at(mk(cyl(0.5, 0.75, 14), 'steelDark', { noEdges: true }), 0.4, -5.6, 3.175), at(mk(cyl(0.5, 3.55, 14), 'steelDark', { noEdges: true }), -4.2, 5.0, 1.775)); layer(cb, 12); cb.userData.anchor = [-3.4, 0, 4];
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 2.9 / 2.63 });
  } else if (P.calibre === '1530') {
    /* Rolex calibre 1530. No Rolex document was available. The pivot positions are read off a watchmaker's near-overhead photograph of a stripped calibre 1530 plate
       (mitka.co.uk, service of a calibre 1530/1560, 2017), scaled to the 28.5 mm diameter and corrected for the slight tilt of the camera: good to about 0.5 mm.
       Which hole belongs to which wheel is read from the same watchmaker's photograph of the train in place, and is an interpretation. Seen from the back, the crown is towards -x.
       Heights, sizes, tooth counts and outlines are estimated; the automatic winding gears are left out. */
    const bX = -1.93, bY = 7.12, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.4, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.75, 72, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 3.8; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.15, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 3.95, n: 64, z: 1.4, pin: 1.6, pinZ: 0.45, arbor: 3.3 });
    spins.third = mobile('third', -2.55, -3.65, { R: 3.0, n: 60, z: 1.85, pin: 0.5, pinZ: 1.4, arbor: 3.2 });
    spins.fourth = mobile('fourth', -1.46, -6.94, { R: 2.7, n: 50, z: 1.35, pin: 0.47, pinZ: 1.85 });
    const eX = 1.64, eY = -6.88;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.7, P.escapeTeeth || 15), z: 0.8, pin: 0.4, pinZ: 1.35, kind: 'steelDark' });
    const BX = 7.84, BY = -2.43, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(5.3, 0.26, 10, 72), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(10.2, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 10.2, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 4.0, pmy = -4.5, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 5.0, 0.2), 'steelDark'), 0, 0.6, 1.1), at(mk(new THREE.BoxGeometry(1.9, 0.4, 0.2), 'steelDark'), 0, -1.7, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.85, -1.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.85, -1.9, 1.1));
    layer(flat('barrel-bridge', [[bX, bY, 5.2]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[0, 0, 1.5], [-2.55, -3.65, 1.5], [-1.46, -6.94, 1.4], [eX, eY, 1.3]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [4.6, -2.4, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [10.2, 5.0, 1.4]], 3.3, 0.45), 4);
    jewel(-2.55, -3.65, 2.86, 4); jewel(-1.46, -6.94, 2.86, 4); jewel(eX, eY, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    /* the seconds hand is at the centre, but the fourth wheel is not: a wheel riding above the bridge turns a small pinion on the centre axis */
    const sd = at(part('seconds-drive', mv), -2.55, -3.65, 0), sdSpin = new THREE.Group(); sd.add(sdSpin);
    sdSpin.add(at(mk(extr(gearShape(4.0, 80, 0.14, 5), 0.18), 'brass', { edgeAngle: 40 }), 0, 0, 2.95));
    sd.add(at(mk(cyl(0.45, 0.3, 12), 'steelDark'), 2.55, 3.65, 3.04)); layer(sd, 8); sd.userData.anchor = [0, 0, 3.2];
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1, extra: sdSpin });
  } else if (P.calibre === '72') {
    /* Rolex calibre 727, on the Valjoux 72. Positions of the barrel, the going train, the pallets and the balance are measured off the photograph of the plate in Valjoux's
       own sheet for calibres 23 and 72 (1976), to about 0.3 mm; the chronograph wheels and the column wheel are measured off the photograph of the assembled movement in
       Rolex's parts sheet for calibre 727, to about 0.5 mm. The Valjoux sheet states the escape wheel diameter (5.75), the balance diameter (12.00), the inside of the barrel
       drum (11.95) and the distances escape wheel to pallets (3.30) and pallets to balance (4.50); the measured positions agree with those two distances to 0.2 mm.
       Seen from the back, the crown is towards -x. Heights, tooth counts, pinion sizes, the other wheel sizes and every outline are estimated; the hour counter, on the dial side, is left out. */
    const bX = -3.5, bY = -6.62, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(6.2, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(6.6, 80, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 4.9; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.95, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 4.8, n: 72, z: 1.4, pin: 0.88, pinZ: 0.45 });
    spins.third = mobile('third', 4.92, -2.63, { R: 3.5, n: 64, z: 1.85, pin: 0.76, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 8.05, 0, { R: 3.15, n: 56, z: 1.35, pin: 0.57, pinZ: 1.85, arbor: 3.35 });
    const eX = 7.6, eY = 3.79;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(2.85, P.escapeTeeth || 15), z: 0.8, pin: 0.66, pinZ: 1.35, kind: 'steelDark' });
    const BX = 0.85, BY = 8.0, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(5.64, 0.26, 10, 80), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(10.9, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 10.9, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 4.6, pmy = 5.6, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.6, 0.2), 'steelDark'), 0, 1.2, 1.1), at(mk(new THREE.BoxGeometry(3.4, 0.4, 0.2), 'steelDark'), 0, -0.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -1.55, -1.1, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 1.55, -1.1, 1.1));
    /* bridges: placed over the measured pivots, with simplified outlines */
    layer(flat('barrel-bridge', [[bX, bY, 5.8], [0, 0, 1.7]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[4.92, -2.63, 1.5], [8.05, 0, 1.5], [eX, eY, 1.2]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [6.4, 7.4, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [-5.8, 11.6, 1.4]], 3.3, 0.45), 4);
    jewel(4.92, -2.63, 2.86, 4); jewel(eX, eY, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    /* chronograph works */
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.45, n: 160, tooth: 0.1, z: 3.0, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.5 }, run);
    runSpin.add(at(mk(cyl(0.6, 0.25, 3), 'steelDark'), 0, 0, 3.32)); layer(run, 8);
    /* the coupling wheel is put where it meshes with the driving wheel and stands just clear of the runner; that is within 0.6 mm of where the photograph shows it */
    const cpx = 4.24, cpy = -4.25, cp = at(part('coupling', mv), cpx, cpy, 0);
    spins.drive = mobile(null, 8.05 - cpx, -cpy, { R: 3.3, n: 120, tooth: 0.1, z: 3.0, th: 0.18, spokes: 5, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 2.4, n: 88, tooth: 0.1, z: 3.0, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    cp.add(at(mk(extr(hullShape([[0, 0, 0.75], [2.0, -6.5, 0.6]]), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 3.3)); layer(cp, 8);
    const mr = part('minute-recorder', mv), mrSpin = mobile(null, -7.85, 0, { R: 1.9, n: 40, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, mr);
    mrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 3.5, 10), 'steelDark', { noEdges: true }), 0, 0, 1.75)); layer(mr, 8); mr.userData.anchor = [-7.85, 0, 3.3];
    const sg = at(part('sliding-gear', mv), -4.7, -1.4, 0); sg.add(at(mk(extr(gearShape(0.9, 20, 0.16, 0), 0.18), 'brass', { edgeAngle: 40 }), 0, 0, 3.0), at(mk(cyl(0.5, 0.1, 14), 'steel'), 0, 0, 3.23)); layer(sg, 8); sg.userData.anchor = [0, 0, 3.3];
    const cw = at(part('column-wheel', mv), -2.3, -10.0, 0); cw.add(at(mk(extr(gearShape(2.0, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.95));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, pl = mk(new THREE.BoxGeometry(0.5, 0.42, 0.7), 'steelDark'); pl.position.set(1.25 * Math.cos(a), 1.25 * Math.sin(a), 3.55); pl.rotation.z = a; cw.add(pl); }
    layer(cw, 8);
    layer(multi('hammer', [[[-4.8, -6.2, 0.7], [-0.7, -1.5, 0.45]], [[-4.8, -6.2, 0.7], [-6.5, -1.5, 0.45]]], 3.3, 0.2, 'steel'), 8);
    layer(flat('operating-lever', [[-11.5, -4.0, 0.6], [-5.2, -10.6, 0.5]], 3.3, 0.2, 'steel'), 8);
    const cb = multi('chrono-bridge', [[[0, 0, 1.15], [-7.85, 0, 1.05]], [[-3.9, 0, 1.0], [-6.2, 5.3, 0.9]], [[-3.9, 0, 1.0], [-3.7, -2.8, 0.9]]], 3.55, 0.4, P.plate || 'copper');
    cb.add(at(mk(cyl(0.5, 3.55, 14), 'steelDark', { noEdges: true }), -6.2, 5.3, 1.775), at(mk(cyl(0.5, 0.75, 14), 'steelDark', { noEdges: true }), -3.7, -2.8, 3.175)); layer(cb, 12); cb.userData.anchor = [-3.9, 0, 4];
    jewel(0, 0, 4.0, 12); jewel(-7.85, 0, 4.0, 12);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 3.3 / 2.4 });
  } else if (P.calibre === '178') {
    /* Venus calibre 178 (Breitling Navitimer 806). Sizes that Venus states on its own sheet for the calibre are used: casing diameter 31.00, escape wheel 5.45, balance 13.00,
       inside of the barrel drum 12.50. The sheet's photographs are too small to measure, so positions are read from a watchmaker's photographs (watchguy.co.uk, 2013): the barrel,
       the going train, the pallets and the balance from a near-overhead view of the bare plate, the chronograph wheels, the column wheel and the bridge feet from a view of the
       assembled movement, each to about 0.5 mm. The measured positions give 3.2 mm from escape wheel to pallets and 3.9 from pallets to balance; the sheet states 3.15 and 3.85.
       Seen from the back, the crown is towards -x. Heights, tooth counts, pinion sizes, the other wheel sizes and every outline are estimated; the hour counter, on the dial side, is left out. */
    const bX = -4.0, bY = -6.76, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(6.55, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(6.95, 84, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 5.2; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(6.25, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 5.3, n: 80, z: 1.4, pin: 0.88, pinZ: 0.45 });
    spins.third = mobile('third', 5.31, -2.99, { R: 3.3, n: 60, z: 1.85, pin: 0.77, pinZ: 1.45 });
    spins.fourth = mobile('fourth', 8.2, -0.41, { R: 3.3, n: 58, z: 1.05, pin: 0.57, pinZ: 1.85, arbor: 3.35 }); // set lower than in the Valjoux, so that it passes under the centre wheel, which it overlaps in plan
    const eX = 9.68, eY = 3.27;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(2.72, P.escapeTeeth || 15), z: 0.8, pin: 0.66, pinZ: 1.35, kind: 'steelDark' });
    const BX = 4.04, BY = 7.59, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(6.22, 0.26, 10, 88), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(12.1, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 12.1, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 7.0, pmy = 5.1, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 3.9, 0.2), 'steelDark'), 0, 0.85, 1.1), at(mk(new THREE.BoxGeometry(3.4, 0.4, 0.2), 'steelDark'), 0, -0.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -1.55, -1.1, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 1.55, -1.1, 1.1));
    /* bridges: placed over the measured pivots, with simplified outlines */
    layer(flat('barrel-bridge', [[bX, bY, 6.1], [0, 0, 1.7]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[5.31, -2.99, 1.5], [8.2, -0.41, 1.5], [eX, eY, 0.5]], 2.35, 0.45), 4); // kept narrow at the escape wheel, whose pivot lies just outside the balance rim
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [8.3, 7.5, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [-3.2, 13.0, 1.4]], 3.3, 0.45), 4); // its foot is measured from both photographs, which agree
    jewel(5.31, -2.99, 2.86, 4); jewel(eX, eY, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    /* chronograph works */
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.5, n: 160, tooth: 0.1, z: 3.0, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.5 }, run);
    runSpin.add(at(mk(cyl(0.6, 0.25, 3), 'steelDark'), 0, 0, 3.32)); layer(run, 8);
    /* the coupling wheel is put where it meshes with the driving wheel and stands just clear of the runner; that is within 0.3 mm of where the photograph shows it */
    const cpx = 4.07, cpy = -4.34, cp = at(part('coupling', mv), cpx, cpy, 0);
    spins.drive = mobile(null, 8.2 - cpx, -0.41 - cpy, { R: 3.4, n: 124, tooth: 0.1, z: 3.0, th: 0.18, spokes: 5, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 2.3, n: 84, tooth: 0.1, z: 3.0, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    cp.add(at(mk(extr(hullShape([[0, 0, 0.75], [2.0, -6.5, 0.6]]), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 3.3)); layer(cp, 8);
    const mr = part('minute-recorder', mv), mrSpin = mobile(null, -8.37, -0.1, { R: 2.6, n: 54, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, mr);
    mrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 3.5, 10), 'steelDark', { noEdges: true }), 0, 0, 1.75)); layer(mr, 8); mr.userData.anchor = [-8.37, -0.1, 3.3];
    const sg = at(part('sliding-gear', mv), -4.6, -2.6, 0); sg.add(at(mk(extr(gearShape(0.9, 20, 0.16, 0), 0.18), 'brass', { edgeAngle: 40 }), 0, 0, 3.0), at(mk(cyl(0.5, 0.1, 14), 'steel'), 0, 0, 3.23)); layer(sg, 8); sg.userData.anchor = [0, 0, 3.3];
    const cw = at(part('column-wheel', mv), 2.32, -9.6, 0); cw.add(at(mk(extr(gearShape(2.0, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.95));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, pl = mk(new THREE.BoxGeometry(0.5, 0.42, 0.7), 'steelDark'); pl.position.set(1.25 * Math.cos(a), 1.25 * Math.sin(a), 3.55); pl.rotation.z = a; cw.add(pl); }
    layer(cw, 8);
    layer(multi('hammer', [[[-4.8, -6.4, 0.7], [-0.7, -1.5, 0.45]], [[-4.8, -6.4, 0.7], [-7.2, -2.2, 0.45]]], 3.3, 0.2, 'steel'), 8);
    layer(flat('operating-lever', [[-11.8, -2.5, 0.6], [-1.0, -11.6, 0.5]], 3.3, 0.2, 'steel'), 8);
    const cb = multi('chrono-bridge', [[[0, 0, 1.15], [-8.37, -0.1, 1.05]], [[-4.2, 0, 1.0], [-4.4, 5.9, 0.9]]], 3.55, 0.4, P.plate || 'copper'); // the foot is measured from the photograph
    cb.add(at(mk(cyl(0.5, 3.55, 14), 'steelDark', { noEdges: true }), -4.4, 5.9, 1.775)); layer(cb, 12); cb.userData.anchor = [-4.2, 0, 4];
    jewel(0, 0, 4.0, 12); jewel(-8.37, -0.1, 4.0, 12);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 3.4 / 2.3 });
  } else if (P.calibre === '11') {
    /* Heuer Calibre 11 (Buren micro-rotor base, Dubois Depraz chronograph module). No dimensioned maker's drawing was available. Positions of the barrel, the large driving
       wheel, the third and fourth wheels, the balance, the micro-rotor and the two recorders are measured off overhead photographs of the base movement and of the assembled calibre
       printed in a 1982 journal article (AFAHA), scaled to 31 mm, to about 0.5 mm. Which wheel is which is read from the service manual's exploded views and a watchmaker's
       step-by-step photographs. The crown is at nine on this calibre, so seen from the back it is towards +x.
       The escape wheel and the pallets could not be seen and are placed between the fourth wheel and the balance. The oscillating pinion is placed where it must sit to work.
       Heights, sizes, tooth counts and every outline are estimated; the winding gears, the date work, the chronograph plate and most levers are left out. */
    const bX = 4.5, bY = -7.7, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.7, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(6.1, 76, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 4.3; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.45, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    /* the wheel the barrel drives is not at the centre: the centre is left free for the chronograph, and the hands are driven from the side */
    spins.centre = mobile('centre', 3.55, -0.85, { R: 3.35, n: 64, z: 1.4, pin: 0.75, pinZ: 0.45 });
    spins.third = mobile('third', 2.4, 3.1, { R: 2.55, n: 54, z: 1.85, pin: 0.72, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 6.0, 3.9, { R: 2.8, n: 56, z: 1.0, pin: 1.1, pinZ: 1.85, arbor: 3.35 });
    const eX = 5.4, eY = 7.2;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.7, P.escapeTeeth || 15), z: 0.5, pin: 0.5, pinZ: 1.0, kind: 'steelDark', arbor: 1.6 });
    const BX = 0.4, BY = 10.25, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(4.6, 0.26, 10, 72), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(8.8, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 8.8, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 3.1, pmy = 8.5, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 3.2, 0.2), 'steelDark'), 0, 0.5, 0.85), at(mk(new THREE.BoxGeometry(2.2, 0.4, 0.2), 'steelDark'), 0, -0.8, 0.85), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -1.0, -1.0, 0.85), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 1.0, -1.0, 0.85));
    layer(flat('barrel-bridge', [[bX, bY, 5.2]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[3.55, -0.85, 1.4], [2.4, 3.1, 1.3], [6.0, 3.9, 1.5]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [eX, eY, 0.8]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [-8.2, 10.3, 1.4]], 3.3, 0.45), 4);
    jewel(3.55, -0.85, 2.86, 4); jewel(2.4, 3.1, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    /* the micro-rotor lies inside the base movement, beside the train and under the chronograph: its swept circle is measured from the photograph */
    const rot = at(part('rotor', mv), -8.3, -0.1, 0), rw = new THREE.Shape(); rw.absarc(0, 0, 7.0, Math.PI * 0.5, Math.PI * 1.5, false); rw.closePath();
    rot.add(at(mk(extr(rw, 1.2), 'steelDark', { edgeAngle: 40 }), 0, 0, 0.9), at(mk(cyl(7.0, 0.12, 48), 'steel'), 0, 0, 0.84), at(mk(cyl(0.9, 1.5, 16), 'steelDark'), 0, 0, 1.5));
    rot.userData.anchor = [-2, 0, 2.3]; layer(rot, 4);
    /* chronograph module, above the base movement */
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.8, n: 160, tooth: 0.1, z: 3.0, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.5 }, run);
    runSpin.add(at(mk(cyl(0.6, 0.25, 3), 'steelDark'), 0, 0, 3.32)); layer(run, 8);
    /* the driving wheel rides on the fourth wheel's long pivot; the oscillating pinion stands between it and the runner */
    const opx = 3.70, opy = 2.40, cp = at(part('coupling', mv), opx, opy, 0);
    spins.drive = mobile(null, 6.0 - opx, 3.9 - opy, { R: 2.3, n: 90, tooth: 0.1, z: 3.0, th: 0.18, spokes: 5, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 0.45, n: 10, tooth: 0.12, z: 2.85, th: 0.5, spokes: 0, arbor: 0.01, kind: 'steelDark' }, cp);
    cp.add(at(mk(cyl(0.16, 0.7, 10), 'steelDark', { noEdges: true }), 0, 0, 3.21)); layer(cp, 8); cp.userData.anchor = [0, 0, 3.6];
    const mr = part('minute-recorder', mv), mrSpin = mobile(null, -7.8, 0, { R: 1.9, n: 40, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, mr);
    mrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 1.0, 10), 'steelDark', { noEdges: true }), 0, 0, 3.0)); layer(mr, 8); mr.userData.anchor = [-7.8, 0, 3.3];
    const hr = part('hour-recorder', mv), hrSpin = mobile(null, 8.35, 0.1, { R: 1.9, n: 40, tooth: 0.2, z: 3.0, th: 0.18, spokes: 4, arbor: 0.01 }, hr);
    hrSpin.add(at(mk(cyl(0.45, 0.25, 3), 'steelDark'), 0, 0, 3.32), at(mk(cyl(0.2, 1.0, 10), 'steelDark', { noEdges: true }), 0, 0, 3.0));
    hr.add(at(mk(extr(hullShape([[8.35, 0.1, 1.0], [12.6, 0.2, 0.9], [7.8, -4.1, 0.9]]), 0.4), P.plate || 'copper', { edgeAngle: 40 }), 0, 0, 3.55)); layer(hr, 8); hr.userData.anchor = [8.35, 0.1, 4];
    const cw = at(part('cam', mv), -10.0, -6.5, 0);
    cw.add(at(mk(extr(hullShape([[0, 0, 1.0], [1.5, 0.5, 0.55], [-0.9, 1.1, 0.5]]), 0.3), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.6), at(mk(extr(hullShape([[0, 0, 0.8], [-1.3, -0.6, 0.5], [0.7, -1.2, 0.45]]), 0.3), 'steel', { edgeAngle: 40 }), 0, 0, 2.95), at(mk(cyl(0.3, 0.5, 12), 'steelDark'), 0, 0, 3.4)); layer(cw, 8);
    layer(multi('hammer', [[[-5.5, -6.0, 0.7], [-1.2, -1.6, 0.45]], [[-5.5, -6.0, 0.7], [-6.9, -1.9, 0.45]]], 3.3, 0.2, 'steel'), 8);
    const cb = multi('chrono-bridge', [[[0, 0, 1.15], [-7.8, 0, 1.05]], [[-3.9, 0, 1.0], [-3.2, 5.5, 0.9]], [[-3.9, 0, 1.0], [-6.4, 4.6, 0.9]]], 3.55, 0.4, P.plate || 'copper');
    cb.add(at(mk(cyl(0.5, 3.55, 14), 'steelDark', { noEdges: true }), -3.2, 5.5, 1.775), at(mk(cyl(0.5, 0.75, 14), 'steelDark', { noEdges: true }), -6.4, 4.6, 3.175)); layer(cb, 12); cb.userData.anchor = [-3.9, 0, 4];
    jewel(0, 0, 4.0, 12); jewel(-7.8, 0, 4.0, 12);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 2.3 / 0.45 });
  } else if (P.calibre === '2121') {
    /* Audemars Piguet calibre 2121 (LeCoultre 920 base). No dimensioned drawing was available. Positions of the balance, the escape wheel, the pallets and the barrel's axis
       (under its ratchet wheel) are measured off Audemars Piguet's own archive photographs of the movement, published on its AP Chronicles site, scaled to the catalogue's
       28.40 mm, to about 0.5 mm; the balance and escape wheel agree between the photograph of the back and the photograph of the dial side. Seen from the back, the crown is towards -x.
       The rotor hides the middle of the train in every photograph: the centre wheel is at the centre because the hands are, the fourth wheel is put at a jewel seen on the
       dial side that lies the right distance from the escape wheel (an interpretation), and the third wheel is placed where it must sit to link the two.
       Heights, sizes, tooth counts and outlines are estimated. The winding gears, the date ring, and the ring and four ruby rollers that carry the rotor's rim are left out. */
    const bX = -6.6, bY = -0.1, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(4.85, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.2, 68, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.9, 14), 'steelDark', { noEdges: true }), 0, 0, 1.45),
      at(mk(extr(gearShape(2.6, 48, 0.2, 0), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 2.85));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 3.6; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(4.6, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 4.0, n: 72, z: 1.4, pin: 1.4, pinZ: 0.45 });
    spins.third = mobile('third', 4.6, 0, { R: 2.9, n: 60, z: 1.85, pin: 0.6, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 6.22, -3.0, { R: 2.05, n: 48, z: 1.35, pin: 0.5, pinZ: 1.85 });
    const eX = 4.9, eY = -5.2;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.5, P.escapeTeeth || 15), z: 0.8, pin: 0.5, pinZ: 1.2, kind: 'steelDark', arbor: 1.75 });
    const BX = -0.7, BY = -6.74, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(4.02, 0.26, 10, 72), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(7.7, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 2.3, pmy = -5.67, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 3.2, 0.2), 'steelDark'), 0, 0.5, 1.1), at(mk(new THREE.BoxGeometry(2.0, 0.4, 0.2), 'steelDark'), 0, -0.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.9, -1.1, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.9, -1.1, 1.1));
    layer(flat('barrel-bridge', [[bX, bY, 4.2]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[0, 0, 1.5], [4.6, 0, 1.5], [6.22, -3.0, 1.3]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [eX, eY, 0.8]], 1.6, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.3], [-6.4, -6.7, 1.3]], 3.3, 0.45), 4);
    jewel(4.6, 0, 2.86, 4); jewel(6.22, -3.0, 2.86, 4); jewel(eX, eY, 1.92, 3); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.92, 3);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1 });
  } else if (P.calibre === '6217') {
    /* Seiko calibre 6217A. Seiko's parts list for it gives 27.60 mm, 5.35 mm, 17 jewels and 18,000 vibrations an hour. Positions of the barrel, the third wheel, the sweep second
       (fourth) wheel, the escape wheel and the balance are measured off the stage-by-stage photographs in Seiko's service manual for the sister calibre 6218A, which are small:
       good to about 0.5 mm. The manual shows the centre wheel under its own bridge with the sweep second wheel above it on the same axis, and one bridge over the barrel and the train.
       Seen from the back, the crown is towards -x. The escape wheel is drawn 0.8 mm nearer the centre than measured so that it meshes; the pallets and both cock feet are placed
       by eye. Heights, tooth counts, sizes and outlines are estimated; the automatic winding work, the centre wheel bridge and the date work are left out. */
    const bX = -2.04, bY = 6.65, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.25, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.6, 72, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.7, 14), 'steelDark', { noEdges: true }), 0, 0, 1.35));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 3.9; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.0, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    /* the centre wheel and the sweep second wheel share the centre: the centre wheel below, the sweep second wheel above the third wheel */
    spins.centre = mobile('centre', 0, 0, { R: 3.4, n: 64, z: 1.4, pin: 1.36, pinZ: 0.45, arbor: 1.9 });
    spins.third = mobile('third', -2.8, -3.1, { R: 3.2, n: 60, z: 1.85, pin: 0.78, pinZ: 1.4, arbor: 2.7 });
    spins.fourth = mobile('fourth', 0, 0, { R: 3.75, n: 70, z: 2.3, pin: 0.98, pinZ: 1.85, arbor: 2.7 });
    const eX = 3.72, eY = -2.37;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.4, P.escapeTeeth || 15), z: 0.8, pin: 0.65, pinZ: 2.2, kind: 'steelDark', arbor: 2.7 });
    const BX = 9.8, BY = 2.1, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(3.44, 0.26, 10, 64), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(6.6, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 6.6, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 6.15, pmy = -0.57, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.2, 0.2), 'steelDark'), 0, 0.9, 1.1), at(mk(new THREE.BoxGeometry(2.0, 0.4, 0.2), 'steelDark'), 0, -1.2, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.9, -1.4, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.9, -1.4, 1.1));
    layer(flat('train-bridge', [[bX, bY, 4.6], [0, 0, 1.6], [-2.8, -3.1, 1.5], [eX, eY, 1.2]], 2.6, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [6.9, -2.2, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.3], [7.3, -7.5, 1.3]], 3.3, 0.45), 4);
    jewel(-2.8, -3.1, 3.11, 4); jewel(eX, eY, 3.11, 4); jewel(0, 0, 3.11, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.75, 3);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1 });
  } else if (P.calibre === '12120') {
    /* Patek Philippe calibre 12-120. No Patek document was available. Every pivot of this calibre shows as a jewel in its own bridge, so the positions of the centre, third,
       fourth and escape wheels, the balance and the barrel arbor are measured off two straight-on photographs of the movement published by Revolution: an archival one, on which
       that article marks each wheel of the train, and a modern one. The two agree to about 0.5 mm; the scale is the roughly 27 mm usually given for the calibre.
       The whole movement is turned a quarter turn by the bench so that the fourth wheel lies under the six o'clock register; within it the fourth wheel is on +x.
       The pallets are placed from the modern photograph, less surely. Heights, sizes, tooth counts and every outline are estimated; the winding wheels and the regulator are left out. */
    const bX = -6.4, bY = -3.1, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.55, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.9, 76, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 4.2; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.3, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 4.05, n: 72, z: 1.4, pin: 1.2, pinZ: 0.45 });
    spins.third = mobile('third', 4.3, -2.05, { R: 3.3, n: 64, z: 1.85, pin: 0.7, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 7.68, 0, { R: 3.15, n: 60, z: 1.35, pin: 0.65, pinZ: 1.85 });
    const eX = 7.5, eY = 3.9;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(2.2, P.escapeTeeth || 15), z: 0.8, pin: 0.75, pinZ: 1.35, kind: 'steelDark' });
    const BX = 1.35, BY = 7.4, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(5.44, 0.26, 10, 80), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(10.5, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 5.15, pmy = 5.1, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.2, 0.2), 'steelDark'), 0, 1.0, 1.1), at(mk(new THREE.BoxGeometry(2.6, 0.4, 0.2), 'steelDark'), 0, -1.0, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -1.2, -1.2, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 1.2, -1.2, 1.1));
    /* bridges, as the photographs show them: a full bridge over the barrel, one curved bridge for the centre and third wheels, and a finger bridge each for the fourth and escape wheels */
    layer(flat('barrel-bridge', [[bX, bY, 5.4]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[0, 0, 1.5], [4.3, -2.05, 1.4], [9.6, -7.2, 1.1]], 2.35, 0.45), 4);
    layer(flat('fourth-cock', [[7.68, 0, 1.15], [11.6, -3.0, 1.0]], 2.35, 0.45), 4);
    layer(flat('escape-cock', [[eX, eY, 1.0], [11.4, 2.3, 0.9]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [7.0, 6.6, 0.7]], 1.45, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [-5.15, 10.8, 1.3]], 3.3, 0.45), 4);
    jewel(0, 0, 2.86, 4); jewel(4.3, -2.05, 2.86, 4); jewel(7.68, 0, 2.86, 4); jewel(eX, eY, 2.86, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1 });
  } else if (P.calibre === '818') {
    /* LeCoultre calibre 818. LeCoultre's own sheet gives the casing diameter 20.80 mm, the height 2.94 mm, 17 jewels, 18,000 vibrations an hour and a balance 8.54 mm across.
       Positions of the barrel, the third and fourth wheels, the escape wheel and the balance are read off the two small photographs on that sheet, the bridge side and the
       dial side, which agree with each other: good to about 0.6 mm. Seen from the back, the crown is towards -x. The bench draws every movement at the scale of a 27 mm one and
       shrinks it to size, so the figures below are the measured ones times 13.5 / 10.4.
       The pallets are placed between the escape wheel and the balance. Other sizes, heights, tooth counts and outlines are estimated; the winding wheels are left out. */
    const bX = -3.05, bY = 6.23, barrel = at(part('barrel', mv), bX, bY, 0);
    barrel.add(at(mk(cyl(5.25, 0.8, 56), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.6, 72, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.4, 14), 'steelDark', { noEdges: true }), 0, 0, 1.2));
    const spring = []; for (let i = 0; i <= 300; i++) { const a = i / 300 * Math.PI * 2 * 8, r = 0.8 + i / 300 * 3.9; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(5.0, 0.12, 48), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 4.5, n: 72, z: 1.4, pin: 1.34, pinZ: 0.45 });
    spins.third = mobile('third', -2.6, -4.67, { R: 3.3, n: 60, z: 1.85, pin: 0.85, pinZ: 1.4 });
    spins.fourth = mobile('fourth', 0, -7.79, { R: 2.7, n: 54, z: 1.35, pin: 0.76, pinZ: 1.85 });
    const eX = 2.99, eY = -9.09;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.6, P.escapeTeeth || 15), z: 0.8, pin: 0.56, pinZ: 1.2, kind: 'steelDark', arbor: 1.75 });
    const BX = 6.88, BY = -2.01, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(5.28, 0.26, 10, 72), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(10.2, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = 4.67, pmy = -6.23, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - pmy, BX - pmx) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.2, 0.2), 'steelDark'), 0, 1.0, 1.1), at(mk(new THREE.BoxGeometry(2.2, 0.4, 0.2), 'steelDark'), 0, -1.0, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -1.0, -1.2, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 1.0, -1.2, 1.1));
    layer(flat('barrel-bridge', [[bX, bY, 5.0]], 2.35, 0.45), 4);
    layer(flat('train-bridge', [[0, 0, 1.15], [-2.6, -4.67, 1.4], [0, -7.79, 1.2]], 2.35, 0.45), 4);
    layer(flat('pallet-cock', [[pmx, pmy, 0.7], [eX, eY, 0.8]], 1.6, 0.24), 3);
    layer(flat('balance-cock', [[BX, BY, 1.4], [9.6, 5.6, 1.3]], 3.3, 0.45), 4);
    jewel(-2.6, -4.67, 2.86, 4); jewel(0, -7.79, 2.86, 4); jewel(eX, eY, 1.92, 3); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.92, 3);
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1 });
  } else {
    // Going train. Each wheel meshes with the next mobile's pinion: centre distance = wheel radius + pinion radius.
    const bX = -5.6, bY = 1.5, barrel = at(part('barrel', mv), bX, bY, 0);
    /* the drum stays below the centre wheel (z 1.4), which passes over its lid as in a real movement */
    barrel.add(at(mk(cyl(4.9, 0.8, 48), 'brass'), 0, 0, 0.75), at(mk(extr(gearShape(5.2, 64, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4), at(mk(cyl(0.42, 2.1, 14), 'steelDark', { noEdges: true }), 0, 0, 1.05));
    const spring = []; for (let i = 0; i <= 260; i++) { const a = i / 260 * Math.PI * 2 * 7, r = 0.7 + i / 260 * 3.8; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.165)); }
    const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
    const cover = at(mk(cyl(4.6, 0.12, 40), 'brass'), 0, 0, 1.24); barrel.add(cover); layer(cover, 4);
    spins.centre = mobile('centre', 0, 0, { R: 4.0, n: 64, z: 1.4, pin: 0.6, pinZ: 0.45 });
    const tx = (4.5 * 4.5 - 4.25 * 4.25 + sub * sub) / (2 * sub), ty = Math.sqrt(4.5 * 4.5 - tx * tx);
    spins.third = mobile('third', tx, ty, { R: 3.75, n: 60, z: 0.8, pin: 0.5, pinZ: 1.4 });
    const fR = Math.min(3.2, sub - 4.1);
    spins.fourth = mobile('fourth', sub, 0, { R: fR, n: Math.round(fR * 17.5), z: 1.4, pin: 0.5, pinZ: 0.8, arbor: 3.2 });
    const eD = (fR + 0.32) / 3.52, eX = sub + 1.2 * eD, eY = -3.31 * eD;
    spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.6, P.escapeTeeth || 15), z: 0.8, pin: 0.32, pinZ: 1.4, kind: 'steelDark' });
    const BX = 5.6, BY = -8.4, bal = at(part('balance', mv), BX, BY, 0), balSpin = new THREE.Group(); bal.add(balSpin);
    balSpin.add(at(mk(new THREE.TorusGeometry(3.0, 0.26, 10, 56), 'brass', { edgeAngle: 50 }), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(5.6, 0.36, 0.2), 'brass'), 0, 0, 2.3), at(mk(new THREE.BoxGeometry(0.36, 5.6, 0.2), 'brass'), 0, 0, 2.3), at(mk(cyl(0.45, 0.3, 14), 'steelDark'), 0, 0, 1.9));
    bal.add(at(mk(cyl(0.2, 3, 10), 'steelDark', { noEdges: true }), 0, 0, 1.6));
    const hs = at(part('hairspring', mv), BX, BY, 2.72), HN = 240, hsPos = new Float32Array((HN + 1) * 3), hsGeo = new THREE.BufferGeometry();
    hsGeo.setAttribute('position', new THREE.BufferAttribute(hsPos, 3));
    const hsLine = new THREE.Line(hsGeo, new THREE.LineBasicMaterial({ color: 0x3d4f6e })); hsLine.userData.pickLine = true; hs.add(hsLine);
    const pmx = (eX + BX) / 2, pmy = (eY + BY) / 2, pal = at(part('pallet', mv), pmx, pmy, 0), palRock = new THREE.Group();
    pal.rotation.z = Math.atan2(BY - eY, BX - eX) - Math.PI / 2; pal.add(palRock);
    palRock.add(at(mk(new THREE.BoxGeometry(0.45, 4.4, 0.2), 'steelDark'), 0, 0.3, 1.1), at(mk(new THREE.BoxGeometry(1.9, 0.4, 0.2), 'steelDark'), 0, -1.7, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), -0.85, -1.9, 1.1), at(mk(new THREE.BoxGeometry(0.3, 0.5, 0.3), 'ruby'), 0.85, -1.9, 1.1));

    /* bridges */
    const bb = flat('barrel-bridge', [[bX, bY, 5.3], [bX - 2.5, bY + 3.5, 3.2]], 2.15, 0.5); layer(bb, 4);
    const tb = flat('train-bridge', [[tx, ty, 1.5], [sub, 0, 1.5], [eX, eY, 1.3], [sub + 3.2, 3.4, 1.4]], 2.15, 0.45); layer(tb, 4);
    const n = Math.hypot(BX, BY), bc = flat('balance-cock', [[BX, BY, 1.3], [BX / n * 11.5, BY / n * 11.5, 1.6], [BX / n * 11.5 - 1.6, BY / n * 11.5 + 1.2, 1.3]], 3.3, 0.45); layer(bc, 4);
    jewel(tx, ty, 2.66, 4); jewel(sub, 0, 2.66, 4); jewel(eX, eY, 2.66, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);

    /* chronograph works, above the bridges */
    if (chrono) {
    const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.4, n: 150, tooth: 0.1, z: 2.85, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.4 }, run);
    runSpin.add(at(mk(cyl(0.75, 0.3, 3), 'steelDark'), 0, 0, 3.2)); layer(run, 8);
    const ix = (4.65 * 4.65 - 2.95 * 2.95 + sub * sub) / (2 * sub), iy = -Math.sqrt(Math.max(0, 4.65 * 4.65 - ix * ix)); /* 4.65 from the runner, 2.95 from the driving wheel: teeth meet, wheels do not cross */
    const cp = at(part('coupling', mv), ix, iy, 0);
    spins.drive = mobile(null, sub - ix, -iy, { R: 1.7, n: 48, tooth: 0.12, z: 2.85, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    spins.inter = mobile(null, 0, 0, { R: 1.25, n: 36, tooth: 0.12, z: 2.85, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
    cp.add(at(mk(extr(hullShape([[0, 0, 0.7], [-1.6, 5.6, 0.6]]), 0.2), 'steel', { edgeAngle: 40 }), 0, 0, 3.1)); layer(cp, 8);
    const mr = part('minute-recorder', mv); mobile(null, -sub, 0, { R: 2.2, n: 60, tooth: 0.14, z: 2.85, th: 0.18, spokes: 4, arbor: 0.01 }, mr); mr.position.set(0, 0, 0); layer(mr, 8);
    mr.userData.anchor = [-sub, 0, 3];
    const cw = at(part(P.cam ? 'cam' : 'column-wheel', mv), -3.2, -9.6, 0);
    if (P.cam) { // cam switching: two stacked, lobed plates in place of a column wheel
      cw.add(at(mk(extr(hullShape([[0, 0, 1.0], [1.5, 0.5, 0.55], [-0.9, 1.1, 0.5]]), 0.3), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.5), at(mk(extr(hullShape([[0, 0, 0.8], [-1.3, -0.6, 0.5], [0.7, -1.2, 0.45]]), 0.3), 'steel', { edgeAngle: 40 }), 0, 0, 2.85), at(mk(cyl(0.3, 0.5, 12), 'steelDark'), 0, 0, 3.3));
    } else {
    cw.add(at(mk(extr(gearShape(1.5, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.5));
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, p = mk(new THREE.BoxGeometry(0.5, 0.42, 0.75), 'steelDark'); p.position.set(1.05 * Math.cos(a), 1.05 * Math.sin(a), 3.1); p.rotation.z = a; cw.add(p); }
    }
    layer(cw, 8);
    const hm = flat('hammer', [[-6.5, -7.5, 0.7], [-1.3, -1.7, 0.5], [-6.4, -2.1, 0.5]], 3.1, 0.2, 'steel'); layer(hm, 8);
    const cb = flat('chrono-bridge', [[0, 0, 1.25], [-sub, 0, 1.25], [-3.2, 6.8, 1.2]], 3.55, 0.4); layer(cb, 12);
    }
    Object.assign(M, { balSpin, palRock, hsPos, hsGeo, HN, interRatio: 1.7 / 1.25 });
  }
  /* winding rotor of an automatic: a half-disc weight on a central bearing, shown at rest */
  if (P.calibre === '11') { /* the Calibre 11's micro-rotor is built with its movement, above */ } else if (P.rotor === 'micro') { // a small rotor set into the movement. In the real calibre it is buried under the chronograph works; it is shown on the surface so it can be seen
    const rot = at(part('rotor', mv), 7.6, 7.6, 0), w = new THREE.Shape(); w.absarc(0, 0, 4.2, Math.PI * 0.75, Math.PI * 1.75, false); w.closePath();
    rot.add(at(mk(extr(w, 0.55), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.75), at(mk(cyl(4.3, 0.12, 40), 'steel'), 0, 0, 2.68), at(mk(cyl(0.8, 0.5, 16), 'steelDark'), 0, 0, 3.2));
    rot.userData.anchor = [0, 0, 3.6]; layer(rot, 6);
  } else if (P.rotor) {
    const rot = part('rotor', mv), w = new THREE.Shape(), web = new THREE.Shape(), ro = mvR - 0.5;
    w.absarc(0, 0, ro, Math.PI, Math.PI * 2, false); w.absarc(0, 0, ro - 3.2, Math.PI * 2, Math.PI, true); w.closePath();
    web.absarc(0, 0, ro - 3.2, Math.PI, Math.PI * 2, false); web.lineTo(1.6, 0); web.absarc(0, 0, 1.6, 0, Math.PI, false); web.closePath();
    const rz = chrono ? 4.0 : 3.95; // the rotor swings clear of the balance cock (and, on a chronograph, the chronograph works) and under the caseback
    rot.add(at(mk(extr(w, 0.74), 'steelDark', { edgeAngle: 40 }), 0, 0, rz), at(mk(extr(web, 0.16), 'steel', { edgeAngle: 40 }), 0, 0, rz), at(mk(cyl(1.1, 0.5, 20), 'steelDark'), 0, 0, rz + 0.3));
    rot.userData.anchor = [0, -(ro - 1.6), rz + 0.7]; layer(rot, chrono ? 16 : 12);
    if (P.calibre === '2121') rot.rotation.z = Math.PI; // parked over the half away from the balance, as in the maker's repair-guide photograph
  }

  /* ----- behaviour ----- */
  const beatHz = P.beatsPerHour / 3600, TAU = Math.PI * 2, AMP = 2.36; // 2.36 rad = about 270 degrees peak to peak
  function animate(tv, now) {
    const { balSpin, palRock, hsPos, hsGeo, HN } = M;
    const b = tv * beatHz, beats = Math.floor(b), e = Math.min(1, (b - beats) / 0.14), esc = (beats + e) * (TAU / (2 * (P.escapeTeeth || 15)));
    const f4 = (beats + e) * TAU / (60 * beatHz); // the fourth wheel turns once a minute whatever the beat rate
    spins.escape.rotation.z = -esc; spins.fourth.rotation.z = f4; spins.third.rotation.z = -f4 / 7.5; spins.centre.rotation.z = f4 / 60; if (M.extra) M.extra.rotation.z = spins.third.rotation.z;
    if (spins.drive) { spins.drive.rotation.z = f4; spins.inter.rotation.z = -f4 * M.interRatio; }
    const ph = Math.sin(Math.PI * b), th = AMP * ph;
    balSpin.rotation.z = th; palRock.rotation.z = 0.17 * Math.tanh(7 * ph);
    for (let i = 0; i <= HN; i++) { const t = i / HN, w = 1 - t, a = t * TAU * 9 + th * w, r = (0.38 + t * 1.75) * (1 - 0.035 * th * w * t * 4); hsPos[i * 3] = r * Math.cos(a); hsPos[i * 3 + 1] = r * Math.sin(a); hsPos[i * 3 + 2] = 0; }
    hsGeo.attributes.position.needsUpdate = true; hsGeo.computeBoundingSphere();
    hSec.rotation.z = -(beats * TAU / (60 * beatHz));
    const s = now.getSeconds() + now.getMilliseconds() / 1000, m = now.getMinutes() + s / 60, h = (now.getHours() % 12) + m / 60;
    hMin.rotation.z = -m * TAU / 60; hHour.rotation.z = -h * TAU / 12; if (chrono) hChr.rotation.z = 0;
  }
  const setExplode = v => asm.forEach(a => a.g.position.set(a.home.x + a.ex * v, a.home.y + a.ey * v, a.home.z + a.ez * v));
  function setOpen(v) { // unscrew the back, then set it and the dust cover aside
    const u = Math.min(1, v * 2), s = Math.max(0, v * 2 - 1);
    back.position.z += -7 * u; back.rotation.z = u * TAU * 1.5; back.position.x += -47 * s;
    if (dust) { dust.position.z += -4 * u; dust.position.x += 47 * s; }
  }
  const setLayers = v => layers.forEach(l => { l.o.position.z = l.z0 + l.dz * v; });
  root.scale.z = (P.thickness || 14) / 14; // the stack is modelled 14 mm tall and scaled to the stated thickness
  crown.scale.z = 1 / root.scale.z; if (push) push.scale.z = 1 / root.scale.z; // keep the crown and pushers round
  return finish({ root, parts, animate, setExplode, setOpen, setLayers, fit: { h: P.lugToLug / 2 + 10, w: R + 7, d: 62 } });
}

/* Shared behaviour for any model: style switching, highlighting, picking. */
function finish(m) {
  const meshes = []; m.root.traverse(o => { if (o.isMesh && o.userData.tech) meshes.push(o); });
  const lines = []; m.root.traverse(o => { if (o.userData.pickLine) lines.push(o); });
  m.pickables = meshes.concat(lines);
  m.setStyle = style => { meshes.forEach(o => { o.material = o.userData[style]; o.children.forEach(c => { if (c.userData.edge) c.visible = style === 'tech'; }); }); };
  let lit = null;
  m.highlight = id => {
    const paint = (g, on) => g && g.traverse(o => {
      if (o.isMesh && o.userData.tech) { o.userData.tech.color.setHex(on ? BRASS_HI : o.userData.baseTech); o.userData.real.emissive.setHex(on ? 0x8a6418 : 0); o.userData.real.emissiveIntensity = on ? 0.55 : 1; }
      if (o.userData.edge) o.material = on ? hiLine : lineMat;
      if (o.userData.pickLine) o.material.color.setHex(on ? 0xA88952 : 0x3d4f6e);
    });
    paint(m.parts[lit], false); lit = id; paint(m.parts[id], true);
  };
  m.partOf = o => { while (o && !o.userData.part) o = o.parent; return o ? o.userData.part : null; };
  return m;
}

/* A supplied .glb. Name the nodes in the file, then point each component at its node:
   { id: 'crystal', node: 'Crystal', explode: [0, 0, 29] }. Nodes named hand-hour,
   hand-minute and hand-seconds are driven by the clock. */
export async function loadGLTF(watch) {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync(watch.asset.url), root = gltf.scene, parts = {}, asm = [];
  if (watch.asset.scale) root.scale.setScalar(watch.asset.scale);
  root.traverse(o => { if (o.isMesh) { o.userData.real = o.material; o.userData.tech = new THREE.MeshBasicMaterial({ color: 0xEDE6D8, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 }); o.userData.baseTech = 0xEDE6D8; if (!o.material.emissive) o.userData.real = new THREE.MeshStandardMaterial({ color: o.material.color }); const e = new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry, 28), lineMat); e.raycast = () => {}; e.userData.edge = true; o.add(e); } });
  watch.components.forEach(c => { const o = c.node && root.getObjectByName(c.node); if (o) { o.userData.part = c.id; parts[c.id] = o; if (c.explode) asm.push({ g: o, e: c.explode, home: o.position.clone() }); } });
  const hh = root.getObjectByName('hand-hour'), hm = root.getObjectByName('hand-minute'), hs = root.getObjectByName('hand-seconds'), TAU = Math.PI * 2;
  const animate = (tv, now) => { const s = now.getSeconds(), mi = now.getMinutes() + s / 60, h = (now.getHours() % 12) + mi / 60; if (hm) hm.rotation.z = -mi * TAU / 60; if (hh) hh.rotation.z = -h * TAU / 12; if (hs) hs.rotation.z = -s * TAU / 60; };
  const setExplode = v => asm.forEach(a => a.g.position.set(a.home.x + a.e[0] * v, a.home.y + a.e[1] * v, a.home.z + a.e[2] * v));
  const box = new THREE.Box3().setFromObject(root), sz = box.getSize(new THREE.Vector3());
  return finish({ root, parts, animate, setExplode, setOpen: () => {}, setLayers: () => {}, fit: { h: sz.y / 2 + 4, w: sz.x / 2 + 4, d: sz.z * 4 } });
}
