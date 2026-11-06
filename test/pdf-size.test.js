import { describe, it, expect } from 'vitest';
import { pdfPageSizeMm } from '../js/pdf-size.js';

describe('pdfPageSizeMm', () => {
  it('TEST-PDF-001 memakai sisi terpanjang 85,6 mm untuk kanvas 350x244', () => {
    const size = pdfPageSizeMm(350, 244);
    // 350 adalah sisi terpanjang, 244 mengikuti rasio.
    expect(size[0]).toBeCloseTo(85.6, 6);
    expect(size[1]).toBeCloseTo((85.6 * 244) / 350, 6);
  });

  it('menjaga rasio agar gambar tidak terdistorsi', () => {
    const [w, h] = pdfPageSizeMm(350, 244);
    expect(w / h).toBeCloseTo(350 / 244, 6);
  });

  it('menangani sisi tinggi (portrait)', () => {
    const [w, h] = pdfPageSizeMm(244, 350);
    expect(h).toBeCloseTo(85.6, 6);
    expect(w).toBeCloseTo((85.6 * 244) / 350, 6);
  });

  it('kanvas persegi menghasilkan halaman persegi', () => {
    const [w, h] = pdfPageSizeMm(300, 300);
    expect(w).toBeCloseTo(85.6, 6);
    expect(h).toBeCloseTo(85.6, 6);
  });
});
