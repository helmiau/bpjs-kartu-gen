/**
 * Ekspor kartu ke JPG dan PDF, 300 dpi, disusun LANGSUNG dari template asli.
 *
 * Latar (template + barcode) digambar langsung ke kanvas 300 dpi dengan
 * penskalaan halus peramban (bukan html2canvas, yang menurunkan latar ke 350 px
 * lalu memperbesar dan membuat teks syarat buram). Hasil raster = 1011 x 641 px
 * = tepat 300 dpi saat dicetak seukuran kartu (sisi terpanjang 85,6 mm).
 *
 * JPG: teks peserta ditulis via canvas fillText (raster tajam).
 * PDF: dua lapisan per halaman:
 *   1. Gambar latar (template + barcode) sebagai XObject JPEG 300 dpi.
 *   2. Teks peserta sebagai objek teks vektor (Helvetica standar) di atasnya,
 *      sehingga teks PDF bisa diseleksi dan diedit pengguna.
 */

import { SCHEMA, BARCODE_BLOCK } from './schema.js';
import { pdfPageSizeMm, exportScaleForDpi, effectiveDpi } from './pdf-size.js';
import { layoutSideText, buildTextContent } from './pdf-text.js';
import { fromFormDate } from './date.js';
import { composeA4Single, composeA4Sheet, a4CanvasToJpeg, A4_PT } from './a4.js';

/** Target kerapatan ekspor cetak. */
const EXPORT_DPI = 300;
const EXPORT_MAX_PIXELS = 36000000;
const JPG_QUALITY = 0.98;
const MM_TO_PT = 72 / 25.4;
/** Nama berkas ekspor: KARTU_<nomor>-BPJS[_SISI].<ext>. */
export function exportFilename(formData, sideSuffix, ext) {
  const raw = formData && formData.nomorKartu ? String(formData.nomorKartu) : '';
  // Hanya huruf/angka: cegah spasi, garis miring, atau karakter kontrol
  // merusak nama berkas. Bila kosong, pakai "TANPA-NOMOR".
  const nomor = raw.replace(/[^0-9A-Za-z]/g, '').toUpperCase() || 'TANPA-NOMOR';
  const suffix = sideSuffix ? `_${sideSuffix}` : '';
  return `KARTU_${nomor}-BPJS${suffix}.${ext}`;
}

/** Batas aman skala bila kanvas raksasa membebani memori. */
function clampScale(scale) {
  const basePixels = Math.max(1, SCHEMA.width * SCHEMA.height);
  const safeScale = Math.sqrt(EXPORT_MAX_PIXELS / basePixels);
  return Math.max(1, Math.min(scale, safeScale));
}

/** Skala ekspor agar hasil raster tepat `EXPORT_DPI` (dibatasi memori). */
function getExportScale() {
  return clampScale(exportScaleForDpi(SCHEMA.width, SCHEMA.height, EXPORT_DPI));
}

/** DPI efektif setelah pembatasan memori (untuk laporan/status bila perlu). */
export function exportDpi() {
  const scale = getExportScale();
  return effectiveDpi(Math.max(SCHEMA.width, SCHEMA.height) * scale);
}

/** Muat gambar dari URL sepenuhnya (untuk digambar ke kanvas). */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Gambar latar kartu gagal dimuat.'));
    img.src = url;
  });
}

/**
 * Ubah kanvas menjadi hitam-putih (mode fotokopi) secara in-place.
 * Luminansi memakai formula ITU-R 601 (0,299R + 0,587G + 0,114B).
 * Dipakai untuk unduhan "foto copy" agar sesuai hasil scan/cetak monokrom.
 */
export function toGrayscale(canvas) {
  const ctx = canvas.getContext('2d');
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = g;
  }
  ctx.putImageData(img, 0, 0);
}

/** Jadikan kanvas sebagai blob JPEG beserta ukuran pikselnya. */
function canvasToJpeg(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Browser gagal membuat berkas hasil ekspor.'));
        return;
      }
      blob.arrayBuffer().then((buffer) => resolve({
        blob,
        bytes: new Uint8Array(buffer),
        width: canvas.width,
        height: canvas.height
      }));
    }, 'image/jpeg', JPG_QUALITY);
  });
}

/**
 * Bangkitkan SVG barcode Code 128 untuk nomor kartu, lepas dari state DOM.
 * Mengembalikan string SVG atau '' bila tidak ada nomor / JsBarcode absen.
 */
