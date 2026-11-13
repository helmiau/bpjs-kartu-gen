/**
 * Pembaca XLSX minimal di sisi peramban, tanpa pustaka luar.
 *
 * Berkas .xlsx adalah arsip ZIP berisi XML. Modul ini:
 *   1. Membaca direktori pusat ZIP (central directory) untuk menemukan entri.
 *   2. Men-dekompres tiap entri (deflate-raw atau stored) memakai
 *      DecompressionStream bawaan peramban (tersedia di Chrome/Edge/Firefox/Safari
 *      modern). Tidak ada pemuatan dari CDN.
 *   3. Mengurai sharedStrings.xml dan worksheet pertama menjadi baris teks.
 *
 * Cakupan sengaja kecil: cukup untuk tabel data (sel teks/angka inline atau
 * shared). Tidak menangani formula, gaya, gambar, atau lembar selain pertama.
 * Bila butuh lebih, konversi ke CSV adalah jalur yang lebih sederhana.
 */

/* ----------------------------- ZIP ----------------------------- */

/** Baca u16/u32 little-endian dari DataView. */
function u16(view, offset) { return view.getUint16(offset, true); }
function u32(view, offset) { return view.getUint32(offset, true); }

/** Cari signature End Of Central Directory (0x06054b50) dari belakang. */
function findEocd(view) {
  const maxScan = Math.min(view.byteLength, 66000);
  for (let i = view.byteLength - 22; i >= view.byteLength - maxScan && i >= 0; i -= 1) {
    if (u32(view, i) === 0x06054b50) return i;
  }
  return -1;
}

/** Petakan entri ZIP: { nama -> {method, compSize, compOffset} }. */
function readCentralDirectory(view, bytes) {
  const eocd = findEocd(view);
  if (eocd < 0) throw new Error('Berkas bukan ZIP/XLSX yang sah.');
  const total = u16(view, eocd + 10);
  let ptr = u32(view, eocd + 16); // offset awal central directory
  const entries = {};
  for (let n = 0; n < total; n += 1) {
    if (u32(view, ptr) !== 0x02014b50) break;
    const method = u16(view, ptr + 10);
    const compSize = u32(view, ptr + 20);
    const nameLen = u16(view, ptr + 28);
    const extraLen = u16(view, ptr + 30);
    const commentLen = u16(view, ptr + 32);
    const localOffset = u32(view, ptr + 42);
    const name = new TextDecoder('utf-8').decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    entries[name] = { method, compSize, localOffset };
    ptr += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

/** Ambil byte terkompresi satu entri (melewati local file header). */
function localDataOffset(view, bytes, entry) {
  const ptr = entry.localOffset;
  const nameLen = u16(view, ptr + 26);
  const extraLen = u16(view, ptr + 28);
  return ptr + 30 + nameLen + extraLen;
}

/** Dekompres deflate-raw via DecompressionStream. */
async function inflateRaw(slice) {
  const stream = new Blob([slice]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

/** Ambil isi teks satu entri sebagai string. */
async function readEntryText(view, bytes, entries, name) {
  const entry = entries[name];
  if (!entry) return null;
  const start = localDataOffset(view, bytes, entry);
  const slice = bytes.subarray(start, start + entry.compSize);
  let raw;
  if (entry.method === 0) raw = slice; // stored
  else if (entry.method === 8) raw = await inflateRaw(slice); // deflate
  else throw new Error(`Metode kompresi ZIP tidak didukung (${entry.method}).`);
  return new TextDecoder('utf-8').decode(raw);
}

/* ----------------------------- XLSX ----------------------------- */

/** Dekode referensi kolom Excel (A, B, ... AA) menjadi indeks 0-based. */
function colIndex(ref) {
  const letters = ref.replace(/\d+/g, '');
  let value = 0;
  for (let i = 0; i < letters.length; i += 1) {
    value = value * 26 + (letters.charCodeAt(i) - 64);
  }
  return value - 1;
}

/** Ambil teks dari elemen <si>/<is> (menggabungkan semua <t>). */
function richText(xml) {
  const parts = [];
  const re = /<t[^>]*>([\s\S]*?)<\/t>/g;
  let m;
  while ((m = re.exec(xml))) parts.push(m[1]);
  return parts.join('');
}

/** Urai sharedStrings.xml menjadi array string. */
function parseSharedStrings(xml) {
  if (!xml) return [];
  const out = [];
  const re = /<si>([\s\S]*?)<\/si>/g;
  let m;
  while ((m = re.exec(xml))) {
    out.push(unescapeXml(richText(m[1])));
  }
  return out;
}

/** Urai XML worksheet menjadi baris nilai (string/angka). */
function parseSheet(xml, shared) {
  const rows = [];
  const rowRe = /<row[^>]*>([\s\S]*?)<\/row>/g;
  let rm;
  while ((rm = rowRe.exec(xml))) {
    const row = [];
    const cellRe = /<c\b([^>]*)>([\s\S]*?)<\/c>/g;
    let cm;
    while ((cm = cellRe.exec(rm[1]))) {
      const attrs = cm[1];
      const body = cm[2];
      const rMatch = /r="([A-Z]+\d+)"/.exec(attrs);
      const tMatch = /t="([^"]+)"/.exec(attrs);
      const idx = rMatch ? colIndex(rMatch[1]) : row.length;
      const type = tMatch ? tMatch[1] : 'n';
      let value = '';
      if (type === 's') {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body);
        value = v ? (shared[Number(v[1])] || '') : '';
      } else if (type === 'inlineStr') {
        value = unescapeXml(richText(body));
      } else if (type === 'str') {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body);
        value = v ? unescapeXml(v[1]) : '';
      } else {
        const v = /<v>([\s\S]*?)<\/v>/.exec(body);
        value = v ? v[1] : '';
      }
      row[idx] = value;
    }
    // Isi sel kosong yang bolong agar kolom rata.
    for (let i = 0; i < row.length; i += 1) if (row[i] === undefined) row[i] = '';
    rows.push(row);
  }
  return rows;
}

