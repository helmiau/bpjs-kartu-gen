/**
 * Template unduhan untuk impor batch (CSV, TSV, XLSX).
 *
 * Konten: satu baris header + satu baris contoh valid, sesuai kolom yang
 * dikenali `mapRows` (batch.js). Contoh memakai data fiktif agar pengguna
 * bisa langsung coba tanpa mengubah struktur.
 */

import { writeXlsxRows } from './xlsx.js';

/** Header + baris contoh (kolom yang dikenali pemetaan batch). */
export const TEMPLATE_ROWS = [
  ['Nomor Kartu', 'Nama', 'Alamat', 'Tanggal Lahir', 'NIK', 'Faskes', 'Faskes Gigi', 'Status Peserta'],
  ['0000000000000', 'NAMA CONTOH', 'ALAMAT CONTOH', '22-12-1997', '0000000000000000', 'FASKES CONTOH', '', 'Aktif']
];

/** Susun satu sel CSV (RFC 4180). */
function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

/** Isi CSV (dengan BOM agar Excel mendeteksi UTF-8). */
export function templateCsv(rows = TEMPLATE_ROWS) {
  return '\uFEFF' + rows.map((r) => r.map(csvCell).join(',')).join('\r\n');
}

/** Isi TSV (tab sebagai pemisah). */
export function templateTsv(rows = TEMPLATE_ROWS) {
  return '\uFEFF' + rows.map((r) => r.map((c) => String(c ?? '').replace(/\t/g, ' ')).join('\t')).join('\r\n');
}

/** Isi XLSX (ArrayBuffer). */
export async function templateXlsx(rows = TEMPLATE_ROWS) {
  const bytes = await writeXlsxRows(rows);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Unduh berkas sesuai format (csv|tsv|xlsx). */
export async function downloadTemplate(format, filename) {
  let blob;
  let name = filename;
  const base = (filename || 'template-peserta').replace(/\.(csv|tsv|xlsx)$/i, '');
  if (format === 'tsv') {
    blob = new Blob([templateTsv()], { type: 'text/tab-separated-values;charset=utf-8' });
    name = `${base}.tsv`;
  } else if (format === 'xlsx') {
    blob = new Blob([await templateXlsx()], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    name = `${base}.xlsx`;
  } else {
    blob = new Blob([templateCsv()], { type: 'text/csv;charset=utf-8' });
    name = `${base}.csv`;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}
