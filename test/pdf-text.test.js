import { describe, it, expect } from 'vitest';
import {
  measureHelveticaPx,
  layoutSideText,
  rowToPdfOperators,
  buildTextContent
} from '../js/pdf-text.js';

const sampleElement = (over = {}) => ({
  type: 'text',
  field: 'nama',
  label: 'Nama',
  prefix: 'Nama:',
  x: 35, y: 94, width: 300, height: 12,
  fontSize: 9, fontFamily: 'Arial',
  fontWeight: 'normal', fontStyle: 'normal',
  textAlign: 'left', color: '#000000',
  ...over
});

describe('measureHelveticaPx', () => {
  it('TEST-TEXTPDF-001 mengukur panjang monospace-ish > 0 dan proporsional ukuran', () => {
    const w9 = measureHelveticaPx('AINUN', 9);
    const w18 = measureHelveticaPx('AINUN', 18);
    expect(w9).toBeGreaterThan(0);
    expect(w18).toBeCloseTo(w9 * 2, 6);
  });

  it('menghitung lebar lebih panjang untuk teks lebih banyak', () => {
    expect(measureHelveticaPx('NAMA CONTOH', 9))
      .toBeGreaterThan(measureHelveticaPx('AINUN', 9));
  });

  it('TEST-TEXTPDF-005 bold lebih lebar dari regular pada teks sama', () => {
    expect(measureHelveticaPx('Nomor Kartu:', 9, true))
      .toBeGreaterThan(measureHelveticaPx('Nomor Kartu:', 9, false));
  });
  it('mengganti non-ASCII dengan lebar spasi, bukan NaN', () => {
    expect(measureHelveticaPx('Aí', 9)).toBeGreaterThan(0);
    expect(Number.isFinite(measureHelveticaPx('Aí', 9))).toBe(true);
  });
});

describe('layoutSideText', () => {
  const valueOf = (el) => ({ nama: 'NAMA CONTOH', alamat: '' }[el.field] ?? '');

  it('TEST-TEXTPDF-002 posisi label, titik dua, nilai sesuai grid pratinjau', () => {
    const side = { elements: [sampleElement()] }; // x=35, lebar label 67
    const rows = layoutSideText(side, {}, valueOf);
    // label "Nama:", titik dua ":", nilai "NAMA CONTOH" = 3 baris.
    expect(rows.length).toBe(3);
    expect(rows[0]).toMatchObject({ text: 'Nama:', x: 35 });
    expect(rows[1]).toMatchObject({ text: ':', x: 104 });
    expect(rows[2].text).toBe('NAMA CONTOH');
    expect(rows[2].x).toBe(115);
    // Semua pada baseline yang sama (baris pertama).
    expect(rows[0].y).toBe(rows[1].y);
    expect(rows[1].y).toBe(rows[2].y);
    // Baseline = y + ascent (0,905 em), di dalam blok.
    expect(rows[0].y).toBeCloseTo(94 + 9 * 0.905, 6);
  });

  it('nilai membungkus mengikuti lebar kolom nilai (bukan sisa label)', () => {
    const side = {
      elements: [sampleElement({ field: 'alamat', prefix: 'Alamat:', width: 120 })]
    };
    const rows = layoutSideText(side, {}, (el) => 'Jl. Merdeka Selatan No. 12 RT 04 RW 05 Jakarta Pusat 10270');
    const valueRows = rows.filter((r) => r.text !== ':' && r.x === 115);
    expect(valueRows.length).toBeGreaterThan(1);
    // Semua baris nilai di x=115 yang sama (rapi).
    const xs = valueRows.map((r) => r.x);
    expect(new Set(xs).size).toBe(1);
    // Baris kedua turun sebesar line-height (fontSize * 1,2).
    // Baris kedua turun sebesar line-height font efektif (shrink-to-fit
    // memungkinkan font < 9 bila nilai melebihi tinggi blok).
    expect(valueRows[1].y - valueRows[0].y).toBeCloseTo(valueRows[0].fontSize * 1.2, 6);
  });

  it('TEST-TEXTPDF-006 elemen bold: label normal, titik dua & nilai bold', () => {
    const side = {
      elements: [sampleElement({ field: 'nomorKartu', prefix: 'Nomor Kartu:', fontWeight: 'bold' })]
    };
    const rows = layoutSideText(side, {}, (el) => ({ nomorKartu: '0000000000000' }[el.field] ?? ''));
    const label = rows.find((r) => r.text === 'Nomor Kartu:');
    const sep = rows.find((r) => r.text === ':');
    const val = rows.find((r) => r.text === '0000000000000');
    expect(label.bold).toBe(false);
    expect(sep.bold).toBe(true);
    expect(val.bold).toBe(true);
  });
  it('elemen non-text tidak menghasilkan baris', () => {
    const side = { elements: [{ type: 'multiline', prefix: 'X:', x: 0, y: 0, width: 10, height: 10, fontSize: 9, fontWeight: 'normal' }] };
    expect(layoutSideText(side, {}, valueOf)).toEqual([]);
  });

  it('elemen tanpa elements aman (kembali [])', () => {
    expect(layoutSideText(null, {}, valueOf)).toEqual([]);
    expect(layoutSideText({}, {}, valueOf)).toEqual([]);
  });
});

