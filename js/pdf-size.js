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
