/**
 * Layout cetak A4 bolak-balik (duplex) untuk kartu BPJS.
 *
 * Satu lembar A4 memuat pasangan sisi depan + belakang dalam posisi siap lipat
 * dan cetak bolak-balik. Raster 300 dpi. Mode:
 *   - side-by-side: dua kartu sejajar, lipat kiri-kanan (garis lipatan tengah vertikal)
 *   - vertical:     dua kartu bertumpuk, lipat atas-bawah (garis lipatan tengah horizontal)
 *   - grid:         4 pasang (8 kartu) dalam grid 2x4 per lembar
 *
 * Crop marks (garis potong) + fold line opsional digambar. Ukuran fisik kartu
 * tetap 85,60 x 53,98 mm (ISO/IEC 7810 ID-1); di kanvas piksel.
 */

import { SCHEMA } from './schema.js';
import { MM_TO_PT } from './a4-constants.js';

/** Konstanta A4 dalam piksel @300 dpi. */
const A4_W = 2480;
const A4_H = 3508;

/** Konstanta ukuran A4 mm -> pt. */
export const A4_MM = { w: 210, h: 297 };
export const A4_PT = { w: 210 * MM_TO_PT, h: 297 * MM_TO_PT };

/** Margin antar-kartu (mm) lalu ke px @300. */
const GAP_MM = 12;
const GAP_PX = Math.round((GAP_MM / 25.4) * 300);

/** Ukuran kartu di kanvas A4 (px), mempertahankan rasio asli. */
function cardPx(maxW, maxH) {
  const r = SCHEMA.width / SCHEMA.height;
  let w = maxW, h = maxW / r;
  if (h > maxH) { h = maxH; w = maxH * r; }
  return { w: Math.round(w), h: Math.round(h) };
}

/** Kanvas A4 putih. */
function newA4() {
  const canvas = document.createElement('canvas');
  canvas.width = A4_W;
  canvas.height = A4_H;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, A4_W, A4_H);
  return { canvas, ctx };
}

/** Tempel satu kartu (sudah raster) ke posisi (x,y). */
function placeCard(ctx, card, x, y) {
  if (card) ctx.drawImage(card, x, y, card.width, card.height);
}