function buildBarcodeSvg(formData) {
  const nomor = formData && formData.nomorKartu ? String(formData.nomorKartu) : '';
  if (!nomor || typeof window.JsBarcode !== 'function') return '';
  try {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    window.JsBarcode(svg, nomor, {
      format: 'CODE128',
      width: 1,
      height: BARCODE_BLOCK.height,
      displayValue: false,
      margin: 0,
      lineColor: '#000000',
      background: '#ffffff'
    });
    return svg.outerHTML;
  } catch {
    return '';
  }
}

/**
 * Susun satu sisi kartu pada kanvas 300 dpi secara LANGSUNG (tanpa
 * html2canvas).
 *
 * html2canvas menurunkan latar ke resolusi layout (350 px) lalu memperbesar,
 * sehingga teks syarat di template menjadi buram. Di sini template asli
 * (1516 px) digambar langsung ke kanvas 300 dpi dengan penskalaan halus milik
 * peramban, barcode SVG diraster pada ukuran penuh, dan (untuk JPG) teks
 * peserta ditulis memakai fillText. Hasilnya tajam pada 300 dpi.
 *
 * @param {number} sideIndex 0 = depan, 1 = belakang
 * @param {object} formData data peserta (dipakai bila withText)
 * @param {boolean} withText gambarkan label + nilai (JPG) atau tidak (PDF)
 */
