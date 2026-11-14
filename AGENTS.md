# AGENTS.md

Operating manual for AI coding agents (and humans) working on this repo.
This supersedes the old `PRD.md`. It describes how the code is **now**, not the
original plan.

## 1. What this project is

A single-page, client-only web app that renders BPJS Kesehatan participant
cards (front + back) and exports them as JPG/PDF. Everything runs in the
browser: no server, no backend, no data leaves the device.

- **Stack:** plain ES modules + vanilla JS. No framework, no bundler, no build.
- **Tests:** Vitest (`npm test`).
- **Hosting:** GitHub Pages from branch `main`, root folder. Custom domain
  `www.helmiau.com/bpjs-kartu-gen/`.
- **Libraries:** vendored under `assets/vendor/` (`JsBarcode`, `jsQR`). Never
  add a CDN `<script>`; download and vendor instead.

## 2. Ground rules (do these every time)

1. **Verify before claiming done.** Run `npm test` and, for UI changes, load
   the page in a real browser and check computed styles / screenshots.
2. **No build step, no new dependency** unless truly required. The whole app
   ships as static files.
3. **XSS safety:** all user data enters the DOM via `textContent`, never
   `innerHTML`. When you write helpers that touch HTML, escape first
   (`escapeHtml` in `app.js`).
4. **Version bump discipline:** `js/version.js` `APP_VERSION`, `package.json`
   `version`, and every `?v=` query in `index.html` must match. Bump all three
   in one edit (see §7).
5. **Lint reality check:** there is no linter configured. `node --check <file>`
   is the syntax gate for each touched JS file.
6. **Changelog:** every release adds a `CHANGELOG.md` entry (English, Keep a
   Changelog format) and the version shown in the footer.

## 3. Repository layout

```
index.html            single page (header, input panel, preview panel, footer, modal)
404.html              not-found page (mirror version refs if edited)
manifest.json         PWA manifest
sw.js                 service worker (offline; bump CACHE_NAME on breaking changes)
CHANGELOG.md          version history (English)
AGENTS.md             this file
.nojekyll             keep GitHub Pages from running Jekyll

assets/css/style.css  all styling; design tokens in :root and [data-theme="dark"]
assets/img/           card templates (front/back PNG), BPJS logo + icons
assets/vendor/        JsBarcode.all.min.js, jsQR.js (vendored, versioned by ?v=)

js/
  app.js        orchestration: form, preview, tabs, URL, export buttons,
                history, batch queue, persistence, changelog modal
  card.js       renders one side of the card into the DOM (uses schema.js)
  schema.js     card layout: CARD_WIDTH/HEIGHT, element coordinates, barcode block
  a4.js         composeA4Single / composeA4Sheet (A4 duplex sheets)
  a4-constants.js  A4 page + card placement constants (300 dpi)
  exporter.js   JPG export, PDF assembly (vector text), batch PDF, A4 PDF
  pdf-text.js   PDF vector-text layer: layoutSideText, fitFontSize, metrics
  pdf-size.js   PDF page size + export DPI scale (exportScaleForDpi)
  payload.js    base64 <-> JSON, tolerant key matching
  date.js       DD-MM-YYYY <-> YYYY-MM-DD
  validate.js   form field validation
  scanner.js    QR scan from image file & camera
  batch.js      CSV/TSV/XLSX parse, map, validate, classifyBatchLines
  templates.js  downloadable CSV/TSV/XLSX templates
  i18n.js       ID/EN dictionaries; t(key, params)
  history.js    localStorage print history
  version.js    APP_VERSION (single source)

test/           Vitest specs (mirror js/ module names)
```

## 4. Data model

Participant object (all strings):

| field          | label           | required | rule |
|----------------|-----------------|----------|------|
| `nomorKartu`   | No. Kartu       | yes      | 13 or 14 digits |
| `nama`         | Nama Peserta    | yes      | max 100 chars |
| `alamat`       | Alamat          | yes      | max 200 chars |
| `tglLhr`       | Tanggal Lahir   | yes      | DD-MM-YYYY or YYYY-MM-DD |
| `nik`          | NIK             | yes      | 16 or 17 digits |
| `fktp`         | Faskes 1        | yes      | max 100 chars |
| `fktpGigi`     | Faskes Gigi     | no       | max 100 chars, form-only (not printed) |
| `statusPeserta`| Status Peserta  | no       | max 20 chars, form-only (not printed) |

Base64 payload is JSON of these fields, key names case-insensitive with
hyphens/underscores ignored (`nomor-Kartu` == `nomorKartu`). See
`js/payload.js`.

## 5. Card layout (schema.js) — authoritative

- Canvas: **350 × 222 px** (ratio 1.579, matches official 473.8 × 300 pt).
- Front side uses the **left** template half; back uses the **right** half.
- Text elements use a fixed label column (67 px) + separator (9 px), so values
  start at x = 115 in the PDF layer (`pdf-text.js`).
