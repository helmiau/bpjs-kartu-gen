# Changelog

All notable changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and versioning
follows [SemVer](https://semver.org/).

## [1.8.3] - 2026-11-15

### Added
- Usage guides on each collapsible panel: Participant Data, Render & Visual
  Settings, and A4 Duplex. A complete guide is available inside About.
- Guides support Indonesian and English, keyboard focus containment, Escape
  dismissal, and focus restoration to the opening button.

## [1.8.2] - 2026-11-15

### Added
- **Paired PDF layout**: the PDF now defaults to one page with the front and
  back cards side by side, each at physical card size (CR80, 85.6 x 54 mm),
  matching a real card sheet. A "PDF layout" option lets you switch back to
  one card per page.

### Changed
- Batch PDF: one page per participant (front + back pair) instead of two pages.


## [1.8.1] - 2026-11-15

### Fixed
- **Mobile header menu leaking into desktop**: the hamburger button was hidden
  on desktop again (it was being overridden by the generic icon-button rule),
  and the dropdown stays closed until opened.

### Changed
- Header order on desktop and in the mobile menu: language switch, theme,
  About. Each mobile menu item now carries an icon.


## [1.8.0] - 2026-11-15

### Added
- **About modal**: an info button in the header opens an "About" dialog with
  the disclaimer, privacy note, version, a changelog button, and the source
  link. The footer was removed; its content now lives in this dialog.

### Changed
- Header: the changelog button was replaced by the About button; the GitHub
  link moved into the About dialog.
- Mobile: the right-side header controls collapse into a menu (About, theme,
  language).


## [1.7.9] - 2026-11-14

### Changed
- Changelog button moved from the left (brand area) to the right side of the
  header, grouped with the language/theme/GitHub controls.

## [1.7.8] - 2026-11-14

### Fixed
- **Changelog modal header**: the document title ("# Changelog") and the
  opening Keep a Changelog/SemVer paragraph no longer appear in the modal;
  rendering starts at the first version heading.
- Service worker now always fetches `.md` files from the network, so the
  changelog is never served stale from cache (cache bumped to v3).

## [1.7.7] - 2026-11-14

### Added
- **Changelog button in the header**: a document icon next to the brand
  opens the same changelog modal as the footer version number.

### Fixed
- Header layout: the changelog icon aligns inline with the brand title.

## [1.7.6] - 2026-11-14

### Fixed
- **Preview tabs in dark mode**: the active tab text used near-white text on
  a light-green accent (contrast ~1.8, nearly unreadable). Now uses
  `--accent-text` (dark green), contrast 7.73.

## [1.7.5] - 2026-11-14

### Fixed
- **Missing CSS**: the PWA commit (1.7.3) accidentally replaced the
  `<link rel="stylesheet">` line with the manifest, so the live page rendered
  unstyled. The CSS link is restored.
- Service worker: bumped cache to v2 + `skipWaiting` + `clients.claim` so
  browsers holding the stale HTML immediately fetch the new version.

## [1.7.4] - 2026-11-14

### Added
- **Direct A4 duplex print**: a new button opens the browser print dialog
  without saving a PDF first.
- **Local persistence**: the single form and batch queue are saved on the
  device; they survive page reloads.
- **Batch export progress**: a progress bar + **Cancel** button while building
  the bulk PDF.
- **Direct paste into the dropzone**: pasted QR images are scanned directly;
  pasted text is processed as TSV/CSV/base64.
- **Offline PWA**: installable and usable without network after first load
  (manifest + service worker).
- **QR recovery**: names of files whose QR failed to decode are shown
  explicitly in the status.
- **Changelog modal**: click the version number in the footer to read the
  release notes.

### Fixed
- Three-line address: the font shrinks automatically so it is not clipped and
  does not overlap the row below (preview and PDF stay consistent).
- The "Clear" buttons are now clearly visible (red outline + icon), with AA
  contrast on both light and dark themes.

## [1.7.0] - 2026-11-13

### Added
- **A4 duplex print layout**: three modes (side-by-side, vertical, full-sheet
  grid), crop marks, fold line, A4 duplex PDF export, batch A4 export.
- **Preview tabs**: Front side / Back side / A4 duplex simulation; prev/next
  card navigation for the batch queue.
- **COPY watermark** + **automatic uppercase** on names (toggle in Render &
  Visual Settings).
- Micro **toast notifications**; explicit digit **labels** (13/16) on form
  fields.
- **Batch**: Import file / Paste text tabs with per-line auto-detection
  (TSV/CSV or base64).

## [1.6.0] - 2026-11-12

### Added
- Render & Visual Settings as a standalone panel (black-and-white copy, raster
  PDF, watermark, auto-uppercase).
- Indonesian/English UI translation with a language toggle.
- Downloadable CSV/TSV/XLSX templates; repeated add from base64 code or QR
  images.

## [1.5.0] - 2026-11-12

### Added
- Batch processing: import CSV/TSV/XLSX, queue table, select/remove, bulk PDF
  export, two-panel preview.
- UI rework following the design (two columns, collapsible panels).

## [1.4.0] - 2026-11-11

### Added
- 300 dpi export; editable vector-text PDF.
- Standardized export filename: `KARTU_<number>-BPJS[_FRONT|_BACK].<ext>`.
- Export toggles: black-and-white copy & raster PDF.
- Web logo & icon replaced with the BPJS Kesehatan logo.

## [1.3.0] - 2026-11-10

### Added
- Web version shown in the footer; asset cache-busting.
- Dark theme with a header switch, saved on the device.
- UI redesign: single card-on-top column, one primary action, deferred
  validation.

## [1.2.0] - 2026-11-09

### Added
- Both template sides upgraded to high resolution.
- QR scan from image / camera; fill the form from a base64 code.

## [1.1.0] - 2026-11-08

### Added
- Two-side card rendering matching the official layout (labels, colon, values,
  Code 128 barcode).
- Single-side JPG / PDF export.

## [1.0.0] - 2026-11-08

### Added
- First release: participant form, card preview, JPG/PDF export.
  Everything runs in the browser, no server.
