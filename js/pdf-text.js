/**
 * Lapisan teks vektor untuk PDF.
 *
 * PDF raster (satu JPEG per halaman) membuat teks peserta tidak bisa
 * diseleksi atau diedit. Modul ini menghitung posisi setiap label, titik dua,
 * dan nilai sebagai teks asli, memakai font standar PDF (Helvetica) yang
 * tidak butuh berkas font tertanam sehingga tetap bisa diedit pembaca PDF.
 *
 * Satuan masukan: piksel kanvas kartu (lihat schema.js). Satuan keluaran:
 * poin PDF (1 pt = 1/72 inci) pada halaman `pdfPageSizeMm`. Pemetaan linier:
 *   pt = px * (pageWidthPt / canvasWidth)
 * sehingga posisi teks di halaman sama persis dengan pratinjau.
 */

/**
 * Lebar kolom label (piksel) sesuai .card-text di style.css; <label col 67px>
 * + gap 2px + lebar separator . (9px) + gap 2px = nilai di x + 80.
 */
const LABEL_COLUMN = 67;
const COLUMN_GAP = 2;
const SEPARATOR_WIDTH = 9;
/** Metrik lebar Helvetica (per 1000 unit em) untuk substring ASCII 32..126. */
const HELVETICA_WIDTHS = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584
];

/** Metrik lebar Helvetica-Bold (per 1000 em), ASCII 32..126. */
const HELVETICA_BOLD_WIDTHS = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584
];

/** Lebar teks (1/1000 em) untuk Helvetica regular atau bold. */
function helveticaWidthUnits(text, bold = false) {
  const table = bold ? HELVETICA_BOLD_WIDTHS : HELVETICA_WIDTHS;
  let total = 0;
  for (const ch of String(text)) {
    const code = ch.codePointAt(0);
    if (code >= 32 && code <= 126) total += table[code - 32];
    else total += table[' '.charCodeAt(0) - 32];
  }
  return total;
}

/**
 * Lebar teks (dalam piksel kanvas) untuk Helvetica pada ukuran font tertentu.
 * `bold=true` memakai metrik Helvetica-Bold yang lebih lebar.
 */
export function measureHelveticaPx(text, fontSizePx, bold = false) {
  return (helveticaWidthUnits(text, bold) / 1000) * fontSizePx;
}

/**
 * Escape teks untuk string literal PDF (tanda kurung & garis miring).
 * Karakter non-ASCII diganti "?" agar tetap sah dengan WinAnsi tanpa tabel
 * encoding besar; teks ASCII (huruf Latin, digit) tidak terpengaruh.
 */
function pdfString(text) {
  return String(text)
    .replace(/[^\x20-\x7E]/g, '?')
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)');
}

/**
 * Bungkus nilai panjang menjadi beberapa baris agar muat dalam lebar blok.
 * Membandingkan lebar glyph Helvetica dengan `maxWidthPx`.
 */
export function wrapToWidth(text, fontSizePx, maxWidthPx) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (measureHelveticaPx(candidate, fontSizePx) <= maxWidthPx || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}
/**
 * Ukuran font efektif agar nilai yang dibungkus muat dalam tinggi blok.
 * Dipakai PDF (layoutSideText) dan pratinjau DOM (card.js) agar konsisten.
 * @param {string} value nilai yang akan dirender
 * @param {number} fontSize ukuran font dasar (px)
 * @param {number} maxWidthPx lebar maksimum nilai (px)
 * @param {number} blockHeight tinggi blok (px)
 * @returns {number} ukuran font efektif (>= 7)
 */
export function fitFontSize(value, fontSize, maxWidthPx, blockHeight) {
  let size = fontSize;
  const maxLines = Math.max(1, Math.floor(blockHeight / (fontSize * 1.2)));
  while (size > 7 && wrapToWidth(String(value), size, maxWidthPx).length > maxLines) {
    size -= 0.25;
  }
  return size;
}

/**
 * Bangun daftar baris teks untuk satu sisi kartu.
 *
 * @param {object} side deskripsi sisi dari SCHEMA (punya `elements`)
 * @param {object} formData data peserta (nilai mentah seperti di form)
 * @param {(el:object)=>string} valueOf fungsi pengambil nilai bersih per elemen
 * @returns {Array<{text:string, x:number, y:number, fontSize:number, bold:boolean}>}
 *   Koordinat dalam piksel kanvas; `y` adalah baseline (bukan tepi atas).
 */
export function layoutSideText(side, formData, valueOf) {
  if (!side || !Array.isArray(side.elements)) return [];
  const rows = [];
  for (const element of side.elements) {
    if (element.type !== 'text') continue;
    const prefix = String(element.prefix || '');
    const value = String(valueOf ? valueOf(element) : '');
    const bold = element.fontWeight === 'bold';
    const lineHeight = element.fontSize * 1.2;
    const baselineOffset = element.fontSize * 0.905;
    const sepX = element.x + LABEL_COLUMN + COLUMN_GAP;
    const valueX = sepX + SEPARATOR_WIDTH + COLUMN_GAP;
    const baselineY = element.y + baselineOffset;
    rows.push({ text: prefix, x: element.x, y: baselineY, fontSize: element.fontSize, bold: false });
    rows.push({ text: ':', x: sepX, y: baselineY, fontSize: element.fontSize, bold });
    const valueWidth = Math.max(
      element.fontSize,
      element.x + element.width - valueX
    );
    // Shrink-to-fit: bila nilai dibungkus melebihi tinggi blok (mis. alamat
    // 3 baris), perkecil font hingga seluruh baris muat. Label, titik dua,
    // dan nilai memakai ukuran yang sama agar tetap sebaris.
    const effectiveFontSize = fitFontSize(value, element.fontSize, valueWidth, element.height);
    const valueLines = wrapToWidth(value, effectiveFontSize, valueWidth);
    const valueLineHeight = effectiveFontSize * 1.2;
    valueLines.forEach((line, index) => {
      rows.push({
        text: line,
        x: valueX,
        y: baselineY + index * valueLineHeight,
        fontSize: effectiveFontSize,
        bold
      });
    });
  }
  return rows;
}

/**
 * Ubah satu baris teks menjadi operator PDF (BT ... ET) dalam ruang halaman.
 *
 * @param {{text:string,x:number,y:number,fontSize:number,bold:boolean}} row
 * @param {number} scale  px -> pt  (pageWidthPt / canvasWidth)
 * @param {number} pageHeightPt tinggi halaman, untuk membalik sumbu y
 */
export function rowToPdfOperators(row, scale, pageHeightPt) {
  const fontSizePt = row.fontSize * scale;
  // y kanvas dari atas; PDF dari bawah.
  const yPt = pageHeightPt - row.y * scale;
  const xPt = row.x * scale;
  if (!row.text) return '';
  return (
    `BT /${row.bold ? 'F2' : 'F1'} ${fontSizePt.toFixed(3)} Tf ` +
    `${xPt.toFixed(3)} ${yPt.toFixed(3)} Td ` +
    `(${pdfString(row.text)}) Tj ET\n`
  );
}

/**
 * Rakit seluruh konten teks satu sisi menjadi satu string operator PDF.
 *
 * @param {Array} rows keluaran layoutSideText
 * @param {number} scale px -> pt
 * @param {number} pageHeightPt tinggi halaman PDF (pt)
 */
export function buildTextContent(rows, scale, pageHeightPt) {
  return rows.map((row) => rowToPdfOperators(row, scale, pageHeightPt)).join('');
}
