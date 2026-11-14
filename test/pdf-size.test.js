import { describe, it, expect } from 'vitest';
import { pdfPageSizeMm, pairPageMm, cardSizeMm, CR80_MM, PAIR_GAP_MM, PAIR_MARGIN_MM } from '../js/pdf-size.js';

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
describe('cardSizeMm / pairPageMm (layout pasangan)', () => {
  it('kartu memakai sisi terpanjang CR80 85,6 mm dan rasio kanvas', () => {
    const [w, h] = cardSizeMm(350, 222);
    expect(w).toBeCloseTo(CR80_MM.width, 6);
    expect(h).toBeCloseTo((CR80_MM.width * 222) / 350, 6);
    expect(w / h).toBeCloseTo(350 / 222, 6);
  });

  it('halaman pasangan = 2 kartu + celah + margin, tinggi = kartu + 2 margin', () => {
    const { page, card, gap, margin } = pairPageMm(350, 222);
    expect(card[0]).toBeCloseTo(CR80_MM.width, 6);
    expect(page[0]).toBeCloseTo(card[0] * 2 + gap + margin * 2, 6);
    expect(page[1]).toBeCloseTo(card[1] + margin * 2, 6);
    expect(gap).toBe(PAIR_GAP_MM);
    expect(margin).toBe(PAIR_MARGIN_MM);
  });

  it('kanvas tidak sah ditolak', () => {
    expect(() => pairPageMm(0, 222)).toThrow();
  });
});