- Alamat block is taller (y=106, h=24). Values longer than the block shrink
  the font (`fitFontSize`) so they never clip or overlap the next row.
- Barcode block: `{ x:35, y:62, width:133, height:17 }` (Code 128 of the card
  number; optional, default on).
- `fktpGigi` and `statusPeserta` are captured in the form but not printed.

Do not hardcode coordinates elsewhere; read them from `schema.js`.

## 6. Export pipeline

- **JPG** (`exporter.js`): one file per side, rendered at 300 dpi.
- **PDF** (`exporter.js` + `pdf-text.js`): two-layer. Raster background
  (template + barcode) at 300 dpi + **vector** text layer using standard
  Helvetica, so card text is selectable/editable. Optional raster-only PDF
  burns text into the image.
- **A4 duplex** (`a4.js` + `exporter.js`): compose A4 sheets (side-by-side,
  vertical, grid), crop marks + fold line; save PDF or print via hidden iframe.
- **Batch** (`exportBatchPdf`): iterates selected queue rows; `onProgress(done,
  total)` may return `false` to cancel.

If you change pixel geometry, update both the DOM render (`card.js`) and the
PDF text layout (`pdf-text.js`) so preview and PDF stay identical.

## 7. Release checklist

1. Make the change; run `node --check` on touched JS.
2. `npm test` (currently 98 tests) must pass.
3. Bump version in **all three** places:
   - `js/version.js` → `APP_VERSION`
   - `package.json` → `version`
   - `index.html` → every `?v=` on CSS, vendor scripts, and `js/app.js`
4. If offline behaviour changed, bump `CACHE_NAME` in `sw.js` and keep
   `skipWaiting` + `clients.claim`.
5. Add a `CHANGELOG.md` entry (English).
6. Load the page in a browser; verify no console errors and CSS applied
   (`[...document.styleSheets]` should include `style.css`).
7. Commit with a focused message; push to `main`; wait for Pages deploy.

## 8. Service worker / offline

- Cache-first for same-origin GET; runtime-caches anything fetched.
- `install` caches core shell (`./`, `index.html`, `style.css`, icons).
- `activate` deletes old caches and calls `clients.claim()`.
- **Cache-busting matters:** after deploy, a browser may serve old HTML from
  the SW cache. A version bump changes asset URLs, so a reload after activate
  fetches fresh files.

## 9. i18n

- All user-facing strings go through `t(key)` from `js/i18n.js`; add keys to
  **both** `id` and `en` dictionaries.
- Static markup uses `data-i18n`, `data-i18n-aria`, `data-i18n-title`,
  `data-i18n-placeholder`. Dynamic code calls `t('key', {param})`.

## 10. Security & privacy posture

- No network calls except same-origin assets. Never add telemetry or
  fetch to a third party.
- Participant data (NIK, card number) stays in memory + `localStorage` only.
- The card is a **visual replica**: it has no legal validity and is not
  verified against BPJS servers. Do not add claims that imply otherwise.
- Do not reintroduce a donation/payment gate or a backend.

## 11. Read before editing (per area)

| Touching…              | Read first |
|------------------------|-----------|
| Card layout / render   | `js/schema.js`, `js/card.js`, `assets/css/style.css` (`.card-*`) |
| PDF output             | `js/pdf-text.js`, `js/pdf-size.js`, `js/exporter.js` |
| A4 duplex              | `js/a4.js`, `js/a4-constants.js`, `js/exporter.js` |
| Batch                  | `js/batch.js`, `js/app.js` (bindBatch, exportBatch) |
| Styles / themes        | `assets/css/style.css` (`:root`, `[data-theme="dark"]` tokens) |
| Version / cache        | `js/version.js`, `index.html` (`?v=`), `sw.js` |
| Changelog UX           | `js/app.js` (bindChangelog), `CHANGELOG.md` |

## 12. Known constraints / gotchas

- **No framework**: event wiring is manual in `app.js` `bind()`. Keep handlers
  idempotent and null-guarded (`document.getElementById(...)?.addEventListener`).
- **DOM vs PDF parity**: any font-size or wrapping rule must match in both
  `card.js` (CSS) and `pdf-text.js` (Helvetica metrics). The address block is
  the historical trouble spot (multi-line + shrink-to-fit).
- **300 dpi memory cap**: exports are capped at 36 MP so mobile browsers do not
  crash (`pdf-size.js`).
- **Theme tokens**: active tab/button text uses `--accent-text`, not `--text`,
  because accents are light in dark mode (contrast trap).
- **GitHub Pages cache** (`max-age=600`): after a release, hard-reload; the
  `?v=` bump is what actually forces fresh assets.

## 13. Definition of done

- Behaviour implemented as specified; edge cases (empty/long/invalid input,
  cancel, offline, reload) handled.
- `node --check` clean on touched files; `npm test` green.
- Version bumped everywhere; `CHANGELOG.md` updated.
- Verified in a real browser (light + dark), no console errors, CSS applied.
- Committed and pushed to `main`; live site loads correctly.
