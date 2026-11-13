import { describe, it, expect } from 'vitest';
import { parseDelimited, mapRows, validateBatch, normalizeDate } from '../js/batch.js';

describe('parseDelimited', () => {
  it('memisah koma dengan kutip berisi pemisah', () => {
    const rows = parseDelimited('a,b\n"x, y",z');
    expect(rows).toEqual([['a', 'b'], ['x, y', 'z']]);
  });
  it('mendeteksi tab sebagai pemisah', () => {
    expect(parseDelimited('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('mendeteksi titik-koma bila tak ada koma', () => {
    expect(parseDelimited('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
  });
  it('menangani kutip ganda di dalam sel', () => {
    expect(parseDelimited('a\n"kata ""kutip"""')).toEqual([['a'], ['kata "kutip"']]);
  });
  it('membuang baris kosong', () => {
    expect(parseDelimited('a,b\n\n1,2\n')).toEqual([['a', 'b'], ['1', '2']]);
  });
});

describe('mapRows', () => {
  it('memetakan header ke field', () => {
    const raw = [['Nomor Kartu', 'Nama', 'NIK', 'Tanggal Lahir'], ['0000000000000', 'BUDI', '0000000000000000', '22-12-1997']];
    const [p] = mapRows(raw);
    expect(p.nomorKartu).toBe('0000000000000');
    expect(p.nama).toBe('BUDI');
    expect(p.tglLhr).toBe('22-12-1997');
  });
  it('memakai urutan default bila header tak dikenal', () => {
    const raw = [['0000000000000', 'BUDI', 'ALAMAT', '22-12-1997', '0000000000000000', 'FASKES']];
    const [p] = mapRows(raw);
    expect(p.nomorKartu).toBe('0000000000000');
    expect(p.fktp).toBe('FASKES');
  });
});

describe('normalizeDate', () => {
  it('YYYY-MM-DD -> DD-MM-YYYY', () => { expect(normalizeDate('1997-12-22')).toBe('22-12-1997'); });
  it('DD/MM/YYYY -> DD-MM-YYYY', () => { expect(normalizeDate('22/12/1997')).toBe('22-12-1997'); });
  it('seri Excel -> tanggal', () => { expect(normalizeDate('35800')).toBe('05-01-1998'); });
  it('kosong tetap kosong', () => { expect(normalizeDate('')).toBe(''); });
});

describe('validateBatch', () => {
  it('menghitung valid/invalid', () => {
    const list = [
      { nomorKartu: '0000000000000', nama: 'A', alamat: 'X', tglLhr: '22-12-1997', nik: '0000000000000000', fktp: 'F' },
      { nomorKartu: '', nama: '', alamat: '', tglLhr: '', nik: '', fktp: '' }
    ];
    const r = validateBatch(list);
    expect(r.validCount).toBe(1);
    expect(r.invalidCount).toBe(1);
    expect(r.rows[0].ok).toBe(true);
    expect(r.rows[1].ok).toBe(false);
  });
});
