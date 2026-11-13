import { describe, it, expect } from 'vitest';
import { exportScaleForDpi, effectiveDpi, pdfPageSizeMm } from '../js/pdf-size.js';

describe('exportScaleForDpi', () => {
  it('TEST-DPI-001 menghasilkan skala yang memberi DPI 300 untuk kanvas 350x222', () => {
    const scale = exportScaleForDpi(350, 222, 300);
    expect(scale).toBeGreaterThan(0);
    // pixelLongEdge = 350 * scale; dicetak 85.6mm -> 300 dpi.
    expect(effectiveDpi(350 * scale)).toBeCloseTo(300, 6);
  });

  it('menjaga rasio tinggi (portrait) juga 300 dpi', () => {
    const scale = exportScaleForDpi(222, 350, 300);
    expect(effectiveDpi(350 * scale)).toBeCloseTo(300, 6);
  });

  it('DPI lebih tinggi -> skala lebih besar (proporsional)', () => {
    const s150 = exportScaleForDpi(350, 222, 150);
    const s300 = exportScaleForDpi(350, 222, 300);
    const s600 = exportScaleForDpi(350, 222, 600);
    expect(s300).toBeCloseTo(s150 * 2, 6);
    expect(s600).toBeCloseTo(s300 * 2, 6);
  });

  it('kanvas lebih besar -> skala lebih kecil (biar tetap 300 dpi)', () => {
    const s350 = exportScaleForDpi(350, 222, 300);
    const s700 = exportScaleForDpi(700, 444, 300);
    expect(s350).toBeCloseTo(s700 * 2, 6);
  });

  it('memvalidasi input', () => {
    expect(() => exportScaleForDpi(0, 222)).toThrow();
    expect(() => exportScaleForDpi(350, -1)).toThrow();
  });

  it('DEFAULT target 300 bila tidak diisi', () => {
    expect(exportScaleForDpi(350, 222)).toBeCloseTo(exportScaleForDpi(350, 222, 300), 6);
  });
});

describe('effectiveDpi', () => {
  it('TEST-DPI-002 menghitung dpi dari sisi terpanjang raster', () => {
    // 350px dicetak 85.6mm => 1011 px/3.37in ~ 300 bila pixelLongEdge=1011.
    const expected = 300 * (85.6 / 25.4);
    expect(effectiveDpi(Math.round(expected))).toBeCloseTo(300, 1);
  });

  it('konsisten dengan pdfPageSizeMm (sisi terpanjang 85.6mm)', () => {
    const [longMm] = pdfPageSizeMm(350, 222);
    expect(longMm).toBeCloseTo(85.6, 6);
    const pxFor300 = 300 * (longMm / 25.4);
    expect(effectiveDpi(pxFor300)).toBeCloseTo(300, 6);
  });
});
