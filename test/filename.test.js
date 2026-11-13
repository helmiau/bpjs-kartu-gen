import { describe, it, expect } from 'vitest';
import { exportFilename } from '../js/exporter.js';

describe('exportFilename', () => {
  const form = { nomorKartu: '0000000000000' };

  it('TEST-NAME-001 PDF: KARTU_<nomor>-BPJS.pdf', () => {
    expect(exportFilename(form, null, 'pdf')).toBe('KARTU_0000000000000-BPJS.pdf');
  });

  it('TEST-NAME-002 JPG depan: KARTU_<nomor>-BPJS_DEPAN.jpg', () => {
    expect(exportFilename(form, 'DEPAN', 'jpg')).toBe('KARTU_0000000000000-BPJS_DEPAN.jpg');
  });

  it('TEST-NAME-003 JPG belakang: KARTU_<nomor>-BPJS_BELAKANG.jpg', () => {
    expect(exportFilename(form, 'BELAKANG', 'jpg')).toBe('KARTU_0000000000000-BPJS_BELAKANG.jpg');
  });

  it('membersihkan spasi & non-alfanumerik pada nomor', () => {
    expect(exportFilename({ nomorKartu: '0001 2345/67890' }, 'DEPAN', 'jpg'))
      .toBe('KARTU_0001234567890-BPJS_DEPAN.jpg');
  });

  it('nomor kosong/absen -> TANPA-NOMOR', () => {
    expect(exportFilename({}, null, 'pdf')).toBe('KARTU_TANPA-NOMOR-BPJS.pdf');
    expect(exportFilename(undefined, null, 'pdf')).toBe('KARTU_TANPA-NOMOR-BPJS.pdf');
  });
});
