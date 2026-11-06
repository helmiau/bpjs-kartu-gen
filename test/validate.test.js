import { describe, it, expect } from 'vitest';
import { validate } from '../js/validate.js';

const VALID = {
  nomorKartu: '0000000000000',
  nama: 'NAMA ORANG PESERTA BPJS',
  alamat: 'ALAMAT, RT, RW, KELURAHAN, KECAMATAN, KOTA/KABUPATEN',
  tglLhr: '30-12-2026',
  nik: '30000000000000001',
  fktp: 'NAMA FASILITAS KESEHATAN',
  fktpGigi: '-',
  statusPeserta: '0'
};

describe('validate', () => {
  it('TEST-FORM-001 meloloskan data lengkap yang sah', () => {
    const result = validate(VALID);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('menolak nomorKartu kosong', () => {
    const result = validate({ ...VALID, nomorKartu: '' });
    expect(result.ok).toBe(false);
    expect(result.errors.nomorKartu).toBeDefined();
  });

  it('menolak nomorKartu yang memuat huruf', () => {
    const result = validate({ ...VALID, nomorKartu: '00000ABC00000' });
    expect(result.errors.nomorKartu).toBeDefined();
  });

  it('menerima nomorKartu 13 maupun 14 digit', () => {
    expect(validate({ ...VALID, nomorKartu: '1234567890123' }).ok).toBe(true);
    expect(validate({ ...VALID, nomorKartu: '12345678901234' }).ok).toBe(true);
  });

  it('menolak nomorKartu 12 digit atau 15 digit', () => {
    expect(validate({ ...VALID, nomorKartu: '123456789012' }).ok).toBe(false);
    expect(validate({ ...VALID, nomorKartu: '123456789012345' }).ok).toBe(false);
  });

  it('menolak nik kosong, bukan digit, atau di luar rentang 16-17 digit', () => {
    expect(validate({ ...VALID, nik: '' }).ok).toBe(false);
    expect(validate({ ...VALID, nik: '3000000000000000A' }).ok).toBe(false);
    expect(validate({ ...VALID, nik: '300000000000000' }).ok).toBe(false);
    expect(validate({ ...VALID, nik: '300000000000000011' }).ok).toBe(false);
  });

  it('menerima NIK 16 maupun 17 digit karena data peserta beredar memuat keduanya', () => {
    expect(validate({ ...VALID, nik: '3000000000000001' }).ok).toBe(true);
    expect(validate({ ...VALID, nik: '30000000000000001' }).ok).toBe(true);
  });

  it('menolak nama kosong dan nama lebih dari 100 karakter', () => {
    expect(validate({ ...VALID, nama: '' }).ok).toBe(false);
    expect(validate({ ...VALID, nama: 'A'.repeat(101) }).ok).toBe(false);
  });

  it('menolak alamat kosong dan alamat lebih dari 200 karakter', () => {
    expect(validate({ ...VALID, alamat: '' }).ok).toBe(false);
    expect(validate({ ...VALID, alamat: 'A'.repeat(201) }).ok).toBe(false);
  });

  it('menolak tanggal lahir kosong atau tidak sah', () => {
    expect(validate({ ...VALID, tglLhr: '' }).ok).toBe(false);
    expect(validate({ ...VALID, tglLhr: '31-02-2026' }).ok).toBe(false);
  });

  it('menolak fktp kosong', () => {
    expect(validate({ ...VALID, fktp: '' }).ok).toBe(false);
  });

  it('menerima tanggal lahir dalam format input date YYYY-MM-DD', () => {
    // Form memakai <input type="date"> yang berisi YYYY-MM-DD, sedangkan
    // payload memakai DD-MM-YYYY. Keduanya harus lolos validasi.
    expect(validate({ ...VALID, tglLhr: '2026-12-30' }).ok).toBe(true);
    expect(validate({ ...VALID, tglLhr: '1990-01-01' }).ok).toBe(true);
  });

  it('menolak tanggal yang tidak ada pada kalender', () => {
    expect(validate({ ...VALID, tglLhr: '31-02-2026' }).ok).toBe(false);
    expect(validate({ ...VALID, tglLhr: '2026-02-31' }).ok).toBe(false);
    expect(validate({ ...VALID, tglLhr: '30-13-2026' }).ok).toBe(false);
  });

  it('membiarkan fktpGigi dan statusPeserta kosong', () => {
    expect(validate({ ...VALID, fktpGigi: '', statusPeserta: '' }).ok).toBe(true);
  });

  it('melaporkan semua kolom yang bermasalah sekaligus', () => {
    const result = validate({ nomorKartu: '', nama: '', alamat: '', tglLhr: '', nik: '', fktp: '' });
    expect(result.ok).toBe(false);
    expect(Object.keys(result.errors).sort()).toEqual(
      ['alamat', 'fktp', 'nama', 'nik', 'nomorKartu', 'tglLhr'].sort()
    );
  });

  it('memotong spasi berlebih sebelum memeriksa', () => {
    const result = validate({ ...VALID, nama: '   ' });
    expect(result.ok).toBe(false);
  });
});
