/* The Interactive Watch Workbench: interface and 3D viewport.
   Watch records live in ./watches/. Models are built or loaded by ./model.js. */
import { watches } from './watches/index.js';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const want = new URLSearchParams(location.search).get('watch') || new URLSearchParams(location.hash.slice(1)).get('watch'), watch = watches.find(w => w.id === want) || watches[0], comps = watch.components, byId = Object.fromEntries(comps.map(c => [c.id, c]));
const archive = (window.WATCHES || []).find(w => w.id === watch.archiveId), Draw = window.Draw;
const ST = { D: 'Documented', E: 'Estimated', I: 'Interpretation' };
const state = { view: 'front', style: 'real', level: 'beginner', sel: null, labels: false, loupe: false, run: true, slow: false, explode: 0, open: 0, layers: 0 };
const cur = { explode: 0, open: 0, layers: 0 };

/* ---------- panels ---------- */
$('#w-kicker').textContent = `${watch.brand}${watch.noRef ? '' : ` · Ref. ${watch.reference}`} · ${watch.year}`;
$('#w-title').innerHTML = `${watch.model} <em>${watch.reference}</em>`;
$('#caveat').textContent = 'Approximate model, built from published dimensions.';
$('#asset-note').textContent = watch.asset.note;
document.title = `${watch.brand} ${watch.model} · The Workbench`;
/* One quiet line for choosing a watch: the name of the one on the bench, which opens the full set, and a step to the next or the last. */
{
  const n = watches.length, at = watches.indexOf(watch), prev = watches[(at + n - 1) % n], next = watches[(at + 1) % n], plates = window.WATCHES || [];
  const thumb = w => { const pl = plates.find(x => x.id === w.archiveId); return pl && Draw ? Draw.front(pl, {}) : ''; };
  $('#picker').innerHTML = n > 1 ? `<span class="pk-label">On the bench</span>
    <button type="button" class="pk-cur" id="pk-cur" aria-expanded="false" aria-controls="pk-menu"><b><span class="long">${watch.short || watch.model}</span><span class="short">Choose a watch</span></b><i>${at + 1} of ${n}</i></button>
    <span class="pk-step"><a href="?watch=${prev.id}" aria-label="Previous watch: ${prev.short || prev.model}">\u2039</a><a href="?watch=${next.id}" aria-label="Next watch: ${next.short || next.model}">\u203A</a></span>
    <div class="pk-menu" id="pk-menu" hidden>${watches.map(w => `<a href="?watch=${w.id}"${w === watch ? ' class="on" aria-current="true"' : ''}><span class="pk-art" aria-hidden="true">${thumb(w)}</span><span class="pk-txt"><b>${w.short || w.model}</b><em>${w.year}</em></span></a>`).join('')}</div>` : '';
  { // a still field of stars behind the bar, as on the Nature of Time: seeded, so it never changes or moves
    let x = 8128, c = ''; const rnd = () => (x = (x * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 90; i++) { const r = rnd(); c += `<circle cx="${(rnd() * 100).toFixed(2)}%" cy="${(rnd() * 100).toFixed(2)}%" r="${r > 0.94 ? 1.2 : r > 0.7 ? 0.85 : 0.55}" opacity="${(0.2 + rnd() * 0.55).toFixed(2)}"/>`; }
    if (n > 1) $('#picker').insertAdjacentHTML('afterbegin', `<svg class="pk-stars" aria-hidden="true">${c}</svg>`);
  }
  const cur = $('#pk-cur'), menu = $('#pk-menu'), open = v => { menu.hidden = !v; cur.setAttribute('aria-expanded', v); };
  if (cur) {
    cur.addEventListener('click', e => { e.stopPropagation(); open(menu.hidden); });
    document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#pk-menu')) open(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !menu.hidden) { open(false); cur.focus(); } });
  }
}
$('#specs').innerHTML = `<table class="wspec">${watch.specs.map(([k, v, s]) => `<tr><th>${k}</th><td>${v}<i class="st ${s}" title="${ST[s]}"></i></td></tr>`).join('')}</table>`;
$('#history').innerHTML = watch.history.map(h => `<section><h3>${h.h}<i class="st ${h.s}" title="${ST[h.s]}"></i></h3><p>${h.p}</p></section>`).join('');
const groups = [...new Set(comps.map(c => c.group))];
$('#parts').innerHTML = groups.map(g => `<h3>${g}</h3><ul>${comps.filter(c => c.group === g).map(c => `<li><button type="button" data-part="${c.id}">${c.name}</button></li>`).join('')}</ul>`).join('');

function renderDetail() {
  const c = byId[state.sel];
  if (!c) { $('#detail').innerHTML = `<p class="kicker">Component explorer</p><h2>Pick a part</h2><p class="lead">Click a part on the watch or in the list.</p>`; return; }
  const row = (k, v) => v ? `<div><dt>${k}</dt><dd>${v}</dd></div>` : '';
  $('#detail').innerHTML = `<p class="kicker">${c.group}<span class="st ${c.status}">${ST[c.status]}</span></p><h2>${c.name}</h2>
    <p class="lead">${c[state.level]}</p>
    ${state.level === 'horologist' ? `<dl>${row('What it does', c.fn)}</dl>` : ''}
    <details><summary>More about this part</summary><dl>${row('Material', c.material)}${row('Why it matters', c.significance)}</dl></details>
    ${c.related && c.related.length ? `<p class="rel"><span>Related</span>${c.related.filter(r => byId[r]).map(r => `<button type="button" data-part="${r}">${byId[r].name}</button>`).join('')}</p>` : ''}`;
}
function select(id, fromScene) {
  state.sel = id; renderDetail();
  $$('#parts button').forEach(b => b.classList.toggle('on', b.dataset.part === id));
  $$('#labels .lab').forEach(b => b.classList.toggle('on', b.dataset.part === id));
  if (model) model.highlight(id);
  const c = byId[id];
  if (c && !fromScene && c.group !== 'Exterior' && state.view !== 'movement' && state.view !== 'exploded' && state.view !== 'blueprint') setView('movement');
  if (c) { setPane(true); showPane('parts'); $('#pane-parts').scrollTop = 0; if (!fromScene && matchMedia('(max-width: 900px)').matches) $('#viewport').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-part]'); if (b && !b.classList.contains('lab')) select(b.dataset.part, !!b.closest('#blueprint')); });
$('#pane-info .seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; $$('#pane-info .seg button').forEach(x => x.classList.toggle('on', x === b)); $('#specs').hidden = b.dataset.tab !== 'specs'; $('#history').hidden = b.dataset.tab !== 'history'; });
$('#level-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.level = b.dataset.level; $$('#level-seg button').forEach(x => x.classList.toggle('on', x === b)); renderDetail(); });
/* On a desktop the side panel starts closed, so the watch has the whole bench; it opens from its button or when a part is chosen. */
function setPane(open) { document.body.classList.toggle('pane-closed', !open); const b = $('#pane-tog'); b.setAttribute('aria-expanded', open); b.textContent = open ? 'Hide panel' : 'Parts and details'; }
setPane(false);
$('#pane-tog').addEventListener('click', () => setPane(document.body.classList.contains('pane-closed')));
function showPane(p) { $$('.pane').forEach(x => x.classList.toggle('show', x.dataset.pane === p)); $$('.mtabs button').forEach(x => x.classList.toggle('on', x.dataset.show === p)); }
$('.mtabs').addEventListener('click', e => { const b = e.target.closest('button'); if (b) showPane(b.dataset.show); });
showPane('parts'); renderDetail();

/* ---------- blueprint sheet (2D, from the archive plate) ---------- */
const LEG = { crystal: 'crystal', bezel: 'bezel', hands: 'hands', dial: 'dial', movement: 'plate', 'case middle': 'case', crown: 'crown', caseback: 'caseback' };
function buildBlueprint() {
  if (!archive) { $('#blueprint').innerHTML = '<p class="bp-note">No archive plate is linked to this watch.</p>'; return; }
  const ex = Draw.exploded(archive);
  $('#blueprint').innerHTML = `<div class="bp-sheet">
    <p class="bp-title"><b>${watch.brand} ${watch.model}</b> · Ref. ${watch.reference} · dimensions in millimetres</p>
    <div class="bp-grid">
      <figure class="b1">${Draw.front(archive, { dims: true })}<figcaption>Fig. 1 · Front elevation</figcaption></figure>
      <figure class="b2">${Draw.side(archive)}<figcaption>Fig. 2 · Side elevation</figcaption></figure>
      <figure class="b3">${Draw.rear(archive)}<figcaption>Fig. 3 · Rear elevation</figcaption></figure>
      <figure class="b4">${ex.svg}<figcaption>Fig. 4 · Exploded assembly</figcaption><ol>${ex.parts.map(p => { const k = Object.keys(LEG).find(k => p.toLowerCase().includes(k)); return `<li>${k ? `<button type="button" data-part="${LEG[k]}">${p}</button>` : p}</li>`; }).join('')}</ol></figure>
      <figure class="b5">${Draw.movement(archive)}<figcaption>Fig. 5 · Calibre ${watch.movement.replace(/^.*calibre /, '')}, schematic</figcaption></figure>
    </div>
    <p class="bp-note">A modern interpretive drawing made from published specifications. Not a manufacturer’s document. “≈” marks an approximate figure.</p></div>`;
}
buildBlueprint();
function tick2d() {
  const n = new Date(), t = n.getSeconds() + n.getMilliseconds() / 1000, m = (n.getMinutes() + t / 60) * 6, h = ((n.getHours() % 12) + n.getMinutes() / 60) * 30;
  $$('[data-hand]').forEach(el => { const k = el.dataset.hand, b = +el.dataset.bps; el.setAttribute('transform', `rotate(${(k === 'h' ? h : k === 'm' ? m : (b ? Math.floor(t * b) / b : t) * 6).toFixed(2)})`); });
}

/* ---------- 3D ---------- */
let THREE, model, renderer, scene, camera, controls, loupeR, loupeCam, ray, labels = [], tv = 0, last = 0, tween = null;
const vp = $('#viewport'), canvas = $('#gl'), loupe = $('#loupe');
const VIEWS = {
  front: { theta: 0, phi: Math.PI / 2, r: 1 }, side: { theta: Math.PI / 2, phi: Math.PI / 2, r: 1 }, rear: { theta: Math.PI, phi: Math.PI / 2, r: 1 },
  movement: { theta: Math.PI, phi: Math.PI / 2, r: 0.74, open: 1 }, exploded: { theta: 1.12, phi: 1.2, r: 1.3, explode: 1 }, studio: { theta: 0.55, phi: 1.15, r: 1.05, style: 'real' }
};

function texture(real) {
  const c = document.createElement('canvas'); c.width = c.height = 1024;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  if (!archive) return t;
  const img = new Image(), url = URL.createObjectURL(new Blob([Draw.face(archive, real).svg], { type: 'image/svg+xml' }));
  img.onload = () => { c.getContext('2d').drawImage(img, 0, 0, 1024, 1024); t.needsUpdate = true; URL.revokeObjectURL(url); };
  img.src = url; return t;
}
const baseDist = () => { const f = model.fit, a = vp.clientWidth / Math.max(1, vp.clientHeight); return Math.max(f.h, f.w / a) / Math.tan(camera.fov * Math.PI / 360); };

function setStyle(s) {
  state.style = s; if (model) model.setStyle(s);
  vp.classList.toggle('real', s === 'real');
  $$('#style-seg button').forEach(b => b.classList.toggle('on', b.dataset.style === s));
  if (scene) scene.background = new THREE.Color(s === 'real' ? 0x1d1e1b : 0xEDE6D8);
}
function setView(v) {
  state.view = v; const bp = v === 'blueprint', def = VIEWS[v] || {};
  $$('#toolbar button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  $('#blueprint').hidden = !bp; vp.classList.toggle('bp', bp); vp.classList.toggle('mv', v === 'movement');
  $('#hint3d').hidden = bp || !model; $('#l-layers').classList.toggle('off', bp); // both sliders are offered in every 3D view; moving Separate layers opens the Movement view by itself
  if (bp || !model) return;
  if (def.style) setStyle(def.style);
  state.explode = def.explode || 0; $('#s-explode').value = state.explode;
  state.open = def.open || 0; if (v !== 'movement') { state.layers = 0; $('#s-layers').value = 0; }
  const from = new THREE.Spherical().setFromVector3(camera.position), to = { r: baseDist() * def.r, phi: def.phi, theta: def.theta };
  let d = to.theta - from.theta; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  tween = { t: 0, from: { r: from.radius, phi: from.phi, theta: from.theta }, to: { r: to.r, phi: to.phi, theta: from.theta + d } };
}
$('#toolbar').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setView(b.dataset.view); });
$('#style-seg').addEventListener('click', e => { const b = e.target.closest('button'); if (b) setStyle(b.dataset.style); });
$('#reset').addEventListener('click', () => setView(state.view === 'blueprint' ? 'front' : state.view));
const dolly = k => { if (!camera) return; const s = new THREE.Spherical().setFromVector3(camera.position); s.radius = Math.min(controls.maxDistance, Math.max(controls.minDistance, s.radius * k)); camera.position.setFromSpherical(s); };
$('#zoom-in').addEventListener('click', () => dolly(0.8)); $('#zoom-out').addEventListener('click', () => dolly(1.25));
// Labels start off so the watch is seen clean; the switch sits on the picture itself.
$('#labels').hidden = true;
$('#t-labels').addEventListener('click', e => { state.labels = !state.labels; $('#labels').hidden = !state.labels; e.currentTarget.setAttribute('aria-pressed', state.labels); });
$('#t-slow').addEventListener('change', e => { state.slow = e.target.checked; });
$('#s-explode').addEventListener('input', e => {
  const v = +e.target.value, was = state.explode;
  // seen straight on, the parts separate towards you and nothing appears to happen: turn to the exploded angle first
  if (was === 0 && v > 0 && camera && state.view !== 'exploded' && state.view !== 'blueprint') { const f = new THREE.Spherical().setFromVector3(camera.position); if (Math.abs(Math.sin(f.theta)) < 0.6) setView('exploded'); }
  state.explode = v; $('#s-explode').value = v;
});
$('#s-layers').addEventListener('input', e => {
  const v = +e.target.value, was = state.layers;
  if (state.view !== 'movement' && v > 0) setView('movement');
  state.layers = v; $('#s-layers').value = v;
  // seen straight on, lifted layers hide one another: tip the watch so the separation reads
  if (was === 0 && v > 0 && camera) { const f = new THREE.Spherical().setFromVector3(camera.position); if (Math.abs(f.phi - Math.PI / 2) < 0.25) tween = { t: 0, from: { r: f.radius, phi: f.phi, theta: f.theta }, to: { r: baseDist() * 0.92, phi: 1.02, theta: model.frontMovement ? (f.theta > 0 ? 0.8 : -0.8) : f.theta > 0 ? Math.PI - 0.8 : -Math.PI + 0.8 } }; }
});

/* loupe: a second, magnified camera in 3D; a magnified copy of the sheet in Blueprint mode */
const LK = 3.2;
$('#t-loupe').addEventListener('change', e => {
  state.loupe = e.target.checked; loupe.hidden = true; vp.classList.toggle('louping', state.loupe);
  if (controls) controls.enableRotate = !(state.loupe && matchMedia('(pointer: coarse)').matches);
  const lc = loupe.querySelector('.lclone'); lc.innerHTML = '';
  if (state.loupe && state.view === 'blueprint') lc.appendChild($('.bp-sheet').cloneNode(true));
});
let lp = null;
function moveLoupe(e) {
  if (!state.loupe) return;
  const r = vp.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, S = loupe.offsetWidth || 190, lift = e.pointerType === 'touch' ? S * 0.62 : 0;
  if (x < 0 || y < 0 || x > r.width || y > r.height) { loupe.hidden = true; lp = null; return; }
  loupe.hidden = false; loupe.style.transform = `translate(${x - S / 2}px, ${y - S / 2 - lift}px)`; lp = { x, y };
  const bp = state.view === 'blueprint'; loupe.classList.toggle('flat', bp);
  if (bp) {
    const lc = loupe.querySelector('.lclone'); if (!lc.firstChild) lc.appendChild($('.bp-sheet').cloneNode(true));
    const sh = $('#blueprint .bp-sheet').getBoundingClientRect(); lc.firstChild.style.width = sh.width + 'px';
    lc.style.transform = `translate(${S / 2 - (e.clientX - sh.left) * LK}px, ${S / 2 - (e.clientY - sh.top) * LK}px) scale(${LK})`;
    loupe.querySelector('.lcap').textContent = '';
  }
}
vp.addEventListener('pointermove', moveLoupe); vp.addEventListener('pointerdown', moveLoupe);
vp.addEventListener('pointerleave', () => { loupe.hidden = true; lp = null; });

function buildLabels() {
  $('#labels').innerHTML = comps.map(c => `<button type="button" class="lab" data-part="${c.id}" tabindex="-1"><i></i><span>${c.name}</span></button>`).join('');
  labels = $$('#labels .lab').map(el => ({ el, c: byId[el.dataset.part] }));
  $('#labels').addEventListener('click', e => { const b = e.target.closest('.lab'); if (b) select(b.dataset.part, true); });
}
const v3 = () => new THREE.Vector3();
function placeLabels() {
  const w = vp.clientWidth, h = vp.clientHeight, inside = state.view === 'movement', taken = [], small = w < 560;
  for (const l of labels) {
    const g = model.parts[l.c.id]; let show = !!g && state.labels;
    const ext = l.c.group === 'Exterior';
    if (show && !ext && !inside) show = false;
    if (show && ext && state.view === 'movement' && l.c.id !== 'caseback' && l.c.id !== 'dustcover') show = false;
    if (show) {
      const a = l.c.anchor || g.userData.anchor || [0, 0, ext ? 0 : 2.6], p = g.localToWorld(v3().fromArray(a)).project(camera);
      if (l.c.face && cur.explode < 0.5 && Math.sign(camera.position.z) !== l.c.face) show = false;
      if (p.z > 1) show = false;
      if (show) {
        const x = (p.x + 1) / 2 * w, y = (1 - p.y) / 2 * h, r = [x - 8, y - 11, x + 26 + l.c.name.length * 6.4, y + 11];
        const hit = !small && l.c.id !== state.sel && taken.some(t => r[0] < t[2] && r[2] > t[0] && r[1] < t[3] && r[3] > t[1]);
        l.el.classList.toggle('dot', hit); if (!hit) taken.push(r);
        l.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      }
    }
    l.el.hidden = !show;
  }
}
function pickAt(x, y) {
  ray.setFromCamera({ x: x / vp.clientWidth * 2 - 1, y: -(y / vp.clientHeight) * 2 + 1 }, camera);
  const hits = ray.intersectObjects(model.pickables, false).map(h => model.partOf(h.object)).filter(Boolean);
  return hits.find(id => id !== 'crystal') || hits[0] || null;
}

async function start3D() {
  THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const M = await import('./model.js');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(40, 60, 90); scene.add(key);
  const rearKey = new THREE.DirectionalLight(0xfff4e2, 1.8); rearKey.position.set(-50, 60, -90); scene.add(rearKey);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8478, 1.1));
  camera = new THREE.PerspectiveCamera(30, 1, 5, 900);
  model = watch.asset.type === 'gltf' ? await M.loadGLTF(watch) : M.buildProcedural(watch, Draw.face(archive, true), { real: texture(true), tech: texture(false) });
  if (model.frontMovement) VIEWS.movement.theta = 0; // this watch's works face the dial, so the Movement view opens it from the front
  scene.add(model.root);
  ray = new THREE.Raycaster(); ray.params.Line.threshold = 0.35;
  controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.7;
  controls.addEventListener('start', () => { tween = null; $('#hint3d').classList.add('gone'); });
  const size = () => { const w = vp.clientWidth, h = vp.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); const d = baseDist(); controls.minDistance = d * 0.16; controls.maxDistance = d * 2.4; };
  size(); new ResizeObserver(size).observe(vp);
  camera.position.setFromSpherical(new THREE.Spherical(baseDist(), 1.2, 0.5));
  buildLabels(); setStyle('real'); setView('front');
  let down = null;
  canvas.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return; const r = vp.getBoundingClientRect(), id = pickAt(e.clientX - r.left, e.clientY - r.top); if (id) select(id, true); });
  canvas.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || e.buttons) return; const r = vp.getBoundingClientRect(); canvas.style.cursor = pickAt(e.clientX - r.left, e.clientY - r.top) ? 'pointer' : 'grab'; });
  const d0 = new Date(); tv = d0.getHours() * 3600 + d0.getMinutes() * 60 + d0.getSeconds() + d0.getMilliseconds() / 1000;
  window.__bench = { model, camera, state, cur, pickAt, select, setView };
  requestAnimationFrame(frame);
}
let capT = 0;
function frame(ms) {
  const dt = Math.min(0.1, (ms - last) / 1000 || 0); last = ms; requestAnimationFrame(frame);
  tick2d(); if (state.view === 'blueprint') return;
  if (state.run) tv += dt * (state.slow ? 0.05 : 1);
  const k = Math.min(1, dt * 4.5);
  cur.explode += (state.explode - cur.explode) * k; cur.open += (state.open - cur.open) * Math.min(1, dt * 2.2); cur.layers += (state.layers - cur.layers) * k;
  model.setExplode(cur.explode); model.setOpen(cur.open); model.setLayers(cur.layers); model.animate(tv, new Date());
  if (tween) {
    tween.t = Math.min(1, tween.t + dt / 0.9); const e = tween.t < 0.5 ? 2 * tween.t * tween.t : 1 - Math.pow(-2 * tween.t + 2, 2) / 2, f = tween.from, t = tween.to, L = (a, b) => a + (b - a) * e;
    camera.position.setFromSpherical(new THREE.Spherical(L(f.r, t.r), Math.min(Math.PI - 0.02, Math.max(0.02, L(f.phi, t.phi))), L(f.theta, t.theta)));
    if (tween.t >= 1) tween = null;
  }
  controls.update(); renderer.render(scene, camera); placeLabels();
  if (state.loupe && lp && !loupe.hidden) {
    const S = loupe.offsetWidth, w = vp.clientWidth, h = vp.clientHeight, lc = loupe.querySelector('canvas');
    if (!loupeR) { loupeR = new THREE.WebGLRenderer({ canvas: lc, antialias: true }); loupeR.setPixelRatio(Math.min(devicePixelRatio, 2)); loupeR.toneMapping = renderer.toneMapping; loupeCam = camera.clone(); }
    loupeR.setSize(S, S, false); loupeCam.copy(camera); loupeCam.setViewOffset(w, h, lp.x - S / (2 * LK), lp.y - S / (2 * LK), S / LK, S / LK);
    loupeR.render(scene, loupeCam);
    if (ms - capT > 140) { capT = ms; const id = pickAt(lp.x, lp.y); loupe.querySelector('.lcap').textContent = id ? byId[id].name : ''; }
  }
}
start3D().catch(err => { console.error(err); $('#fail').hidden = false; $$('#toolbar button').forEach(b => { if (b.dataset.view !== 'blueprint') b.disabled = true; }); setView('blueprint'); requestAnimationFrame(function f() { tick2d(); requestAnimationFrame(f); }); });

