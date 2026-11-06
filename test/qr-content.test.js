import { describe, it, expect } from 'vitest';
import { qrContent, qrLength } from '../js/qr-content.js';
import { parsePayload } from '../js/payload.js';

const FORM = {
  nomorKartu: '0000000000000',
  nama: 'NAMA ORANG PESERTA BPJS',
  alamat: 'ALAMAT, RT, RW, KELURAHAN, KECAMATAN, KOTA/KABUPATEN',
  tglLhr: '2026-12-30',
  nik: '30000000000000001',
  fktp: 'NAMA FASILITAS KESEHATAN',
  fktpGigi: '-',
  statusPeserta: '0'
};

describe('qrContent', () => {
  it('TEST-QRGEN-001 menghasilkan base64 yang bisa diparse kembali ke data sama', () => {
    const encoded = qrContent(FORM);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    const back = parsePayload(encoded);
    expect(back.ok).toBe(true);
    expect(back.data).toEqual({
      nomorKartu: '0000000000000',
      nama: 'NAMA ORANG PESERTA BPJS',
      alamat: 'ALAMAT, RT, RW, KELURAHAN, KECAMATAN, KOTA/KABUPATEN',
      tglLhr: '30-12-2026',
      nik: '30000000000000001',
      fktp: 'NAMA FASILITAS KESEHATAN',
      fktpGigi: '-',
      statusPeserta: '0'
    });
  });

  it('mengubah tanggal dari format input date ke DD-MM-YYYY', () => {
    const back = parsePayload(qrContent({ ...FORM, tglLhr: '1990-01-01' }));
    expect(back.data.tglLhr).toBe('01-01-1990');
  });

  it('menghilangkan spasi berlebih pada setiap kolom', () => {
    const back = parsePayload(qrContent({ ...FORM, nama: '  Budi   Santoso  ' }));
    expect(back.data.nama).toBe('Budi   Santoso');
  });

  it('tetap menghasilkan base64 yang sah walau form kosong', () => {
    const encoded = qrContent({});
    const back = parsePayload(encoded);
    expect(back.ok).toBe(true);
    expect(back.data.nomorKartu).toBe('');
  });

  it('tidak memuat karakter base64 yang perlu di-escape pada URL', () => {
    const encoded = qrContent(FORM);
    expect(encoded).not.toContain('=');
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });
});

describe('qrLength', () => {
  it('mencerminkan panjang base64 yang dihasilkan', () => {
    expect(qrLength(FORM)).toBe(qrContent(FORM).length);
  });

  it('panjang wajar untuk QR versi sedang', () => {
    // Data nyata sekitar 300-400 karakter; itu masuk akal untuk QR versi 20-30.
    const len = qrLength(FORM);
    expect(len).toBeGreaterThan(200);
    expect(len).toBeLessThan(600);
  });
});