/** Ganti entitas XML dasar. */
function unescapeXml(text) {
  return String(text)
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&amp;/g, '&');
}

/**
 * Baca berkas .xlsx (ArrayBuffer) menjadi matriks baris.
 * @param {ArrayBuffer|Uint8Array} buffer
 * @returns {Promise<string[][]>} baris × kolom teks
 */
export async function readXlsxRows(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const entries = readCentralDirectory(view, bytes);

  // Temukan worksheet pertama yang bukan _rels.
  const sheetName = Object.keys(entries)
    .filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name))
    .sort()[0];
  if (!sheetName) throw new Error('Tidak ada lembar kerja di berkas XLSX.');

  const sharedXml = await readEntryText(view, bytes, entries, 'xl/sharedStrings.xml');
  const sheetXml = await readEntryText(view, bytes, entries, sheetName);
  const shared = parseSharedStrings(sharedXml);
  return parseSheet(sheetXml, shared);
}

/* ----------------------------- ZIP WRITE ----------------------------- */

/** Tabel CRC-32 (satu kali, dipakai ulang). */
let CRC_TABLE = null;
function crc32(bytes) {
  if (!CRC_TABLE) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n += 1) {
      let c = n;
      for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Deflate-raw via CompressionStream; bila tak ada, kembalikan stored (method 0). */
async function deflateRaw(data) {
  if (typeof CompressionStream === 'function') {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    return { method: 8, data: new Uint8Array(await new Response(stream).arrayBuffer()) };
  }
  return { method: 0, data: new Uint8Array(data) };
}

/** Escape teks untuk XML. */
function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

/** Indeks kolom Excel (0 -> A, 26 -> AA). */
function colRef(i) {
  let ref = '';
  i += 1;
  while (i > 0) { const m = (i - 1) % 26; ref = String.fromCharCode(65 + m) + ref; i = (i - m - 1) / 26; }
  return ref;
}

/**
 * Bangun berkas .xlsx (1 lembar, sharedStrings) dari matriks baris.
 * @param {string[][]} rows baris × kolom
 * @returns {Promise<Uint8Array>} isi berkas
 */
export async function writeXlsxRows(rows) {
  const shared = [];
  const sharedIdx = new Map();
  const ssi = (text) => {
    const s = String(text);
    if (sharedIdx.has(s)) return sharedIdx.get(s);
    sharedIdx.set(s, shared.length);
    shared.push(s);
    return shared.length - 1;
  };
  const grid = rows.map((r) => r.map(String));

  // Isi sheet.
  const rowsXml = grid.map((row, ri) => {
    const cells = row.map((v, ci) => `<c r="${colRef(ci)}${ri + 1}" t="s"><v>${ssi(v)}</v></c>`).join('');
    return `<row r="${ri + 1}">${cells}</row>`;
  }).join('');

  const content = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/></Types>`;
  const rels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const workbookRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/></Relationships>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowsXml}</sheetData></worksheet>`;
  const sharedXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="${shared.length}" uniqueCount="${shared.length}">${shared.map((s) => `<si><t>${escapeXml(s)}</t></si>`).join('')}</sst>`;

  const files = [
    ['[Content_Types].xml', content],
    ['_rels/.rels', rels],
    ['xl/workbook.xml', workbook],
    ['xl/_rels/workbook.xml.rels', workbookRels],
    ['xl/worksheets/sheet1.xml', sheet],
    ['xl/sharedStrings.xml', sharedXml]
  ];

  // Kompres tiap entri, susun ZIP.
  const enc = new TextEncoder();
  const localParts = [];
  const centralParts = [];
  let offset = 0;
  for (const [name, text] of files) {
    const nameBytes = enc.encode(name);
    const orig = enc.encode(text);
    const crc = crc32(orig);
    const { method, data } = await deflateRaw(orig);

    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true);      // sig
    lv.setUint16(4, 20, true);                 // version
    lv.setUint16(6, 0, true);                  // flags
    lv.setUint16(8, method, true);             // method
    lv.setUint16(10, 0, true);                 // time
    lv.setUint16(12, 0, true);                 // date
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true);
    lv.setUint32(22, orig.length, true);
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    localParts.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true);
    cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true);
    cv.setUint16(10, method, true);
    cv.setUint16(12, 0, true);
    cv.setUint16(14, 0, true);
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, orig.length, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);
    cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true);
    cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offset, true);
    central.set(nameBytes, 46);
    centralParts.push(central);

    offset += local.length;
  }

  const centralSize = centralParts.reduce((s, c) => s + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, centralParts.length, true);
  ev.setUint16(10, centralParts.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const out = new Uint8Array(offset + centralSize + 22);
  let p = 0;
  for (const part of localParts) { out.set(part, p); p += part.length; }
  for (const part of centralParts) { out.set(part, p); p += part.length; }
  out.set(eocd, p);
  return out;
}
