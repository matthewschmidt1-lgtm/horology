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
  if (square) kase.add(at(mk(new THREE.ExtrudeGeometry(rrShape(CW, CH, CR, { R: inner }), { depth: 7.1, bevelEnabled: false, curveSegments: 16 }), CASE), 0, 0, -4.6));
  else kase.add(mk(lathe([[inner, -4.6], [R - 1.45, -4.6], [R, -3.3], [R, 1.7], [R - 0.7, 2.5], [inner, 2.5], [inner, -4.6]]), BAND));
  const lugL = Math.max(5, P.lugToLug / 2 - R + 5.5), lugT = P.lugThick || 2.7;
  if (tank) { for (const sx of [-1, 1]) kase.add(at(mk(extr(rrShape(BW / 2, P.lugToLug / 2, 1.1), 8.2), CASE), sx * (R - BW / 2), 0, -4.5)); } // two side bars run the full length and carry the strap between their ends
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
  if (P.spacer !== false) { const spacer = part('spacer'); spacer.add(mk(lathe([[mvR + 0.05, -3.6], [inner - 0.1, -3.6], [inner - 0.1, 2.0], [mvR + 0.05, 2.0], [mvR + 0.05, -3.6]]), 'steelDark')); assembly(spacer, -7); }
  const dust = P.dustCover === false ? null : part('dustcover'); if (dust) { dust.add(at(mk(cyl(inner - 0.3, 0.25, 64), 'iron'), 0, 0, -4.3)); assembly(dust, -24); }
  const back = part('caseback'); if (tank) back.add(at(mk(extr(rrShape(CW, CH, CR), 1.2), CASE), 0, 0, -5.8)); else back.add(mk(lathe([[0, -6.4], [R - 6.85, -6.4], [R - 2.25, -5.4], [R - 1.45, -4.6], [0, -4.6]]), CASE)); assembly(back, -31);

  /* ----- tuning-fork movement (Bulova Accutron 214) -----
     The works of a 214 face the dial, which is why a Spaceview can do without one. So this movement is not
     turned over like the others: local +Z points out of the front, and "opening" the watch lifts the
     crystal, chapter ring and hands away. The layout is a simplified interpretation, not the calibre's. */
  if (P.oscillator === 'fork') {
    const mv = new THREE.Group(); mv.position.z = -0.4; root.add(mv); assembly(mv, 0);
    part('plate', mv).add(at(mk(cyl(mvR, 1, 72), 'steel', { real: { color: 0x7f7f7c, roughness: 0.72 } }), 0, 0, -0.5));
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
    circuit.add(at(mk(new THREE.BoxGeometry(5.2, 2.4, 0.3), 'coil'), 0, 10.6, 0.15), at(mk(cyl(0.8, 1.1, 18), 'steelDark'), -1.3, 10.6, 0.85), at(mk(new THREE.BoxGeometry(1.5, 0.7, 0.7), 'copper'), 1.2, 11.0, 0.65), at(mk(cyl(0.42, 0.8, 12), 'brass'), 1.2, 10.1, 0.7));
    circuit.userData.anchor = [0, 10.6, 1.5];
    // index wheel and the short train to the seconds hand. Wheel and pinion centres are set so the teeth meet.
    const spins = {}, IX = -2.6, IY = 1.2;
    const mobile = (id, x, y, o) => {
      const g = at(part(id, mv), x, y, 0), sp = new THREE.Group(); g.add(sp);
      sp.add(at(mk(extr(gearShape(o.R, o.n, o.tooth || 0.2, o.spokes), 0.2), o.kind || 'brass', { edgeAngle: 40 }), 0, 0, o.z));
      if (o.pin) sp.add(at(mk(cyl(o.pin, 0.45, 12), 'steelDark'), 0, 0, o.pinZ));
      sp.add(at(mk(cyl(0.16, 2.0, 10), 'steelDark', { noEdges: true }), 0, 0, 1.0));
      g.userData.anchor = [0, 0, 1.9]; return sp;
    };
    spins.index = mobile('index-wheel', IX, IY, { R: 1.2, n: 300, tooth: 0.035, spokes: 0, z: 1.2, kind: 'steel', pin: 0.3, pinZ: 0.78 });
    spins.inter = mobile('train', -0.73, 2.86, { R: 2.2, n: 60, z: 0.55, pin: 0.35, pinZ: 1.28, spokes: 4 });
    spins.sec = mobile('seconds-wheel', 0, 0, { R: 2.6, n: 72, z: 1.05, spokes: 4 });
    // the index jewel rides on the left tine and pushes the wheel; the pawl jewel is fixed and stops it running back
    const ij = part('index-jewel', tines[0]);
    ij.add(at(mk(new THREE.BoxGeometry(1.7, 0.22, 0.22), 'steel'), 1.4, IY + 1.2 + 7.4, 1.3), at(mk(new THREE.BoxGeometry(0.34, 0.34, 0.34), 'ruby'), TX + IX, IY + 1.2 + 7.4, 1.3));
    ij.userData.anchor = [TX + IX, IY + 1.2 + 7.4, 1.6];
    const pawl = part('pawl', mv);
    pawl.add(at(mk(new THREE.BoxGeometry(0.22, 1.9, 0.22), 'steel'), IX, IY - 2.2, 1.3), at(mk(new THREE.BoxGeometry(0.34, 0.34, 0.34), 'ruby'), IX, IY - 1.22, 1.3), at(mk(cyl(0.35, 1.3, 12), 'steel'), IX, IY - 3.2, 0.65));
    pawl.userData.anchor = [IX, IY - 2.2, 1.6];
    const bridge = part('train-bridge', mv);
    bridge.add(at(mk(extr(hullShape([[-0.73, 2.86, 0.9], [0, 0, 0.9], [3.0, 2.6, 1.0]]), 0.35), 'steel', { edgeAngle: 40 }), 0, 0, 1.75), at(mk(cyl(0.34, 0.14, 14), 'ruby'), -0.73, 2.86, 2.12));
    bridge.userData.anchor = [2.6, 2.4, 2.2]; layer(bridge, 5);
    // the cell sits behind the plate, under a hatch in the back; the setting handle is on the back too
    const cell = part('battery', mv); cell.add(at(mk(cyl(4.4, 2.6, 40), 'steel'), 0, -4.6, -2.4), at(mk(cyl(3.6, 0.2, 32), 'brass'), 0, -4.6, -3.8));
    cell.userData.anchor = [0, -4.6, -3.9]; assembly(cell, -8);
    const hatch = part('hatch', back); hatch.add(at(mk(cyl(4.8, 0.3, 40), CASE), 0, -4.6, -6.5), at(mk(new THREE.BoxGeometry(5, 0.5, 0.2), 'steelDark'), 0, -4.6, -6.7));
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
    function setOpen(v) { // lift the crystal and bezel, then the chapter ring and hands, and set them aside
      const u = Math.min(1, v * 2), s = Math.max(0, v * 2 - 1);
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
  part('plate', mv).add(at(mk(cyl(mvR / MK, 2, 72), P.plate || 'copper', { real: { color: P.plate === 'steel' ? 0x7f7f7c : 0x9a6649, roughness: 0.72 } }), 0, 0, -1)); /* matte and darker than the bridges, so they read against it */
  const spins = {};
  const mobile = (id, x, y, o, parent) => {
    const g = parent || at(part(id, mv), x, y, 0), sp = new THREE.Group(); if (parent) sp.position.set(x, y, 0); g.add(sp);
    sp.add(at(mk(extr(o.shape || gearShape(o.R, o.n, o.tooth || 0.22, o.spokes), o.th || 0.22), o.kind || 'brass', { edgeAngle: 40 }), 0, 0, o.z));
    if (o.pin) sp.add(at(mk(cyl(o.pin, 0.5, 14), 'steelDark'), 0, 0, o.pinZ + 0.11));
    sp.add(at(mk(cyl(0.2, o.arbor || 2.4, 10), 'steelDark', { noEdges: true }), 0, 0, (o.arbor || 2.4) / 2));
    return sp;
  };
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
  const flat = (id, circles, z, th, kind = P.plate || 'copper') => { const g = part(id, mv), cx = circles[0][0], cy = circles[0][1]; g.position.set(cx, cy, 0); const m = at(mk(extr(hullShape(circles.map(c => [c[0] - cx, c[1] - cy, c[2]])), th), kind, { edgeAngle: 40 }), 0, 0, z); g.add(m); return g; };
  const bb = flat('barrel-bridge', [[bX, bY, 5.3], [bX - 2.5, bY + 3.5, 3.2]], 2.15, 0.5); layer(bb, 4);
  const tb = flat('train-bridge', [[tx, ty, 1.5], [sub, 0, 1.5], [eX, eY, 1.3], [sub + 3.2, 3.4, 1.4]], 2.15, 0.45); layer(tb, 4);
  const n = Math.hypot(BX, BY), bc = flat('balance-cock', [[BX, BY, 1.3], [BX / n * 12.3, BY / n * 12.3, 1.6], [BX / n * 12.3 - 1.6, BY / n * 12.3 + 1.2, 1.3]], 3.3, 0.45); layer(bc, 4);
  const jw = part('jewels', mv), jewel = (x, y, z, host) => { const j = at(mk(cyl(0.36, 0.16, 16), 'ruby'), x, y, z); jw.add(j); layer(j, host); return j; };
  jewel(tx, ty, 2.66, 4); jewel(sub, 0, 2.66, 4); jewel(eX, eY, 2.66, 4); jewel(BX, BY, 3.82, 4); jewel(pmx, pmy, 1.3, 0);

  /* chronograph works, above the bridges */
  if (chrono) {
  const run = part('chrono-runner', mv), runSpin = mobile(null, 0, 0, { R: 3.4, n: 150, tooth: 0.1, z: 2.85, th: 0.18, kind: 'steelDark', spokes: 4, arbor: 3.4 }, run);
  runSpin.add(at(mk(cyl(0.75, 0.3, 3), 'steelDark'), 0, 0, 3.2)); layer(run, 8);
  const cp = at(part('coupling', mv), sub - 2.95, 0, 0);
  spins.drive = mobile(null, 2.95, 0, { R: 1.7, n: 48, tooth: 0.12, z: 2.85, th: 0.18, spokes: 0, arbor: 0.01 }, cp);
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
  /* winding rotor of an automatic: a half-disc weight on a central bearing, shown at rest */
  if (P.rotor === 'micro') { // a small rotor set into the movement. In the real calibre it is buried under the chronograph works; it is shown on the surface so it can be seen
    const rot = at(part('rotor', mv), 7.6, 7.6, 0), w = new THREE.Shape(); w.absarc(0, 0, 4.2, Math.PI * 0.75, Math.PI * 1.75, false); w.closePath();
    rot.add(at(mk(extr(w, 0.55), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.75), at(mk(cyl(4.3, 0.12, 40), 'steel'), 0, 0, 2.68), at(mk(cyl(0.8, 0.5, 16), 'steelDark'), 0, 0, 3.2));
    rot.userData.anchor = [0, 0, 3.6]; layer(rot, 6);
  } else if (P.rotor) {
    const rot = part('rotor', mv), w = new THREE.Shape(), web = new THREE.Shape(), ro = mvR - 0.5;
    w.absarc(0, 0, ro, Math.PI, Math.PI * 2, false); w.absarc(0, 0, ro - 3.2, Math.PI * 2, Math.PI, true); w.closePath();
    web.absarc(0, 0, ro - 3.2, Math.PI, Math.PI * 2, false); web.lineTo(1.6, 0); web.absarc(0, 0, 1.6, 0, Math.PI, false); web.closePath();
    const rz = chrono ? 4.05 : 3.45; // an automatic chronograph carries its rotor above the chronograph works
    rot.add(at(mk(extr(w, 0.9), 'steelDark', { edgeAngle: 40 }), 0, 0, rz), at(mk(extr(web, 0.16), 'steel', { edgeAngle: 40 }), 0, 0, rz), at(mk(cyl(1.1, 0.5, 20), 'steelDark'), 0, 0, rz + 0.3));
    rot.userData.anchor = [0, -(ro - 1.6), rz + 0.85]; layer(rot, chrono ? 16 : 12);
  }

  /* ----- behaviour ----- */
  const beatHz = P.beatsPerHour / 3600, TAU = Math.PI * 2, AMP = 2.36; // 2.36 rad = about 270 degrees peak to peak
  function animate(tv, now) {
    const b = tv * beatHz, beats = Math.floor(b), e = Math.min(1, (b - beats) / 0.14), esc = (beats + e) * (TAU / (2 * (P.escapeTeeth || 15)));
    const f4 = (beats + e) * TAU / (60 * beatHz); // the fourth wheel turns once a minute whatever the beat rate
    spins.escape.rotation.z = -esc; spins.fourth.rotation.z = f4; spins.third.rotation.z = -f4 / 7.5; spins.centre.rotation.z = f4 / 60;
    if (spins.drive) { spins.drive.rotation.z = f4; spins.inter.rotation.z = -f4 * (1.7 / 1.25); }
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
