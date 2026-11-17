# The Horological Archive

Twenty vintage wristwatches drawn as engineering plates. Every watch keeps the visitor's own system time, and an examination asks them to name each one.

A static site: no build step, no keys, no accounts.

- `index.html`, `styles.css` — the page and its look
- `data.js` — the twenty watches. Correct a figure here and every drawing updates.
- `draw.js` — draws each view (front, profile, caseback, exploded, movement) from the data
- `app.js` — the examination, the archive, the live clock and the figure viewer

## Run it locally

    python3 -m http.server 8811

Then open http://localhost:8811

## Deploy on Railway

Connect this repository in Railway. `railway.json` holds the start command; nothing else needs setting.

## Accuracy

The drawings are modern interpretations made from published specifications. They are not manufacturer documents. "≈" marks an approximate figure and "n.v." one that could not be verified. Movement figures are schematics.
