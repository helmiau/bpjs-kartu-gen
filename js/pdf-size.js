/**
 * Ukuran halaman PDF.
 *
 * Kartu BPJS fisik memiliki sisi terpanjang 85,6 mm (sama seperti situs
 * sumber). Sisi lain mengikuti rasio kanvas agar gambar tidak terdistorsi.
 * Satuan keluaran milimeter; dipakai saat merakit PDF.
 */

const LONG_EDGE_MM = 85.6;

export function pdfPageSizeMm(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error('ukuran kanvas tidak sah');
  }
  if (w >= h) {
    return [LONG_EDGE_MM, (LONG_EDGE_MM * h) / w];
  }
  return [(LONG_EDGE_MM * w) / h, LONG_EDGE_MM];
}

/** Inci per milimeter. */
const INCH_PER_MM = 1 / 25.4;

/**
 * Skala ekspor agar hasil raster tepat pada `targetDpi` saat dicetak seukuran
 * halaman PDF (sisi terpanjang LONG_EDGE_MM).
 *
 * Lebar raster hasil = canvasWidth * scale. Ukuran cetak sisi terpanjang =
 * LONG_EDGE_MM, jadi dpi = (canvasWidth * scale) / (LONG_EDGE_MM * inci).
 * Menyelesaikan untuk scale: scale = targetDpi * LONG_EDGE_MM * inci / panjangSisiTerpanjangPx.
 *
 * @param {number} width lebar kanvas (px)
 * @param {number} height tinggi kanvas (px)
 * @param {number} targetDpi target kerapatan (default 300)
 */
export function exportScaleForDpi(width, height, targetDpi = 300) {
  const w = Number(width);
  const h = Number(height);
  const dpi = Number(targetDpi);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error('ukuran kanvas tidak sah');
  }
  const longPx = Math.max(w, h);
  return (dpi * LONG_EDGE_MM * INCH_PER_MM) / longPx;
}

/**
 * DPI efektif sebuah raster hasil ekspor bila dicetak seukuran halaman PDF.
 * @param {number} pixelLongEdge sisi terpanjang raster (px)
 */
export function effectiveDpi(pixelLongEdge) {
  return Number(pixelLongEdge) / (LONG_EDGE_MM * INCH_PER_MM);
}
