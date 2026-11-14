/**
 * Ukuran halaman PDF.
 *
 * Kartu BPJS fisik memiliki sisi terpanjang 85,6 mm (sama seperti situs
 * sumber). Sisi lain mengikuti rasio kanvas agar gambar tidak terdistorsi.
 * Satuan keluaran milimeter; dipakai saat merakit PDF.
 */

const LONG_EDGE_MM = 85.6;

/** Ukuran kartu fisik CR80 (ISO/IEC 7810 ID-1). */
export const CR80_MM = { width: 85.6, height: 53.98 };

/** Celah antar dua kartu dan margin tepi pada lembar pasangan (mm). */
export const PAIR_GAP_MM = 3;
export const PAIR_MARGIN_MM = 2;

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

/**
 * Ukuran (mm) satu kartu mengikuti rasio kanvas dengan sisi terpanjang CR80.
 * Tinggi = CR80.width * (canvasH / canvasW), jadi rasio kanvas terjaga.
 */
export function cardSizeMm(width, height) {
  const w = Number(width);
  const h = Number(height);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
    throw new Error('ukuran kanvas tidak sah');
  }
  const cardW = CR80_MM.width;
  return [cardW, (cardW * h) / w];
}

/**
 * Ukuran halaman (mm) untuk sepasang kartu (depan + belakang) berdampingan,
 * meniru lembar kartu fisik: dua kartu + celah + margin di tiap sisi.
 * @returns {{page:[number,number], card:[number,number], gap:number, margin:number}}
 */
export function pairPageMm(width, height) {
  const [cardW, cardH] = cardSizeMm(width, height);
  const gap = PAIR_GAP_MM;
  const margin = PAIR_MARGIN_MM;
  return {
    page: [cardW * 2 + gap + margin * 2, cardH + margin * 2],
    card: [cardW, cardH],
    gap,
    margin
  };
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
