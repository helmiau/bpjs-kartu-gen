/**
 * Isi kode QR pada kartu.
 *
 * Keputusan produk: QR memuat base64 JSON lengkap, bukan hanya nomor kartu.
 * Dengan begitu kartu hasil cetak bisa dipindai kembali untuk mengisi ulang
 * seluruh form, dan satu format dipakai untuk URL maupun pemindaian.
 */

import { buildPayload } from './payload.js';
import { fromFormDate } from './date.js';

/**
 * Susun data peserta dari form menjadi bentuk payload, lalu ubah ke base64.
 * Tanggal lahir diambil dari input date (YYYY-MM-DD) dan ditulis sebagai
 * DD-MM-YYYY agar sama dengan format sumber.
 */
export function qrContent(formData) {
  const source = formData && typeof formData === 'object' ? formData : {};
  const payload = {
    nomorKartu: String(source.nomorKartu || '').trim(),
    nama: String(source.nama || '').trim(),
    alamat: String(source.alamat || '').trim(),
    tglLhr: fromFormDate(String(source.tglLhr || '').trim()),
    nik: String(source.nik || '').trim(),
    fktp: String(source.fktp || '').trim(),
    fktpGigi: String(source.fktpGigi || '').trim(),
    statusPeserta: String(source.statusPeserta || '').trim()
  };
  return buildPayload(payload);
}

/**
 * Panjang data base64 untuk satu data peserta.
 * Dipakai untuk memperkirakan versi QR saat kartu dirender.
 */
export function qrLength(formData) {
  return qrContent(formData).length;
}
