# The Shape of Time

Twenty vintage wristwatches drawn as engineering plates. Every watch keeps the visitor's own system time, and an examination asks them to name each one.

A static site: no build step, no keys, no accounts.

- `index.html`, `styles.css`: the page and its look
- `data.js`: the twenty watches. Correct a figure here and every drawing updates.
- `draw.js`: draws each view (front, profile, caseback, exploded, movement) from the data
- `app.js`: the examination, the archive, the live clock and the figure viewer

## The Workbench

`workbench.html` is an interactive bench for one watch at a time: a 3D model you can turn, open and take apart, a component explorer, a loupe, and a blueprint sheet.

- `workbench.html`, `workbench.css`: the page
- `workbench/app.js`: the interface and viewport
- `workbench/model.js`: builds or loads the 3D model
- `workbench/watches/`: one record per watch, plus `index.js`, which lists them

Three.js loads from a CDN (jsDelivr), pinned to one version in the page's import map. There is still no build step.

### What is and is not real

No scan, factory model or photograph of the Speedmaster is bundled. The 3D model is built in code from published dimensions, and the calibre 321 is a schematic layout. Gear rates, the 18,000 A/h beat and the stepping of the train are physically correct; shapes and positions are not factory geometry. Every fact in a record is marked `D` (documented), `E` (estimated) or `I` (interpretation) and the page shows the mark. "Studio" is a render, not photography.

### Adding a watch to the Workbench

1. Copy `workbench/watches/speedmaster-105003.js` to a new file and edit it. A record holds:
   - `id`, `brand`, `model`, `reference`, `year`, `movement`
   - `archiveId`: the matching `id` in `data.js`, used for the blueprint sheet and the dial artwork
   - `specs`: rows of `[label, value, status]`
   - `history`: sections of `{ h, s, p }` (heading, status, paragraph)
   - `components`: one entry per part: `id`, `name`, `group`, `status`, `beginner`, `horologist`, `fn`, `material`, `location`, `significance`, `related`, and optionally `anchor: [x, y, z]` (where its label sits, in millimetres) and `face` (1 if only visible from the front, -1 from the back)
   - `asset`: how the 3D model is made (below)
   - `images`: reserved for photographs; empty today
2. Add the record to the list in `workbench/watches/index.js`. The page opens on the first record and shows a picker when there is more than one; each watch has its own address, `/workbench?watch=<id>`. On the live site leave off `.html`: the server redirects `.html` addresses and drops the watch choice when it does.
3. For a coded model, set `asset.params`. Beyond the measurements, the builder understands `chrono: false` (no pushers, registers or chronograph works; the centre hand becomes running seconds), `rotor: true` (automatic), `crownGuards: true`, `dustCover: false`, `hands: 'mercedes'` or `'dauphine'`, `plate: 'steel'` for a silver-coloured movement, `metal: 'gold'`, `subSeconds: 6` (seconds register at six, with the fourth wheel placed beneath it), `bezelInsert: false` for a plain bezel, `spacer: false`, and the proportions `wall`, `dome`, `crownR` and `lugThick`. `thickness` scales the whole stack. `beatsPerHour` and `escapeTeeth` set the escapement's real rate, `chronoHand: 'red'` colours the stopwatch hand, `handKind: 'steelDark'` gives dark hands for a light dial, and `subOffset` places the registers. `chrono` and `rotor` can be combined for an automatic chronograph.

### Using a real 3D asset (.glb)

Put the file in `workbench/assets/` and set, in the record:

    asset: { type: 'gltf', url: 'workbench/assets/my-watch.glb', scale: 1, note: 'Where the model came from.' }

Then give each component the name of its node in the file and how far it moves when exploded:

    { id: 'crystal', node: 'Crystal', explode: [0, 0, 29], ... }

Model in millimetres with the dial facing +Z and twelve o'clock at +Y. Nodes named `hand-hour`, `hand-minute` and `hand-seconds` follow the clock. The loader is written but has not been run against a real file yet, so expect to adjust it with the first asset.

## The History page

`history.html` is one long scroll through seven eras of watchmaking, each with its own look, opening with a sequence that shows one watch changing across five centuries.

- `history.html`, `history.css`: the page and the seven visual styles
- `history-data.js`: all the text (eras, passages, comparisons and the numbered sources). Edit this to correct or add history.
- `history.js`: the period drawings the archive lacks (drum watch, verge and railroad pocket watches, trench watch, quartz, LED, glass-back, smartwatch) and the scroll behaviour

A passage with `c: [n]` cites source `n` in the list at the foot of the page. Passages without one repeat the general literature and were not individually checked. No photographs are used; drawings marked "illustrative reconstruction" show a type, not a specific surviving watch.

## The Nature of Time

`time.html` looks past watches to time itself: a live solar clock, then five smaller studies (rhythm, one second inside a watch, how the second is defined, sound, and the cycles of day, month and year).

- `time.html`, `time.css`: the page, its text and its look
- `time-core.js`: the astronomy (sun position, sunrise and sunset, equation of time, sidereal time, moon phase), the list of fallback cities, and the solar dial itself. The homepage loads this too.
- `time.js`: the page's behaviour. Each study is a separate numbered block, so another can be added without touching the rest.
- `sol.css`: the dial's styles, shared with the homepage

The solar maths follows the NOAA Global Monitoring Laboratory method and was checked against published sunrise and sunset times for London, New York and Sydney, and against the known extremes of the equation of time. It is good to about a minute at ordinary latitudes. Location is optional: without it the page picks a large city in the visitor's time zone. Nothing about a visitor's position is sent anywhere. All sound is synthesised in the browser and plays only when a button is pressed.

## Run it locally

    python3 -m http.server 8811

Then open http://localhost:8811

## Deploy on Railway

Connect this repository in Railway. `railway.json` holds the start command; nothing else needs setting.

## Accuracy

The drawings are modern interpretations made from published specifications. They are not manufacturer documents. "≈" marks an approximate figure and "n.v." one that could not be verified. Movement figures are schematics.