async function composeCardCanvas(sideIndex, formData, withText, grayscale, watermark) {
  const side = SCHEMA.sides[sideIndex];
  if (!side) throw new Error('Sisi kartu tidak ditemukan.');

  const scale = getExportScale();
  const outW = Math.round(SCHEMA.width * scale);
  const outH = Math.round(SCHEMA.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, outW, outH);

  // 1) Template latar digambar langsung (downscale halus dari resolusi asli).
  if (side.background) {
    const bg = await loadImage(side.background);
    ctx.drawImage(bg, 0, 0, outW, outH);
  }

  // 2) Barcode SVG (sisi depan) diraster pada posisi blok, ukuran 300 dpi.
  //    Dibangkitkan dari formData, tidak bergantung state pratinjau DOM.
  const svgMarkup = sideIndex === 0 ? buildBarcodeSvg(formData) : '';
  if (svgMarkup) {
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
    try {
      const barcodeImg = await loadImage(svgUrl);
      ctx.drawImage(
        barcodeImg,
        BARCODE_BLOCK.x * scale,
        BARCODE_BLOCK.y * scale,
        BARCODE_BLOCK.width * scale,
        BARCODE_BLOCK.height * scale
      );
    } catch {
      // Barcode opsional: bila gagal diraster, kartu tetap valid tanpa barcode.
    }
  }

  // 3) Teks peserta (opsional, untuk JPG). PDF memakai teks vektor terpisah.
  if (withText) {
    const rows = layoutSideText(
      side,
      formData,
      (el) => pdfFieldValue(formData, el)
    );
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#000000';
    rows.forEach((row) => {
      if (!row.text) return;
      ctx.font = `${row.bold ? 'bold ' : ''}${(row.fontSize * scale).toFixed(2)}px Helvetica, Arial, sans-serif`;
      ctx.fillText(row.text, row.x * scale, row.y * scale);
    });
  }
  // 3.5) Watermark "COPY" tegak di sisi kanan (sisi depan saja).
  if (sideIndex === 0 && watermark) {
    ctx.save();
    ctx.translate(outW - outH * 0.06, outH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.font = `bold ${(10 * scale).toFixed(2)}px Helvetica, Arial, sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('C O P Y', 0, 0);
    ctx.restore();
  }
  // 4) Mode fotokopi: ubah seluruh kanvas menjadi hitam-putih (grayscale).
  if (grayscale) toGrayscale(canvas);

  return canvas;
}

/**
 * Render satu sisi kartu menjadi kanvas siap ekspor (dengan nilai teks),
 * 300 dpi, disusun langsung dari template + barcode + teks.
 * @param {number} sideIndex 0 = depan, 1 = belakang
 * @param {object} [formData] data peserta; bila kosong, dibaca dari DOM form
 */
export async function renderSideToCanvas(sideIndex, formData, options = {}) {
  const data = formData || readFormData();
  return composeCardCanvas(sideIndex, data, true, !!options.grayscale, !!options.watermark);
}

/** Baca data peserta dari form halaman (fallback bila pemanggil tak memberi). */
function readFormData() {
  const names = ['nomorKartu', 'nama', 'alamat', 'tglLhr', 'nik', 'fktp', 'fktpGigi', 'statusPeserta'];
  const data = {};
  names.forEach((name) => {
    const el = document.getElementById(name);
    data[name] = el ? el.value : '';
  });
  return data;
}

/**
 * Render LATAR satu sisi (template + barcode) pada 300 dpi, tanpa teks nilai,
 * untuk lapisan gambar PDF. Teks peserta digambar sebagai objek vektor terpisah.
 * @param {number} sideIndex 0 = depan, 1 = belakang
 * @param {object} formData data peserta (dipakai untuk barcode sisi depan)
 */
async function renderSideBackgroundCanvas(sideIndex, formData, options = {}) {
  // PDF raster: teks ikut dibakar ke lapisan gambar (bukan teks vektor).
  const withText = !!options.raster;
  return composeCardCanvas(sideIndex, formData, withText, !!options.grayscale, !!options.watermark);
}

/** Unduh blob sebagai berkas. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/** Ekspor satu sisi sebagai JPG. */
export async function exportSideJpg(sideIndex, formData, options = {}) {
  const canvas = await renderSideToCanvas(sideIndex, formData, options);
  const jpeg = await canvasToJpeg(canvas);
  const sideSuffix = sideIndex === 0 ? 'DEPAN' : (sideIndex === 1 ? 'BELAKANG' : `SISI-${sideIndex + 1}`);
  return {
    blob: jpeg.blob,
    filename: exportFilename(formData, sideSuffix, 'jpg'),
    canvas
  };
}

/* ---------------- Perakitan PDF ---------------- */

const enc = (text) => new TextEncoder().encode(text);

function concat(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

/** Ambil nilai bersih satu field untuk objek teks PDF (tanggal diformat). */
function pdfFieldValue(formData, element) {
  if (!element || !element.field) return '';
  const value = formData ? formData[element.field] : '';
  if (element.field === 'tglLhr') return fromFormDate(value || '');
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Rakit PDF dari daftar halaman.
 *
 * Tiap halaman punya dua lapisan: gambar latar (JPEG) + teks vektor. Font
 * standar Helvetica (F1) dan Helvetica-Bold (F2) tidak perlu berkas tertanam,
 * sehingga teks tetap bisa diseleksi/diedit di pembaca PDF.
 *
 * @param {Array<{image:{bytes,width,height}, side:object, formData:object}>} pages
 */
function buildPdf(pages, options = {}) {
  const raster = !!options.raster;
  if (!pages.length) throw new Error('Tidak ada halaman untuk dibuat menjadi PDF.');

  const [pageWidthMm, pageHeightMm] = pdfPageSizeMm(SCHEMA.width, SCHEMA.height);
  const pageWidth = pageWidthMm * MM_TO_PT;
  const pageHeight = pageHeightMm * MM_TO_PT;
  const pxToPt = pageWidth / SCHEMA.width;

  // Nomor objek:
  //   1 catalog, 2 pages,
  //   per halaman: page, content, image  (3 objek)
  //   lalu 2 objek font: F1, F2
  const pageObjectsStart = 3;
  const fontHelveticaId = pageObjectsStart + pages.length * 3;
  const fontBoldId = fontHelveticaId + 1;
  const objectCount = fontBoldId;

  const objects = new Array(objectCount + 1);

  objects[1] = enc('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  const kids = pages.map((_, index) => `${pageObjectsStart + index * 3} 0 R`).join(' ');
  objects[2] = enc(
    '2 0 obj\n' +
    `<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\n` +
    'endobj\n'
  );

  pages.forEach((page, index) => {
    const pageObject = pageObjectsStart + index * 3;
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const imageName = `Im${index + 1}`;

    // Lapisan 1: gambar latar penuh halaman.
    const drawImage =
      'q\n' +
      `${pageWidth.toFixed(4)} 0 0 ${pageHeight.toFixed(4)} 0 0 cm\n` +
      `/${imageName} Do\n` +
      'Q\n';

    // Lapisan 2: teks vektor. Pada mode raster, teks sudah dibakar ke gambar,
    // jadi lapisan teks ini dilewati agar PDF tidak berisi teks yang bisa diedit.
    let drawText = '';
    if (!raster) {
      const rows = layoutSideText(
        page.side,
        page.formData,
        (el) => pdfFieldValue(page.formData, el)
      );
      drawText = buildTextContent(rows, pxToPt, pageHeight);
    }

    const content = drawImage + drawText;
    const contentBytes = enc(content);

    objects[pageObject] = enc(
      `${pageObject} 0 obj\n` +
      '<< /Type /Page /Parent 2 0 R ' +
      `/MediaBox [0 0 ${pageWidth.toFixed(4)} ${pageHeight.toFixed(4)}] ` +
      `/Resources << ` +
      `/XObject << /${imageName} ${imageObject} 0 R >> ` +
      `/Font << /F1 ${fontHelveticaId} 0 R /F2 ${fontBoldId} 0 R >> ` +
      '>> ' +
      `/Contents ${contentObject} 0 R >>\n` +
      'endobj\n'
    );

    objects[contentObject] = concat([
      enc(`${contentObject} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      enc('\nendstream\nendobj\n')
    ]);

    const image = page.image;
    objects[imageObject] = concat([
      enc(
        `${imageObject} 0 obj\n` +
        '<< /Type /XObject /Subtype /Image ' +
        `/Width ${image.width} /Height ${image.height} ` +
        '/ColorSpace /DeviceRGB /BitsPerComponent 8 ' +
        '/Filter /DCTDecode ' +
        `/Length ${image.bytes.length} >>\n` +
        'stream\n'
      ),
      image.bytes,
      enc('\nendstream\nendobj\n')
    ]);
  });

  // Font standar PDF (Type1, tidak perlu di-embed): bisa diedit pembaca PDF.
  objects[fontHelveticaId] = enc(
    `${fontHelveticaId} 0 obj\n` +
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\n' +
    'endobj\n'
  );
  objects[fontBoldId] = enc(
    `${fontBoldId} 0 obj\n` +
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>\n' +
    'endobj\n'
  );

  const header = enc('%PDF-1.4\n% BPJS card export\n');
  const chunks = [header];
  const offsets = new Array(objectCount + 1).fill(0);
  let cursor = header.length;

  for (let n = 1; n <= objectCount; n += 1) {
    offsets[n] = cursor;
    chunks.push(objects[n]);
    cursor += objects[n].length;
  }

  const xrefOffset = cursor;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= objectCount; n += 1) {
    xref += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  }

  chunks.push(enc(
    xref +
    `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\n` +
    'startxref\n' +
    `${xrefOffset}\n` +
    '%%EOF'
  ));

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Ekspor kedua sisi menjadi satu PDF.
 *
 * Default: latar raster 300 dpi + teks vektor (bisa diedit).
 * Opsi `raster:true` membakar teks ke gambar (teks tidak bisa diedit),
 * `grayscale:true` membuat hitam-putih (mode fotokopi).
 */