/* ---------- the next watch: an invitation at the end of each panel, so the page never ends in a dead end ---------- */
if (watches.length > 1) {
  const nx = watches[(watches.indexOf(watch) + 1) % watches.length], rest = watches.filter(w => w !== watch && w !== nx)
  const plate = (window.WATCHES || []).find(w => w.id === nx.archiveId)
  const html = `<aside class="wb-next" aria-label="More watches"><p class="kicker">Next on the bench</p>
    <a class="wn-main" href="?watch=${nx.id}">${plate && Draw ? `<span class="wn-art" aria-hidden="true">${Draw.front(plate, {})}</span>` : ''}<span class="wn-txt"><b>${nx.brand} ${nx.model}</b><em>${nx.noRef ? '' : `Ref. ${nx.reference} · `}${nx.year}</em><i>Take it apart</i></span></a>
    ${rest.length ? `<p class="wn-rest"><span>Or try</span>${rest.map(w => `<a href="?watch=${w.id}">${w.short || w.model}</a>`).join('')}</p>` : ''}</aside>`
  document.querySelectorAll('.pane').forEach(p => p.insertAdjacentHTML('beforeend', html))
  const A = { h: 304.3, m: 51.6, s: 216 } // the small drawing shows a fixed ten past ten
  document.querySelectorAll('.wn-art [data-hand]').forEach(el => el.setAttribute('transform', `rotate(${A[el.dataset.hand]})`))
}
