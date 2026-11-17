# The Horological Archive

Twenty vintage wristwatches drawn as engineering plates. Every watch keeps the visitor's own system time, and an examination asks them to name each one.

A static site: no build step, no keys, no accounts.

- `index.html`, `styles.css` — the page and its look
- `data.js` — the twenty watches. Correct a figure here and every drawing updates.
- `draw.js` — draws each view (front, profile, caseback, exploded, movement) from the data
- `app.js` — the examination, the archive, the live clock and the figure viewer

## The Workbench

`workbench.html` is an interactive bench for one watch at a time: a 3D model you can turn, open and take apart, a component explorer, a loupe, and a blueprint sheet.

- `workbench.html`, `workbench.css` — the page
- `workbench/app.js` — the interface and viewport
- `workbench/model.js` — builds or loads the 3D model
- `workbench/watches/` — one record per watch, plus `index.js`, which lists them

Three.js loads from a CDN (jsDelivr), pinned to one version in the page's import map. There is still no build step.

### What is and is not real

No scan, factory model or photograph of the Speedmaster is bundled. The 3D model is built in code from published dimensions, and the calibre 321 is a schematic layout. Gear rates, the 18,000 A/h beat and the stepping of the train are physically correct; shapes and positions are not factory geometry. Every fact in a record is marked `D` (documented), `E` (estimated) or `I` (interpretation) and the page shows the mark. "Studio" is a render, not photography.

### Adding a watch to the Workbench

1. Copy `workbench/watches/speedmaster-105003.js` to a new file and edit it. A record holds:
   - `id`, `brand`, `model`, `reference`, `year`, `movement`
   - `archiveId` — the matching `id` in `data.js`, used for the blueprint sheet and the dial artwork
   - `specs` — rows of `[label, value, status]`
   - `history` — sections of `{ h, s, p }` (heading, status, paragraph)
   - `components` — one entry per part: `id`, `name`, `group`, `status`, `beginner`, `horologist`, `fn`, `material`, `location`, `significance`, `related`, and optionally `anchor: [x, y, z]` (where its label sits, in millimetres) and `face` (1 if only visible from the front, -1 from the back)
   - `asset` — how the 3D model is made (below)
   - `images` — reserved for photographs; empty today
2. Add the record to the list in `workbench/watches/index.js`. The page opens on the first record and shows a picker when there is more than one; each watch has its own address, `/workbench?watch=<id>`. On the live site leave off `.html`: the server redirects `.html` addresses and drops the watch choice when it does.
3. For a coded model, set `asset.params`. Beyond the measurements, the builder understands `chrono: false` (no pushers, registers or chronograph works; the centre hand becomes running seconds), `rotor: true` (automatic), `crownGuards: true`, `dustCover: false`, `hands: 'mercedes'` and `plate: 'steel'` for a silver-coloured movement.

### Using a real 3D asset (.glb)

Put the file in `workbench/assets/` and set, in the record:

    asset: { type: 'gltf', url: 'workbench/assets/my-watch.glb', scale: 1, note: 'Where the model came from.' }

Then give each component the name of its node in the file and how far it moves when exploded:

    { id: 'crystal', node: 'Crystal', explode: [0, 0, 29], ... }

Model in millimetres with the dial facing +Z and twelve o'clock at +Y. Nodes named `hand-hour`, `hand-minute` and `hand-seconds` follow the clock. The loader is written but has not been run against a real file yet, so expect to adjust it with the first asset.

## Run it locally

    python3 -m http.server 8811

Then open http://localhost:8811

## Deploy on Railway

Connect this repository in Railway. `railway.json` holds the start command; nothing else needs setting.

## Accuracy

The drawings are modern interpretations made from published specifications. They are not manufacturer documents. "≈" marks an approximate figure and "n.v." one that could not be verified. Movement figures are schematics.