describe('rowToPdfOperators', () => {
  const row = { text: 'AINUN (x)\\y', x: 35, y: 94, fontSize: 9, bold: false };

  it('TEST-TEXTPDF-003 menghasilkan blok BT/ET dengan font F1', () => {
    const out = rowToPdfOperators(row, 1, 300);
    expect(out).toMatch(/^BT \/F1 9/);
    expect(out).toContain('BT');
    expect(out).toContain('ET');
    expect(out).toContain('Tf');
    expect(out).toContain('Td');
    expect(out).toContain('Tj');
  });

  it('bold memakai F2', () => {
    const out = rowToPdfOperators({ ...row, bold: true }, 1, 300);
    expect(out).toContain('/F2');
  });

  it('escape kurung dan garis miring', () => {
    const out = rowToPdfOperators(row, 1, 300);
    expect(out).toContain('\\(x\\)\\\\y');
    expect(out).not.toContain('(x)\\y');
  });

  it('membalik sumbu y: y kanvas besar -> y PT kecil', () => {
    const top = rowToPdfOperators({ ...row, y: 20 }, 1, 300);
    const bottom = rowToPdfOperators({ ...row, y: 120 }, 1, 300);
    const yTop = Number(top.split('Td')[0].trim().split(/\s+/).pop());
    const yBot = Number(bottom.split('Td')[0].trim().split(/\s+/).pop());
    expect(yTop).toBeGreaterThan(yBot);
  });

  it('baris kosong tidak menghasilkan operator', () => {
    expect(rowToPdfOperators({ ...row, text: '' }, 1, 300)).toBe('');
  });
});

describe('buildTextContent', () => {
  it('TEST-TEXTPDF-004 menggabungkan semua baris, satu BT/ET tiap baris', () => {
    const rows = [
      { text: 'Nama:', x: 35, y: 90, fontSize: 9, bold: false },
      { text: 'AINUN', x: 70, y: 90, fontSize: 9, bold: false }
    ];
    const out = buildTextContent(rows, 1, 300);
    expect(out).toContain('BT');
    expect((out.match(/BT/g) || []).length).toBe(2);
    expect(out).toContain('AINUN');
  });

  it('baris kosong diabaikan tanpa menambah BT/ET', () => {
    const rows = [
      { text: '', x: 35, y: 90, fontSize: 9, bold: false },
      { text: 'X', x: 35, y: 100, fontSize: 9, bold: false }
    ];
    const out = buildTextContent(rows, 1, 300);
    expect((out.match(/BT/g) || []).length).toBe(1);
  });
});
