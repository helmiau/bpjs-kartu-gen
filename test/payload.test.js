import { describe, it, expect } from 'vitest';
import { parsePayload, buildPayload } from '../js/payload.js';

// Base64 kanonik dari payload 8 field (dibuat dengan btoa pada JS asli).
const CANONICAL_B64 =
  'eyJub21vckthcnR1IjoiMDAwMDAwMDAwMDAwMCIsIm5hbWEiOiJOQU1BIE9SQU5HIFBFU0VSVEEgQlBKUyIsImFsYW1hdCI6IkFMQU1BVCwgUlQsIFJXLCBLRUxVUkFIQU4sIEtFQ0FNQVRBTiwgS09UQS9LQUJVUEFURU4iLCJ0Z2xMaHIiOiIzMC0xMi0yMDI2IiwibmlrIjoiMzAwMDAwMDAwMDAwMDAwMDEiLCJma3RwIjoiTkFNQSBGQVNJTElUQVMgS0VTRUhBVEFOIiwiZmt0cEdpZ2kiOiItIiwic3RhdHVzUGVzZXJ0YSI6IjAifQ==';

const EXPECTED = {
  nomorKartu: '0000000000000',
  nama: 'NAMA ORANG PESERTA BPJS',
  alamat: 'ALAMAT, RT, RW, KELURAHAN, KECAMATAN, KOTA/KABUPATEN',
  tglLhr: '30-12-2026',
  nik: '30000000000000001',
  fktp: 'NAMA FASILITAS KESEHATAN',
  fktpGigi: '-',
  statusPeserta: '0'
};

describe('parsePayload', () => {
  it('TEST-B64-001 mendekode base64 sah menjadi 8 field', () => {
    const result = parsePayload(CANONICAL_B64);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(EXPECTED);
  });

  it('TEST-B64-002 menolak base64 yang rusak tanpa mengubah data', () => {
    // String kiriman pengguna: 329 karakter data, tidak sah untuk base64.
    const broken =
      'eyJub21vci1LYXJ0dSI6IjAwMDAwMDAwMDAwMDAwIiwibmFtYSI6Ik5BTUEgT1JBTkcgUEVTRVJUQSBCUEpTIiwiYWxhbWF0IjoiQUxBTUFULCBSVCwgUlcsIEtFTFVSQUhBTiwgS0VDQU1BVEFOLCBLT1RBL0tBQlVQQVRFTiIsInRnbEwhyI6IjMwLTEyLTIwMjYiLCJuaWsiOiIzMDAwMDAwMDAwMDAwMDAwMDEiLCJma3RwIjoiTkFNQSBGQVNJTElUQVMgS0VTRUhBVEFOIiwiZmt0cEdpZ2kiOiItIiwic3RhdHVzUGVzZXJ0YSI6IjAifQ==';
    const result = parsePayload(broken);
    expect(result.ok).toBe(false);
    expect(result.error).toBe('INVALID_BASE64');
    expect(result.data).toBeNull();
  });

  it('TEST-B64-003 menerima variasi nama kunci seperti nomor-Kartu dan 14 digit', () => {
    const variant = btoa(JSON.stringify({
      'nomor-Kartu': '00000000000000',
      namaPeserta: 'SITI AMINAH',
      tgl_lahir: '01-01-1990',
      NIK: '3201234567890001',
      fktp: 'PUSKESMAS X',
      faskesGigi: '-',
      status: '0'
    }));
    const result = parsePayload(variant);
    expect(result.ok).toBe(true);
    expect(result.data.nomorKartu).toBe('00000000000000');
    expect(result.data.nama).toBe('SITI AMINAH');
    expect(result.data.tglLhr).toBe('01-01-1990');
    expect(result.data.nik).toBe('3201234567890001');
    expect(result.data.fktp).toBe('PUSKESMAS X');
    expect(result.data.fktpGigi).toBe('-');
    expect(result.data.statusPeserta).toBe('0');
  });

  it('TEST-B64-004 menerima base64 URL-safe tanpa padding', () => {
    // Payload yang menghasilkan karakter '+' dan '/' di encode standar.
    const raw = JSON.stringify({ nomorKartu: '123', nama: 'A?b>c' });
    const std = btoa(raw);
    const urlSafe = std.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    expect(urlSafe).not.toBe(std);
    const result = parsePayload(urlSafe);
    expect(result.ok).toBe(true);
    expect(result.data.nama).toBe('A?b>c');
  });

  it('TEST-B64-005 bulak-balik buildPayload lalu parsePayload menghasilkan data sama', () => {
    const encoded = buildPayload(EXPECTED);
    expect(typeof encoded).toBe('string');
    expect(encoded).not.toContain('=');
    const back = parsePayload(encoded);
    expect(back.ok).toBe(true);
    expect(back.data).toEqual(EXPECTED);
  });

  it('menolak base64 yang mendekode menjadi JSON non-objek', () => {
    const result = parsePayload(btoa('"hanya string"'));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('NOT_AN_OBJECT');
  });

  it('menolak base64 yang mendekode menjadi JSON rusak', () => {
    const result = parsePayload(btoa('{bukan json'));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('INVALID_JSON');
  });

  it('menolak string kosong', () => {
    expect(parsePayload('').ok).toBe(false);
    expect(parsePayload('   ').ok).toBe(false);
  });

  it('menolak payload tanpa satu pun field peserta yang dikenal', () => {
    const result = parsePayload(btoa(JSON.stringify({ acak: 'nilai' })));
    expect(result.ok).toBe(false);
    expect(result.error).toBe('NO_KNOWN_FIELDS');
  });

  it('mengabaikan spasi dan baris baru di sekitar base64', () => {
    const spaced = CANONICAL_B64.slice(0, 20) + '\n  ' + CANONICAL_B64.slice(20);
    const result = parsePayload(spaced);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(EXPECTED);
  });

  it('menerima field numerik dan mengubahnya menjadi string', () => {
    // NIK 17 digit melewati MAX_SAFE_INTEGER; test memakai string agar
    // presisi tidak hilang di JSON.stringify sebelum masuk parser.
    const result = parsePayload(btoa(JSON.stringify({
      nomorKartu: 1234567890123,
      nik: '30000000000000001'
    })));
    expect(result.ok).toBe(true);
    expect(result.data.nomorKartu).toBe('1234567890123');
    expect(result.data.nik).toBe('30000000000000001');
  });

  it('mempertahankan angka besar yang datang sebagai literal JSON', () => {
    // JSON ditulis tangan (bukan lewat JSON.stringify) supaya angka 17 digit
    // tetap utuh sebagai teks; quoteNumbers harus menyelamatkannya.
    const handWritten = '{"nik":30000000000000001,"nomorKartu":1234567890123}';
    const result = parsePayload(btoa(handWritten));
    expect(result.ok).toBe(true);
    expect(result.data.nik).toBe('30000000000000001');
    expect(result.data.nomorKartu).toBe('1234567890123');
  });
});
