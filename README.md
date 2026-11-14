# BPJS Card Generator

A single-page web app that builds BPJS Kesehatan participant cards
(Kartu Indonesia Sehat) directly on your device. No server, no data upload:
everything runs in the browser.

> **Warning:** generated cards are visual replicas for practice or preview.
> They are **not legally valid** and are not verified by BPJS Kesehatan.

## Features

- **Three data-entry paths**
  - Paste a base64 string manually
  - Scan a QR code from an image file
  - Scan a QR code with the device camera
  - Open the page with `?data=<base64>` to auto-fill
- **Manual form** with 8 participant fields and validation
- **Card preview** for front and back sides
- **Export** per-side JPG and a combined PDF (physical 85.6 mm size), 300 dpi
  - **Black-and-white copy**: JPG & PDF rendered monochrome (grayscale)
  - **Raster PDF**: text burned into the image (not editable); the default
    PDF keeps vector text that can be selected/edited
- **Local print history** (localStorage), clearable
- **Batch mode**: import CSV/TSV/XLSX or QR images, a queue table with
  select/remove, batch PDF export with progress bar and cancel button
- **A4 duplex layout**: side-by-side, vertical, or full-sheet grid; crop
  marks and fold line; save or print the A4 duplex PDF
- **Batch source tabs**: "Import file" and "Paste text" with per-line
  auto-detection (TSV/CSV or base64)
- **Direct print**: open the browser print dialog for the A4 duplex sheet
- **Local persistence**: the single form and batch queue survive reloads
- **Offline PWA**: installable, works without network after first load
- **Changelog modal**: click the version number (or the header icon) to read
  `CHANGELOG.md`

The front side carries a **Code 128 barcode** with the 13-digit card number
(like the official BPJS card), optional via a checkbox, enabled by default.
QR codes are deliberately not used on the card: a QR holding the full base64
JSON (~324 characters) needs 65 modules and a ~260-pixel block to scan back,
covering nearly all card text. Data still enters via paste, image, camera, or
URL; `jsQR` is used to read it.

## Usage

Open `index.html` through any static server:

```bash
npx http-server . -p 8080 -c-1
# then open http://127.0.0.1:8080/
```

Or open `index.html` directly in the browser (camera scanning requires HTTPS
or `localhost`).

Example URL fill:

```
http://127.0.0.1:8080/?data=eyJub21vckthcnR1IjoiMDAwMDAwMDAwMDAwMCIs...
```

## File structure

```
index.html              main page
404.html                not-found page
manifest.json           PWA manifest
sw.js                   service worker (offline cache)
CHANGELOG.md            version history
AGENTS.md               agent/dev operating manual
.nojekyll               disable Jekyll processing on GitHub Pages
assets/
  css/style.css         UI styles
  img/                  card templates (PNG) + BPJS logo & icons
js/
  app.js                orchestration: form, buttons, URL, history, batch
  card.js               two-side card rendering
  a4.js, a4-constants.js  A4 duplex sheet composition
  scanner.js            QR scanner from image & camera
  exporter.js           JPG export, PDF assembly, batch, A4
  pdf-text.js           PDF vector text layer (editable labels/values)
  payload.js            base64 <-> JSON (tolerant of key variants)
  date.js               date conversion DD-MM-YYYY <-> YYYY-MM-DD
  validate.js           form field validation
  pdf-size.js           PDF page size + 300 dpi scale
  schema.js             card layout (pixel coordinates)
  batch.js              CSV/TSV/XLSX parsing, mapping, validation, classifier
  templates.js          downloadable CSV/TSV/XLSX templates
  i18n.js               Indonesian/English UI strings
  version.js            app version (single source for UI + cache-bust)
  history.js            localStorage print history
test/                   Vitest unit tests
```

## Testing

```bash
npm install
npm test
```

98 unit tests cover base64 conversion, key-variant tolerance, date conversion,
field validation, DPI scaling, PDF text layout, batch parsing, classifier,
filename sanitization, and font shrink-to-fit.

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Open **Settings → Pages**.
3. Choose **Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
4. Wait a moment, then open `https://<user>.github.io/<repo>/`.

There is no build step. Libraries are vendored, so the page loads no scripts
from third-party CDNs at runtime.

## Web version

The version number shows in the footer (`v1.7.7`) and is logged to the browser
console. The single source is `js/version.js` (`APP_VERSION`) and
`package.json`. To release a new version:

1. Bump `APP_VERSION` in `js/version.js` and `version` in `package.json`.
2. Match the `?v=` query on `assets/css/style.css`, the `assets/vendor/*`
   libraries, and `js/app.js` in `index.html` to the new number.
3. Push; the browser fetches fresh assets because their URLs changed.

The `?v=` query on assets keeps the browser cache (GitHub Pages/`max-age=600`)
from serving stale files after a release. The service worker cache name
(`CACHE_NAME` in `sw.js`) should also be bumped on breaking changes.

## Technical notes

- **No backend.** No outbound `fetch`; the only requests are assets from the
  repo itself.
- **XSS-safe.** All values go through `textContent`, never `innerHTML`.
- **Code 128 barcode, not QR.** The source site used a PHP-generated Code 39
  (`dynamic_barcode.php`) that dies on GitHub Pages. A QR holding the full
  base64 JSON needs a ~260-pixel block to scan back, covering almost all card
  text. So the card uses Code 128 with the card number (generated by
  `JsBarcode`, optional, default on), and `jsQR` reads QR from image or camera.
- **Card size 350 × 222 pixels**, ratio 1.579 following the official BPJS card
  (473.8 × 300 pt). Export (JPG & PDF) is computed so the raster comes out at
  **exactly 300 dpi** when printed at card size (longest side 85.6 mm), about
  1011 × 641 pixels, capped at 36 megapixels so mobile browsers do not run out
  of memory. See `pdf-size.js` (`exportScaleForDpi`).
- **Two-layer PDF: raster background + vector text.** The background (template
  + barcode) is drawn as a 300 dpi image, then labels and participant values
  are written as vector text objects using the standard Helvetica font (no
  embedded font file). Card text is therefore **selectable and editable** in a
  PDF reader. See `pdf-text.js`.
- **Background drawn directly, not html2canvas.** The original template
  (1516 × 960 px per side, no DPI metadata) is drawn to a 300 dpi canvas with
  the browser's smooth scaling, then the SVG barcode is rasterized at full
  size. html2canvas previously downscaled the background to 350 px and then
  upscaled it, blurring the terms text; the direct path keeps it sharp.
  Participant text is not part of the PNG, so there is no double text.
- **BPJS logo.** `assets/img/bpjs-logo.svg` (lockup) and `bpjs-mark.svg`
  (square mark for favicon/header) come from Wikimedia Commons (BPJS
  Kesehatan logo). The logo is a BPJS Kesehatan trademark; it is used here only
  for the context of a replica/preview tool, not as a claim of affiliation.
