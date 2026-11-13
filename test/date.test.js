import { describe, it, expect } from 'vitest';
import { toFormDate, fromFormDate } from '../js/date.js';

describe('toFormDate (DD-MM-YYYY -> YYYY-MM-DD untuk input date)', () => {
  it('TEST-DATE-001 mengubah 30-12-2026 menjadi 2026-12-30', () => {
    expect(toFormDate('30-12-2026')).toBe('2026-12-30');
  });

  it('mengubah 01-01-1990 dengan padding nol', () => {
    expect(toFormDate('01-01-1990')).toBe('1990-01-01');
  });

  it('menerima format DD/MM/YYYY', () => {
    expect(toFormDate('30/12/2026')).toBe('2026-12-30');
  });

  it('menerima format YYYY-MM-DD apa adanya', () => {
    expect(toFormDate('2026-12-30')).toBe('2026-12-30');
  });

  it('mengembalikan string kosong untuk tanggal kosong', () => {
    expect(toFormDate('')).toBe('');
    expect(toFormDate(undefined)).toBe('');
  });

  it('mengembalikan string kosong untuk tanggal tidak sah', () => {
    expect(toFormDate('31-02-2026')).toBe('');
    expect(toFormDate('bukan tanggal')).toBe('');
  });
});

describe('fromFormDate (YYYY-MM-DD -> DD-MM-YYYY untuk payload/QR)', () => {
  it('mengubah 2026-12-30 menjadi 30-12-2026', () => {
    expect(fromFormDate('2026-12-30')).toBe('30-12-2026');
  });

  it('bulak-balik konsisten', () => {
    const original = '30-12-2026';
    expect(fromFormDate(toFormDate(original))).toBe(original);
  });

  it('mengembalikan string kosong untuk input kosong', () => {
    expect(fromFormDate('')).toBe('');
    expect(fromFormDate(undefined)).toBe('');
  });
});
