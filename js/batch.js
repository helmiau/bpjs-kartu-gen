/**
 * Pemrosesan batch: ubah tabel (CSV/TSV/XLSX) menjadi daftar peserta yang
 * tervalidasi. Semua di sisi klien, tanpa server.
 */

import { readXlsxRows } from './xlsx.js';
import { validate } from './validate.js';
import { parsePayload } from './payload.js';

/**
 * Pisahkan baris teks tempel menjadi kandidat base64 payload vs baris tabel
 * (TSV/CSV). Kandidat payload harus lolos parsePayload; selain itu jadi tabel.
 * @param {string} text teks tempelan
 * @returns {{payloadLines:string[], tableLines:string[]}}
 */
export function classifyBatchLines(text) {
  const payloadLines = [];
  const tableLines = [];
  const lines = String(text).split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  for (const line of lines) {
    const looks = line.length >= 16 && !/\s/.test(line) && /^[A-Za-z0-9+/=_-]+$/.test(line);
    if (looks && parsePayload(line).ok) { payloadLines.push(line); continue; }
    tableLines.push(line);
  }
  return { payloadLines, tableLines };
}
/** Kolom yang dikenal, dengan alias header (huruf kecil) untuk pemetaan. */
const FIELD_ALIASES = {
  nomorKartu: ['nomor kartu', 'no kartu', 'no. kartu', 'nokartu', 'nomorkartu', 'kartu', 'bpjs'],
  nama: ['nama', 'nama peserta', 'nama lengkap', 'name'],
  alamat: ['alamat', 'address', 'alamat lengkap'],
  tglLhr: ['tanggal lahir', 'tgl lahir', 'tgl. lahir', 'tanggallahir', 'lahir', 'dob', 'birth'],
  nik: ['nik', 'no ktp', 'no. ktp', 'ktp'],
  fktp: ['faskes', 'faskes 1', 'fktp', 'fasilitas kesehatan', 'faskes1'],
  fktpGigi: ['faskes gigi', 'fktp gigi', 'gigi'],
  statusPeserta: ['status', 'status peserta', 'statuspeserta']
};

/** Normalisasi header: huruf kecil, spasi tunggal, tanpa tanda baca tepi. */
function normHeader(h) {
  return String(h || '')
    .toLowerCase()
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bangun peta kolom: indeks -> nama field (berdasarkan baris header). */
function mapHeader(headerRow) {
  const map = {};
  headerRow.forEach((cell, idx) => {
    const key = normHeader(cell);
    if (!key) return;
    for (const field of Object.keys(FIELD_ALIASES)) {
      if (FIELD_ALIASES[field].includes(key)) { map[idx] = field; return; }
    }
  });
  return map;
}

/**
 * Pecah teks CSV/TSV menjadi baris × kolom. Mendukung tanda kutip ganda
 * (RFC 4180): kutip di dalam dibalas "--" jadi "" dan boleh berisi pemisah/baris baru.
 * Pemisah dideteksi: tab bila ada, selain itu koma atau titik-koma.
 */
export function parseDelimited(text) {
  const src = String(text || '').replace(/^\uFEFF/, '');
  const firstLine = src.split(/\r?\n/)[0] || '';
  let delim = ',';
  if (firstLine.includes('\t')) delim = '\t';
  else if (firstLine.includes(';') && !firstLine.includes(',')) delim = ';';

  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  for (let i = 0; i < src.length; i += 1) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cell += '"'; i += 1; }
        else inQuotes = false;
      } else cell += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delim) {
      row.push(cell); cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i += 1;
      row.push(cell); cell = '';
      rows.push(row); row = [];
    } else {
      cell += ch;
    }
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((c) => String(c).trim() !== ''));
}

/** Ubah nilai tanggal beragam menjadi format payload DD-MM-YYYY bila mungkin. */
export function normalizeDate(value) {
  const s = String(value || '').trim();
  if (!s) return '';
  // YYYY-MM-DD atau YYYY/MM/DD
  let m = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/.exec(s);
  if (m) return `${pad(m[3])}-${pad(m[2])}-${m[1]}`;
  // DD-MM-YYYY atau DD/MM/YYYY
  m = /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/.exec(s);
  if (m) return `${pad(m[1])}-${pad(m[2])}-${m[3]}`;
  // Excel serial date (angka) -> tanggal
  if (/^\d{1,5}(\.\d+)?$/.test(s)) {
    const serial = Number(s);
    if (serial > 20000 && serial < 80000) {
      const ms = Math.round((serial - 25569) * 86400000);
      const d = new Date(ms);
      if (!isNaN(d.getTime())) {
        return `${pad(d.getUTCDate())}-${pad(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
      }
    }
  }
  return s; // biarkan validasi menolak format tak dikenal
}

function pad(n) { return String(n).padStart(2, '0'); }

/**
 * Ubah baris mentah (termasuk baris header) menjadi daftar peserta.
 * @param {string[][]} rawRows
 * @returns {Array<object>} peserta (selalu berisi 8 field, boleh kosong)
 */
export function mapRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) return [];
  const header = rawRows[0];
  const colMap = mapHeader(header);
  // Baris dianggap header hanya bila: minimal 2 kolom dikenal DAN tidak memuat
  // nomor panjang (baris data selalu memuat nomor kartu/NIK 10+ digit). Bila
  // ragu, tabel dipetakan dengan urutan kolom default.
  const looksLikeData = /\d{10,}/.test(header.join(' '));
  const useIndexDefault = looksLikeData || Object.keys(colMap).length < 2;
  const defaultOrder = ['nomorKartu', 'nama', 'alamat', 'tglLhr', 'nik', 'fktp', 'fktpGigi', 'statusPeserta'];

  const body = useIndexDefault ? rawRows : rawRows.slice(1);
  return body.map((cells) => {
    const peserta = {};
    if (useIndexDefault) {
      defaultOrder.forEach((field, idx) => { peserta[field] = String(cells[idx] ?? '').trim(); });
    } else {
      for (const [idx, field] of Object.entries(colMap)) {
        peserta[field] = String(cells[idx] ?? '').trim();
      }
    }
    peserta.tglLhr = normalizeDate(peserta.tglLhr);
    return peserta;
  });
}

/**
 * Validasi tiap peserta. Kembalikan baris dengan status valid + pesan galat.
 */
export function validateBatch(pesertaList) {
  let validCount = 0;
  const rows = pesertaList.map((peserta, index) => {
    const result = validate(peserta);
    if (result.ok) validCount += 1;
    return { index, peserta, ok: result.ok, errors: result.errors };
  });
  return { rows, validCount, invalidCount: rows.length - validCount };
}

/**
 * Baca berkas (File) menjadi daftar peserta tervalidasi.
 * @param {File} file berkas .csv/.tsv/.txt/.xlsx
 * @returns {Promise<{rows:Array, validCount:number, invalidCount:number}>}
 */
export async function readBatchFile(file) {
  const name = (file.name || '').toLowerCase();
  let rawRows;
  if (name.endsWith('.xlsx')) {
    rawRows = await readXlsxRows(await file.arrayBuffer());
  } else {
    rawRows = parseDelimited(await file.text());
  }
  return validateBatch(mapRows(rawRows));
}
