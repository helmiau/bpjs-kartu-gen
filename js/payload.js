/**
 * Konversi base64 <-> data peserta BPJS.
 *
 * Catatan penting: sumber asli memakai nama kunci yang tidak konsisten
 * (mis. `nomor-Kartu` dengan tanda hubung, dan nomor kartu 14 digit).
 * Parser di sini sengaja tahan terhadap variasi itu.
 */

const FIELD_ALIASES = {
  nomorKartu: ['nomorkartu', 'nokartu', 'nomorkartubpjs', 'nomorkartubpjs', 'cardnumber'],
  nama: ['nama', 'namapeserta', 'name'],
  alamat: ['alamat', 'address'],
  tglLhr: ['tgllhr', 'tgllahir', 'tanggallahir', 'tgllahir'],
  nik: ['nik', 'nonik'],
  fktp: ['fktp', 'faskes', 'fktp1', 'faskes1'],
  fktpGigi: ['fktpgigi', 'faskesgigi'],
  statusPeserta: ['statuspeserta', 'status']
};

// Urutan kunci pada base64 keluaran. `tglLhr` memakai format DD-MM-YYYY.
const OUTPUT_ORDER = [
  'nomorKartu',
  'nama',
  'alamat',
  'tglLhr',
  'nik',
  'fktp',
  'fktpGigi',
  'statusPeserta'
];

const EMPTY_DATA = () => ({
  nomorKartu: '',
  nama: '',
  alamat: '',
  tglLhr: '',
  nik: '',
  fktp: '',
  fktpGigi: '',
  statusPeserta: ''
});

/**
 * Normalisasi nama kunci: huruf kecil, tanpa tanda hubung/garis bawah/spasi.
 * `nomor-Kartu` dan `nomorKartu` menjadi sama.
 */
function normalizeKey(key) {
  return String(key).toLowerCase().replace(/[\s_-]+/g, '');
}

/**
 * Ubah base64 varian URL-safe (`-`, `_`, tanpa padding) menjadi base64 standar.
 */
function toStandardBase64(input) {
  let text = String(input).trim().replace(/\s+/g, '');
  text = text.replace(/-/g, '+').replace(/_/g, '/');
  const pad = text.length % 4;
  if (pad === 1) throw new Error('panjang base64 tidak sah');
  if (pad > 0) text += '='.repeat(4 - pad);
  return text;
}

/**
 * Dekode base64 menjadi byte UTF-8 aman (btoa/atob hanya aman untuk Latin-1,
 * sedangkan nama orang bisa memakai karakter non-ASCII).
 */
function base64ToUtf8(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

/** Encode teks UTF-8 menjadi base64 standar. */
function utf8ToBase64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Ubah setiap angka literal di JSON menjadi string.
 *
 * Diperlukan karena `JSON.parse` menyimpan angka sebagai Number, dan Number
 * kehilangan presisi di atas 2^53. NIK 17 digit seperti 30000000000000001
 * akan berubah menjadi 30000000000000000 bila dibiarkan. Dengan mengutip
 * lebih dulu, teks aslinya utuh.
 */
function quoteNumbers(jsonText) {
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < jsonText.length; i += 1) {
    const ch = jsonText[i];

    if (inString) {
      out += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }

    const next = jsonText[i + 1] || '';
    const startsNumber = (ch >= '0' && ch <= '9') || (ch === '-' && next >= '0' && next <= '9');
    if (startsNumber) {
      let end = i;
      while (end < jsonText.length && /[0-9eE+\-.]/.test(jsonText[end])) end += 1;
      out += `"${jsonText.slice(i, end)}"`;
      i = end - 1;
      continue;
    }

    out += ch;
  }

  return out;
}

/** Ubah nilai JSON menjadi string tanpa kehilangan presisi angka besar. */
function stringifyValue(value) {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}

/**
 * Petakan objek JSON apa pun ke bentuk data peserta yang dikenal.
 * Kunci dicocokkan lewat normalisasi, bukan pencocokan tepat.
 */
function mapToData(raw) {
  const data = EMPTY_DATA();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return data;

  const normalized = {};
  Object.keys(raw).forEach((key) => {
    normalized[normalizeKey(key)] = raw[key];
  });

  let matched = 0;
  Object.keys(FIELD_ALIASES).forEach((target) => {
    const aliases = FIELD_ALIASES[target];
    for (const alias of aliases) {
      if (Object.prototype.hasOwnProperty.call(normalized, alias)) {
        const value = normalized[alias];
        if (value !== undefined && value !== null) {
          data[target] = stringifyValue(value);
          matched += 1;
        }
        break;
      }
    }
  });

  data.__matched = matched;
  return data;
}

/**
 * Baca teks base64 menjadi data peserta.
 * @returns {{ok: true, data: object} | {ok: false, error: string, data: null}}
 */
export function parsePayload(input) {
  if (typeof input !== 'string' || input.trim() === '') {
    return { ok: false, error: 'EMPTY_INPUT', data: null };
  }

  let standard;
  try {
    standard = toStandardBase64(input);
  } catch {
    return { ok: false, error: 'INVALID_BASE64', data: null };
  }

  let jsonText;
  try {
    jsonText = base64ToUtf8(standard);
  } catch {
    return { ok: false, error: 'INVALID_BASE64', data: null };
  }

  let parsed;
  try {
    parsed = JSON.parse(quoteNumbers(jsonText));
  } catch {
    return { ok: false, error: 'INVALID_JSON', data: null };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { ok: false, error: 'NOT_AN_OBJECT', data: null };
  }

  const data = mapToData(parsed);
  if (data.__matched === 0) {
    return { ok: false, error: 'NO_KNOWN_FIELDS', data: null };
  }

  delete data.__matched;
  return { ok: true, data };
}

/**
 * Ubah data peserta menjadi base64 (standar, tanpa padding) untuk QR.
 * Kunci yang kosong tetap disertakan agar bentuknya tetap.
 */
export function buildPayload(data) {
  const source = data && typeof data === 'object' ? data : {};
  const ordered = {};
  OUTPUT_ORDER.forEach((key) => {
    ordered[key] = source[key] === undefined || source[key] === null ? '' : String(source[key]);
  });

  const json = JSON.stringify(ordered);
  return utf8ToBase64(json).replace(/=+$/, '');
}
