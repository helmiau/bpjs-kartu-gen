import { describe, it, expect } from 'vitest';
import { fitFontSize, layoutSideText, wrapToWidth } from '../js/pdf-text.js';
import { SCHEMA } from '../js/schema.js';

function addrElement() {
  return SCHEMA.sides[0].elements.find((e) => e.field === 'alamat');
}

function valueWidthOf(el) {
  const valueX = el.x + 67 + 2 + 9 + 2;
  return Math.max(el.fontSize, el.x + el.width - valueX);
}

describe('fitFontSize (alamat 3 baris)', () => {
  it('alamat pendek (2 baris) tidak mengecil font', () => {
    const el = addrElement();
    const valueWidth = valueWidthOf(el);
    expect(fitFontSize('ALAMAT CONTOH', el.fontSize, valueWidth, el.height)).toBe(el.fontSize);
  });

  it('alamat 3 baris mengecil font agar muat', () => {
    const el = addrElement();
    const valueWidth = valueWidthOf(el);
    const long = 'ALAMAT CONTOH RT 02 RW 03 NO 15 KECAMATAN CONTOH KABUPATEN CONTOH PROVINSI 60001';
    // pada font dasar: 3+ baris
    const baseLines = wrapToWidth(long, el.fontSize, valueWidth);
    expect(baseLines.length).toBeGreaterThanOrEqual(3);
    const fitted = fitFontSize(long, el.fontSize, valueWidth, el.height);
    expect(fitted).toBeLessThan(el.fontSize);
    // setelah fit, jumlah baris muat dalam tinggi blok
    const maxLines = Math.max(1, Math.floor(el.height / (el.fontSize * 1.2)));
    const fittedLines = wrapToWidth(long, fitted, valueWidth);
    expect(fittedLines.length).toBeLessThanOrEqual(maxLines);
  });

  it('fitFontSize tidak turun di bawah 7', () => {
    expect(fitFontSize('sangat panjang '.repeat(50), 9, 60, 10)).toBeGreaterThanOrEqual(7);
  });
});

describe('layoutSideText shrink konsisten', () => {
  it('baris alamat tidak melampaui batas blok', () => {
    const el = addrElement();
    const nextEl = SCHEMA.sides[0].elements.find((e) => e.field === 'tglLhr');
    const formData = {
      alamat: 'ALAMAT CONTOH RT 02 RW 03 NO 15 KECAMATAN CONTOH KABUPATEN CONTOH PROVINSI 60001'
    };
    const rows = layoutSideText(SCHEMA.sides[0], formData, (e) => formData[e.field] ?? '');
    const valueX = el.x + 67 + 2 + 9 + 2;
    const addrRows = rows.filter((r) => r.x === valueX && r.text.length > 3);
    expect(addrRows.length).toBeGreaterThan(0);
    for (const r of addrRows) {
      expect(r.y).toBeLessThan(nextEl.y);
    }
  });
});
