/* Workbench 3D models.
   buildProcedural() makes an approximate watch from measurements, in millimetres.
   loadGLTF() wraps a supplied .glb so it behaves the same way.
   Axes: the dial faces +Z, twelve o'clock is +Y. */
import * as THREE from 'three';

const INK = 0x242521, BRASS_HI = 0xE2C27A;
const KIND = {
  steel:    { real: { color: 0xcfcfcb, metalness: 1, roughness: 0.3 }, tech: 0xEDE6D8 },
  steelDark:{ real: { color: 0x9c9c99, metalness: 1, roughness: 0.36 }, tech: 0xE1D8C4 },
  iron:     { real: { color: 0x8e8e8a, metalness: 1, roughness: 0.5 }, tech: 0xE3DAC6 },
  copper:   { real: { color: 0xd39c7a, metalness: 1, roughness: 0.38 }, tech: 0xE8DFCB },
  brass:    { real: { color: 0xd2aa52, metalness: 1, roughness: 0.3 }, tech: 0xEDE6D8 },
  ruby:     { real: { color: 0xb3122e, metalness: 0, roughness: 0.15 }, tech: 0xC98A7A },
  white:    { real: { color: 0xf3f1e8, metalness: 0, roughness: 0.6 }, tech: 0xFFFFFF },
  leather:  { real: { color: 0x2a2320, metalness: 0, roughness: 0.9 }, tech: 0xD9CEB9 },
  face:     { real: { color: 0xffffff, metalness: 0.15, roughness: 0.7 }, tech: 0xFFFFFF },
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
  const P = watch.asset.params, R = face.R, ri = face.bezelInner, sub = P.chrono === false ? 8 : face.inR * 0.5;
  const chrono = P.chrono !== false, mvR = (P.movementDiameter || 27) / 2;
  const root = new THREE.Group(), parts = {}, asm = [], layers = [];
  const part = (id, parent = root) => { const g = new THREE.Group(); g.userData.part = id; parent.add(g); parts[id] = g; return g; };
  const assembly = (g, ez, ex = 0, ey = 0) => asm.push({ g, ez, ex, ey, home: g.position.clone() });
  const layer = (o, dz) => layers.push({ o, dz, z0: o.position.z });

  /* ----- case, crown, pushers, strap ----- */
  const kase = part('case');
  kase.add(mk(lathe([[16.6, -4.6], [18.4, -4.6], [R, -3.3], [R, 1.7], [R - 0.7, 2.5], [16.6, 2.5], [16.6, -4.6]]), 'steel'));
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const lug = mk(new THREE.BoxGeometry(2.7, 9.5, 3.4), 'steel'); lug.position.set(sx * (P.lugWidth / 2 + 1.35), sy * (P.lugToLug / 2 - 4.2), -2.0); lug.rotation.x = -sy * 0.28; kase.add(lug); }
  if (P.crownGuards) for (const sy of [-1, 1]) { const gd = mk(new THREE.BoxGeometry(3.2, 2.4, 3.4), 'steel'); gd.position.set(R + 0.7, sy * 3.9, -0.9); gd.rotation.z = -sy * 0.5; kase.add(gd); }
  const crown = part('crown');
  crown.add(at(mk(new THREE.CylinderGeometry(2.9, 2.9, 3, 28).rotateZ(Math.PI / 2), 'steel', { edgeAngle: 10 }), R + 2.1, 0, -0.9), at(mk(new THREE.CylinderGeometry(1.2, 1.2, 1.2, 16).rotateZ(Math.PI / 2), 'steel'), R + 0.3, 0, -0.9));
  const push = chrono ? part('pushers') : null;
  if (push) for (const a of [-1, 1]) { const g = new THREE.Group(); g.rotation.z = a * Math.PI / 6; g.add(at(mk(new THREE.CylinderGeometry(1.9, 1.9, 2, 22).rotateZ(Math.PI / 2), 'steel'), R + 2.2, 0, -0.9), at(mk(new THREE.CylinderGeometry(1.1, 1.1, 1.6, 16).rotateZ(Math.PI / 2), 'steel'), R + 0.6, 0, -0.9)); push.add(g); }
  const strap = part('strap');
  for (const sy of [-1, 1]) { const s = mk(new THREE.BoxGeometry(P.lugWidth - 0.4, 13, 2.2), 'leather'); s.position.set(0, sy * (P.lugToLug / 2 + 2.6), -4.3); s.rotation.x = -sy * 0.5; strap.add(s); }
  assembly(kase, -15); assembly(crown, -15, 9); if (push) assembly(push, -15, 5); assembly(strap, -15);

  /* ----- bezel, crystal, dial, hands ----- */
  const bezel = part('bezel');
  bezel.add(mk(lathe([[ri, 2.5], [R, 2.5], [R - 0.3, 3.9], [ri, 3.95], [ri, 2.5]]), 'steel'));
  bezel.add(at(mk(new THREE.RingGeometry(ri + 0.05, R - 0.45, 128), 'face', { noEdges: true, real: { map: tex.real }, tech: { map: tex.tech } }), 0, 0, 3.97));
  assembly(bezel, 21);
  const crystal = part('crystal'), dome = [];
  for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI / 2; dome.push([ri * Math.cos(a), 3.95 + 3.3 * Math.sin(a)]); }
  crystal.add(mk(lathe(dome), 'acrylic', { edgeAngle: 80 }));
  assembly(crystal, 29);
  const dial = part('dial'), dg = new THREE.CircleGeometry(ri, 128), uv = dg.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, 0.5 + (uv.getX(i) - 0.5) * ri / R, 0.5 + (uv.getY(i) - 0.5) * ri / R);
  dial.add(at(mk(dg, 'face', { noEdges: true, real: { map: tex.real }, tech: { map: tex.tech } }), 0, 0, 2.32), at(mk(cyl(ri, 0.3, 64), 'brass'), 0, 0, 2.15));
  assembly(dial, 8);
  const hands = part('hands'), Lm = face.handLen, Lh = Lm * 0.64;
  const hand = (w, L, z, kind = 'white') => { const p = new THREE.Group(), g = new THREE.BoxGeometry(w, L, 0.14); g.translate(0, L / 2 - 1.3, 0); p.add(mk(g, kind)); p.position.z = z; hands.add(p); return p; };
  const hHour = hand(1.5, Lh, 2.7), hMin = hand(1.15, Lm, 2.95), hChr = hand(0.28, Lm * 1.05, 3.2);
  if (P.hands === 'mercedes') { hHour.add(at(mk(cyl(1.75, 0.14, 28), 'white'), 0, Lh * 0.62, 0)); hChr.add(at(mk(cyl(0.8, 0.1, 18), 'white'), 0, Lm * 0.62, 0)); }
  hands.add(at(mk(cyl(0.95, 0.9, 20), 'steel'), 0, 0, 3.0));
  const subHand = (x, y) => { const p = hand(0.26, 4.2, 2.5); p.position.x = x; p.position.y = y; p.children[0].geometry.translate(0, -0.5, 0); return p; };
  const hSec = chrono ? subHand(-sub, 0) : hChr; if (chrono) { subHand(sub, 0); subHand(0, -sub); }
  assembly(hands, 13);

  /* ----- spacer ring, dust cover, caseback ----- */
  const spacer = part('spacer'); spacer.add(mk(lathe([[mvR + 0.05, -3.6], [16.5, -3.6], [16.5, 2.0], [mvR + 0.05, 2.0], [mvR + 0.05, -3.6]]), 'steelDark')); assembly(spacer, -7);
  const dust = P.dustCover === false ? null : part('dustcover'); if (dust) { dust.add(at(mk(cyl(16.3, 0.25, 64), 'iron'), 0, 0, -4.3)); assembly(dust, -24); }
  const back = part('caseback'); back.add(mk(lathe([[0, -6.4], [13, -6.4], [17.6, -5.4], [18.4, -4.6], [0, -4.6]]), 'steel')); assembly(back, -31);

  /* ----- movement: local +Z points out of the back of the watch ----- */
  const mv = new THREE.Group(); mv.position.z = 0.2; mv.rotation.y = Math.PI; root.add(mv); assembly(mv, 0);
  part('plate', mv).add(at(mk(cyl(mvR, 2, 72), P.plate || 'copper'), 0, 0, -1));
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
  barrel.add(at(mk(cyl(4.9, 1.6, 48), 'brass'), 0, 0, 1.15), at(mk(extr(gearShape(5.2, 64, 0.25, 0), 0.3), 'brass', { edgeAngle: 40 }), 0, 0, 0.4));
  const spring = []; for (let i = 0; i <= 260; i++) { const a = i / 260 * Math.PI * 2 * 7, r = 0.7 + i / 260 * 3.8; spring.push(new THREE.Vector3(r * Math.cos(a), r * Math.sin(a), 1.97)); }
  const ms = new THREE.Line(new THREE.BufferGeometry().setFromPoints(spring), new THREE.LineBasicMaterial({ color: 0x3d4f6e })); ms.raycast = () => {}; barrel.add(ms);
  const cover = at(mk(cyl(4.6, 0.12, 40), 'brass'), 0, 0, 2.02); barrel.add(cover); layer(cover, 4);
  spins.centre = mobile('centre', 0, 0, { R: 4.0, n: 64, z: 1.4, pin: 0.6, pinZ: 0.45 });
  const tx = (4.5 * 4.5 - 4.25 * 4.25 + sub * sub) / (2 * sub), ty = Math.sqrt(4.5 * 4.5 - tx * tx);
  spins.third = mobile('third', tx, ty, { R: 3.75, n: 60, z: 0.8, pin: 0.5, pinZ: 1.4 });
  spins.fourth = mobile('fourth', sub, 0, { R: 3.2, n: 56, z: 1.4, pin: 0.5, pinZ: 0.8, arbor: 3.2 });
  const eX = sub + 1.2, eY = -3.31;
  spins.escape = mobile('escape', eX, eY, { shape: escapeShape(1.6), z: 0.8, pin: 0.32, pinZ: 1.4, kind: 'steelDark' });
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
  const cw = at(part('column-wheel', mv), -3.2, -9.6, 0);
  cw.add(at(mk(extr(gearShape(1.5, 18, 0.3, 0), 0.25), 'steelDark', { edgeAngle: 40 }), 0, 0, 2.5));
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, p = mk(new THREE.BoxGeometry(0.5, 0.42, 0.75), 'steelDark'); p.position.set(1.05 * Math.cos(a), 1.05 * Math.sin(a), 3.1); p.rotation.z = a; cw.add(p); }
  layer(cw, 8);
  const hm = flat('hammer', [[-6.5, -7.5, 0.7], [-1.3, -1.7, 0.5], [-6.4, -2.1, 0.5]], 3.1, 0.2, 'steel'); layer(hm, 8);
  const cb = flat('chrono-bridge', [[0, 0, 1.25], [-sub, 0, 1.25], [-3.2, 6.8, 1.2]], 3.55, 0.4); layer(cb, 12);
  }
  /* winding rotor of an automatic: a half-disc weight on a central bearing, shown at rest */
  if (P.rotor) {
    const rot = part('rotor', mv), w = new THREE.Shape(), web = new THREE.Shape(), ro = mvR - 0.5;
    w.absarc(0, 0, ro, Math.PI, Math.PI * 2, false); w.absarc(0, 0, ro - 3.2, Math.PI * 2, Math.PI, true); w.closePath();
    web.absarc(0, 0, ro - 3.2, Math.PI, Math.PI * 2, false); web.lineTo(1.6, 0); web.absarc(0, 0, 1.6, 0, Math.PI, false); web.closePath();
    rot.add(at(mk(extr(w, 0.9), 'steelDark', { edgeAngle: 40 }), 0, 0, 3.45), at(mk(extr(web, 0.16), 'steel', { edgeAngle: 40 }), 0, 0, 3.45), at(mk(cyl(1.1, 0.5, 20), 'steelDark'), 0, 0, 3.75));
    rot.userData.anchor = [0, -(ro - 1.6), 4.3]; layer(rot, 12);
  }

  /* ----- behaviour ----- */
  const beatHz = P.beatsPerHour / 3600, TAU = Math.PI * 2, AMP = 2.36; // 2.36 rad = about 270 degrees peak to peak
  function animate(tv, now) {
    const b = tv * beatHz, beats = Math.floor(b), e = Math.min(1, (b - beats) / 0.14), esc = (beats + e) * (TAU / 30);
    const f4 = esc / (beatHz * 2);
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