export async function exportPdfAll(formData = {}, options = {}) {
  const pages = [];
  for (let index = 0; index < SCHEMA.sides.length; index += 1) {
    const canvas = await renderSideBackgroundCanvas(index, formData, options);
    const image = await canvasToJpeg(canvas);
    pages.push({ image, side: SCHEMA.sides[index], formData });
  }
  const blob = buildPdf(pages, options);
  return { blob, filename: exportFilename(formData, null, 'pdf') };
}

/**
 * Ekspor banyak peserta menjadi satu PDF multi-halaman (batch).
 * Tiap peserta menghasilkan 2 halaman: sisi depan lalu sisi belakang.
 * @param {object[]} list daftar data peserta
 * @param {object} options {raster, grayscale}
 * @param {(done:number,total:number)=>void} [onProgress] laporan kemajuan
 * @returns {Promise<{blob:Blob, filename:string, count:number}>}
 */
export async function exportBatchPdf(list, options = {}, onProgress) {
  const data = Array.isArray(list) ? list : [];
  if (!data.length) throw new Error('Tidak ada data peserta untuk diekspor.');
  const pages = [];
  const total = data.length * SCHEMA.sides.length;
  let done = 0;
  let cancelled = false;
  for (const formData of data) {
    for (let index = 0; index < SCHEMA.sides.length; index += 1) {
      const canvas = await renderSideBackgroundCanvas(index, formData, options);
      const image = await canvasToJpeg(canvas);
      pages.push({ image, side: SCHEMA.sides[index], formData });
      done += 1;
      if (typeof onProgress === 'function') {
        if (onProgress(done, total) === false) { cancelled = true; break; }
      }
    }
    if (cancelled) break;
  }
  if (cancelled) throw new Error('cancelled');
  const blob = buildPdf(pages, options);
  return { blob, filename: `KARTU-BPJS-BATCH-${data.length}-peserta.pdf`, count: data.length };
}

/* ---------------- PDF A4 Duplex (raster) ---------------- */

/**
 * Rakit PDF A4 dari daftar gambar halaman A4 penuh (JPEG raster).
 * Tiap halaman = satu lembar A4. Teks dibakar di raster (mode anti-edit).
 * @param {Array<{bytes:Uint8Array,width:number,height:number}>} sheets
 */