/** Gambar garis bantu (crop marks 4 sudut + fold line tengah). */
function drawGuides(ctx, x0, y0, x1, y1, mode, crop, fold) {
  if (!crop && !fold) return;
  ctx.save();
  ctx.strokeStyle = '#999999';
  ctx.lineWidth = 1;
  // Crop marks: garis pendek di tiap sudut, keluar 12px, panjang 22px.
  if (crop) {
    const off = 12, len = 22;
    const corners = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]];
    corners.forEach(([cx, cy], i) => {
      const dx = i % 2 === 1 ? -1 : 1; // kiri/t kanan
      const dy = i < 2 ? 1 : -1;      // atas/bawah
      ctx.beginPath();
      ctx.moveTo(cx + dx * off, cy + dy * (off + len));
      ctx.lineTo(cx + dx * off, cy + dy * off);
      ctx.lineTo(cx + dx * (off + len), cy + dy * off);
      ctx.stroke();
    });
  }
  // Fold line: putus-putus tengah area pasangan.
  if (fold) {
    const mx = (x0 + x1) / 2;
    const my = (y0 + y1) / 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath();
    if (mode === 'vertical') {
      ctx.moveTo(x0 - 40, my);
      ctx.lineTo(x1 + 40, my);
    } else {
      ctx.moveTo(mx, y0 - 40);
      ctx.lineTo(mx, y1 + 40);
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();
}

/**
 * Susun satu lembar A4 untuk daftar pasangan (setiap pasangan = 2 sisi: [front, back]).
 * @param {Array<{front:HTMLCanvasElement, back:HTMLCanvasElement}>} pairs
 * @param {object} options {mode, crop, fold}
 * @returns {HTMLCanvasElement}
 */
export function composeA4Sheet(pairs, options = {}) {
  const mode = options.mode || 'side-by-side';
  const { canvas, ctx } = newA4();

  if (mode === 'grid') {
    // 2 kolom x 4 baris = 8 kartu (4 pasang).
    const cols = 2, rows = 4;
    const usableW = A4_W - GAP_PX * (cols + 1);
    const usableH = A4_H - GAP_PX * (rows + 1);
    const cw = Math.floor(usableW / cols);
    const ch = Math.floor(usableH / rows);
    const { w, h } = cardPx(cw, ch);
    let pi = 0;
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const cx = GAP_PX + c * (cw + GAP_PX) + Math.floor((cw - w) / 2);
        const cy = GAP_PX + r * (ch + GAP_PX) + Math.floor((ch - h) / 2);
        const pair = pairs[pi];
        // sisi kiri = depan, kanan = belakang (setiap sel satu kartu)
        placeCard(ctx, pair ? pair.front : null, cx, cy);
        pi += 1;
      }
    }
    // guides per sel tidak praktis; gambar grid garis pemisah
    if (options.fold) {
      ctx.save();
      ctx.strokeStyle = '#bbbbbb';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 1;
      const colX = GAP_PX + cw + GAP_PX / 2;
      ctx.beginPath(); ctx.moveTo(colX, GAP_PX); ctx.lineTo(colX, A4_H - GAP_PX); ctx.stroke();
      for (let r = 1; r < rows; r += 1) {
        const yy = GAP_PX + r * ch + GAP_PX / 2;
        ctx.beginPath(); ctx.moveTo(GAP_PX, yy); ctx.lineTo(A4_W - GAP_PX, yy); ctx.stroke();
      }
      ctx.restore();
    }
    return canvas;
  }

  // mode side-by-side / vertical: pasangan-pasangan, tiap pasang 2 kartu.
  // Untuk banyak pasangan, susun beberapa "baris lipat" per lembar (maks ~2 pasang per mode untuk besar).
  const stackPerSheet = mode === 'side-by-side' ? 2 : 3;
  const blockH = Math.floor(A4_H / (stackPerSheet + 1));

  for (let b = 0; b < Math.min(pairs.length, stackPerSheet); b += 1) {
    const pair = pairs[b];
    const areaTop = blockH * b + Math.floor(GAP_PX / 2);
    const areaH = blockH - GAP_PX;

    if (mode === 'side-by-side') {
      const halfW = Math.floor(A4_W / 2);
      const { w, h } = cardPx(halfW - GAP_PX, areaH);
      const x0 = Math.floor((halfW - w) / 2);
      const x1 = halfW + GAP_PX + Math.floor((halfW - w) / 2);
      const y = areaTop + Math.floor((areaH - h) / 2);
      placeCard(ctx, pair.front, x0, y);
      placeCard(ctx, pair.back, x1, y);
      drawGuides(ctx, x0, y, x1 + w, y + h, 'side-by-side', options.crop, options.fold);
    } else {
      // vertical: depan atas, belakang bawah.
      const { w, h } = cardPx(A4_W - GAP_PX * 2, Math.floor(areaH / 2) - GAP_PX / 2);
      const x = Math.floor((A4_W - w) / 2);
      const y0 = areaTop + Math.floor((Math.floor(areaH / 2) - h) / 2);
      const y1 = areaTop + Math.floor(areaH / 2) + Math.floor(GAP_PX / 2) + Math.floor((Math.floor(areaH / 2) - h) / 2);
      placeCard(ctx, pair.front, x, y0);
      placeCard(ctx, pair.back, x, y1);
      drawGuides(ctx, x, y0, x + w, y1 + h, 'vertical', options.crop, options.fold);
    }
  }
  return canvas;
}

/**
 * Kanvas A4 untuk SATU peserta (1 pasang depan/belakang).
 * @param {HTMLCanvasElement} front
 * @param {HTMLCanvasElement} back
 * @param {object} options {mode, crop, fold}
 */
export function composeA4Single(front, back, options = {}) {
  return composeA4Sheet([{ front, back }], options);
}

/** Konversi kanvas A4 -> JPEG bytes. */
export function a4CanvasToJpeg(canvas, quality = 0.95) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Gagal membuat JPEG A4.'));
      const reader = new FileReader();
      reader.onload = () => {
        const bin = atob(reader.result.split(',')[1]);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i += 1) arr[i] = bin.charCodeAt(i);
        resolve({ bytes: arr, width: canvas.width, height: canvas.height });
      };
      reader.onerror = () => reject(new Error('Gagal membaca JPEG A4.'));
      reader.readAsDataURL(blob);
    }, 'image/jpeg', quality);
  });
}
