/**
 * Ekspor kartu ke JPG dan PDF.
 *
 * Render memakai html2canvas (pustaka yang sama dengan situs sumber), lalu
 * PDF dirakit manual dari JPEG yang dihasilkan agar ukuran halaman presisi.
 */

import { SCHEMA } from './schema.js';
import { pdfPageSizeMm } from './pdf-size.js';

const EXPORT_SCALE_TARGET = 4;
const EXPORT_MAX_PIXELS = 36000000;
const JPG_QUALITY = 0.98;
const MM_TO_PT = 72 / 25.4;

/** Skala ekspor: 4x bila memori aman, diturunkan bila kanvas terlalu besar. */
function getExportScale() {
  const basePixels = Math.max(1, SCHEMA.width * SCHEMA.height);
  const safeScale = Math.sqrt(EXPORT_MAX_PIXELS / basePixels);
  return Math.max(1, Math.min(EXPORT_SCALE_TARGET, safeScale));
}

/** Selesaikan gambar latar & QR benar-benar termuat sebelum difoto. */
function waitForImages(target) {
  const images = Array.from(target.querySelectorAll('img'));
  const backgrounds = new Set();
  [target, ...target.querySelectorAll('*')].forEach((node) => {
    const url = getComputedStyle(node).backgroundImage || '';
    const match = /url\((['"]?)(.*?)\1\)/.exec(url);
    if (match && match[2]) backgrounds.add(match[2]);
  });

  const jobs = images.map((image) => (image.complete
    ? Promise.resolve()
    : new Promise((resolve, reject) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', () => reject(new Error('Gambar kartu gagal dimuat.')), { once: true });
      })));

  backgrounds.forEach((url) => {
    jobs.push(new Promise((resolve, reject) => {
      const pre = new Image();
      pre.onload = () => resolve();
      pre.onerror = () => reject(new Error('Gambar latar kartu gagal dimuat.'));
      pre.src = url;
    }));
  });

  return Promise.all(jobs);
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
 * Render satu sisi kartu menjadi kanvas siap ekspor.
 * @param {number} sideIndex 0 = depan, 1 = belakang
 */
export async function renderSideToCanvas(sideIndex) {
  const target = document.getElementById(`cardCanvas${sideIndex}`);
  if (!target) throw new Error('Sisi kartu tidak ditemukan.');
  if (typeof window.html2canvas !== 'function') {
    throw new Error('Pustaka ekspor gagal dimuat.');
  }

  await waitForImages(target);

  const stage = target.parentElement;
  const savedTransform = target.style.transform;
  const savedOverflow = stage ? stage.style.overflow : '';

  // Lepaskan skala pratinjau agar hasil ekspor ukuran penuh.
  target.style.transform = 'none';
  if (stage) stage.style.overflow = 'visible';

  try {
    // Dua frame memberi browser waktu menerapkan perubahan layout.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return await window.html2canvas(target, {
      scale: getExportScale(),
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 20000,
      removeContainer: true,
      width: SCHEMA.width,
      height: SCHEMA.height,
      scrollX: 0,
      scrollY: 0
    });
  } finally {
    target.style.transform = savedTransform;
    if (stage) stage.style.overflow = savedOverflow;
  }
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
export async function exportSideJpg(sideIndex) {
  const side = SCHEMA.sides[sideIndex];
  const canvas = await renderSideToCanvas(sideIndex);
  const jpeg = await canvasToJpeg(canvas);
  const name = sideIndex === 0 ? 'depan' : (sideIndex === 1 ? 'belakang' : `sisi-${sideIndex + 1}`);
  return {
    blob: jpeg.blob,
    filename: `bpjs-${side?.id || name}.jpg`,
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

/**
 * Rakit PDF dari daftar JPEG.
 * Struktur objek mengikuti pola situs sumber: satu halaman + satu XObject
 * gambar per sisi, ukuran halaman dihitung dari rasio kanvas.
 */
function buildPdf(images) {
  if (!images.length) throw new Error('Tidak ada halaman untuk dibuat menjadi PDF.');

  const [pageWidthMm, pageHeightMm] = pdfPageSizeMm(SCHEMA.width, SCHEMA.height);
  const pageWidth = pageWidthMm * MM_TO_PT;
  const pageHeight = pageHeightMm * MM_TO_PT;

  const objectCount = 2 + images.length * 3;
  const objects = new Array(objectCount + 1);

  objects[1] = enc(
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n'
  );

  const kids = images.map((_, index) => `${3 + index * 3} 0 R`).join(' ');
  objects[2] = enc(
    '2 0 obj\n' +
    `<< /Type /Pages /Kids [${kids}] /Count ${images.length} >>\n` +
    'endobj\n'
  );

  images.forEach((image, index) => {
    const pageObject = 3 + index * 3;
    const contentObject = pageObject + 1;
    const imageObject = pageObject + 2;
    const imageName = `Im${index + 1}`;

    const content =
      'q\n' +
      `${pageWidth.toFixed(4)} 0 0 ${pageHeight.toFixed(4)} 0 0 cm\n` +
      `/${imageName} Do\n` +
      'Q\n';
    const contentBytes = enc(content);

    objects[pageObject] = enc(
      `${pageObject} 0 obj\n` +
      '<< /Type /Page /Parent 2 0 R ' +
      `/MediaBox [0 0 ${pageWidth.toFixed(4)} ${pageHeight.toFixed(4)}] ` +
      `/Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> ` +
      `/Contents ${contentObject} 0 R >>\n` +
      'endobj\n'
    );

    objects[contentObject] = concat([
      enc(`${contentObject} 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      enc('endstream\nendobj\n')
    ]);

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

/** Ekspor kedua sisi menjadi satu PDF. */
export async function exportPdfAll() {
  const pages = [];
  for (let index = 0; index < SCHEMA.sides.length; index += 1) {
    const canvas = await renderSideToCanvas(index);
    pages.push(await canvasToJpeg(canvas));
  }
  const blob = buildPdf(pages);
  return { blob, filename: 'bpjs-depan-belakang.pdf' };
}