function buildA4Pdf(sheets) {
  if (!sheets.length) throw new Error('Tidak ada lembar A4 untuk dibuat.');
  const pageW = A4_PT.w;
  const pageH = A4_PT.h;
  const pageObjectsStart = 3;
  const objectCount = pageObjectsStart + sheets.length * 3 - 1;
  const objects = new Array(objectCount + 1);
  objects[1] = enc('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  const kids = sheets.map((_, i) => `${pageObjectsStart + i * 3} 0 R`).join(' ');
  objects[2] = enc(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${sheets.length} >>\nendobj\n`);

  sheets.forEach((image, index) => {
    const pageObject = pageObjectsStart + index * 3;
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const imageName = `Im${index + 1}`;
    const drawImage =
      'q\n' +
      `${pageW.toFixed(4)} 0 0 ${pageH.toFixed(4)} 0 0 cm\n` +
      `/${imageName} Do\nQ\n`;
    const contentBytes = enc(drawImage);
    objects[pageObject] = enc(
      `${pageObject} 0 obj\n` +
      '<< /Type /Page /Parent 2 0 R ' +
      `/MediaBox [0 0 ${pageW.toFixed(4)} ${pageH.toFixed(4)}] ` +
      `/Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> ` +
      `/Contents ${contentObject} 0 R >>\nendobj\n`
    );
    objects[contentObject] = concat([
      enc(`${contentObject} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      enc('\nendstream\nendobj\n')
    ]);
    objects[imageObject] = concat([
      enc(
        `${imageObject} 0 obj\n` +
        '<< /Type /XObject /Subtype /Image ' +
        `/Width ${image.width} /Height ${image.height} ` +
        '/ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode ' +
        `/Length ${image.bytes.length} >>\nstream\n`
      ),
      image.bytes,
      enc('\nendstream\nendobj\n')
    ]);
  });

  const header = enc('%PDF-1.4\n% BPJS A4 duplex export\n');
  const chunks = [header];
  const offsets = new Array(objectCount + 1).fill(0);
  let cursor = header.length;
  for (let n = 1; n <= objectCount; n += 1) {
    offsets[n] = cursor;
    chunks.push(objects[n]);
    cursor += objects[n].length;
  }
  const xrefOffset = cursor;
  let xref = `xref\n0 ${objectCount + 1}\n0000000000 65535 f \n`;
  for (let n = 1; n <= objectCount; n += 1) {
    xref += String(offsets[n]).padStart(10, '0') + ' 00000 n \n';
  }
  chunks.push(enc(
    xref + `trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  ));
  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Ekspor satu peserta sebagai PDF A4 duplex (1 lembar).
 * @param {object} formData data peserta
 * @param {object} options {mode, crop, fold, grayscale}
 */
export async function exportA4Pdf(formData = {}, options = {}, filenamePrefix) {
  const front = await renderSideToCanvas(0, formData, { grayscale: options.grayscale, watermark: options.watermark });
  const back = await renderSideToCanvas(1, formData, { grayscale: options.grayscale, watermark: options.watermark });
  const sheet = composeA4Single(front, back, options);
  const image = await a4CanvasToJpeg(sheet);
  const blob = buildA4Pdf([image]);
  const base = filenamePrefix || (formData.nomorKartu ? `KARTU_${formData.nomorKartu}-BPJS_A4` : 'KARTU-BPJS_A4');
  return { blob, filename: `${base}.pdf` };
}

/**
 * Ekspor banyak peserta sebagai PDF A4 duplex multi-lembar.
 * @param {object[]} list daftar peserta
 * @param {object} options {mode, crop, fold, grayscale}
 * @param {(done:number,total:number)=>void} [onProgress]
 */
export async function exportBatchA4Pdf(list, options = {}, onProgress) {
  const data = Array.isArray(list) ? list : [];
  if (!data.length) throw new Error('Tidak ada data peserta untuk diekspor.');
  const sheets = [];
  for (let i = 0; i < data.length; i += 1) {
    const front = await renderSideToCanvas(0, data[i], { grayscale: options.grayscale, watermark: options.watermark });
    const back = await renderSideToCanvas(1, data[i], { grayscale: options.grayscale, watermark: options.watermark });
    const sheet = composeA4Single(front, back, options);
    sheets.push(await a4CanvasToJpeg(sheet));
    if (typeof onProgress === 'function') onProgress(i + 1, data.length);
  }
  const blob = buildA4Pdf(sheets);
  return { blob, filename: `KARTU-BPJS-A4-BATCH-${data.length}-peserta.pdf`, count: data.length };
}
