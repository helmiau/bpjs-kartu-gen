/**
 * Riwayat cetak lokal.
 *
 * Hanya menyimpan gambar hasil ekspor (data URL) dan nama berkas. Tidak
 * menyimpan NIK atau nomor kartu dalam bentuk teks yang bisa dibaca orang
 * lain yang membuka perangkat ini.
 */

const STORAGE_KEY = 'bpjs-card-history-v1';
const MAX_ENTRIES = 10;

function storage() {
  try {
    return window.localStorage;
  } catch {
    return null; // Mode privat bisa memblokir localStorage.
  }
}

function readAll() {
  const store = storage();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(entries) {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
    return true;
  } catch {
    return false; // Kuota penuh atau diblokir.
  }
}

/**
 * Tambah satu entri riwayat.
 * @param {{filename: string, dataUrl: string}} entry
 */
export function addEntry(entry) {
  if (!entry || !entry.dataUrl || !entry.filename) return false;
  const entries = readAll();
  entries.unshift({
    filename: String(entry.filename),
    dataUrl: String(entry.dataUrl),
    savedAt: new Date().toISOString()
  });
  return writeAll(entries);
}

/** Ambil seluruh entri, terbaru lebih dulu. */
export function getEntries() {
  return readAll();
}

/** Kosongkan riwayat. */
export function clearHistory() {
  const store = storage();
  if (!store) return false;
  try {
    store.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

/** Batas entri yang disimpan. */
export const MAX_HISTORY_ENTRIES = MAX_ENTRIES;
