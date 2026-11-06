/**
 * Orkestrasi aplikasi: form, pratinjau, URL, pemindai, ekspor, riwayat.
 *
 * Modul aplikasi dipakai sebagai skrip biasa (bukan ES module) agar bisa
 * berjalan langsung dari berkas statis tanpa server build. Setiap modul
 * mengekspor nama yang sama ke window.
 */

import { renderCard, SCHEMA } from './card.js';
import { parsePayload } from './payload.js';
import { toFormDate } from './date.js';
import { validate } from './validate.js';
import { scanImageFile, startCameraScan } from './scanner.js';
import { exportSideJpg, exportPdfAll, downloadBlob } from './exporter.js';
import { addEntry, getEntries, clearHistory } from './history.js';

const FIELDS = ['nomorKartu', 'nama', 'alamat', 'tglLhr', 'nik', 'fktp', 'fktpGigi', 'statusPeserta'];

/** Ambil nilai form saat ini sebagai objek data peserta. */
function readForm() {
  const data = {};
  FIELDS.forEach((name) => {
    const el = document.getElementById(name);
    data[name] = el ? el.value : '';
  });
  return data;
}

/**
 * Ubah data peserta (format payload DD-MM-YYYY) menjadi nilai form
 * (input date memakai YYYY-MM-DD).
 */
function dataToFormValues(data) {
  return {
    nomorKartu: data.nomorKartu || '',
    nama: data.nama || '',
    alamat: data.alamat || '',
    tglLhr: toFormDate(data.tglLhr || ''),
    nik: data.nik || '',
    fktp: data.fktp || '',
    fktpGigi: data.fktpGigi || '',
    statusPeserta: data.statusPeserta || ''
  };
}

/** Tulis nilai ke form dan segarkan pratinjau. */
function writeForm(values) {
  FIELDS.forEach((name) => {
    const el = document.getElementById(name);
    if (el) el.value = values[name] === undefined ? '' : values[name];
  });
  refresh();
}

function setExportStatus(message, kind) {
  const el = document.getElementById('exportStatus');
  if (!el) return;
  el.textContent = message || '';
  el.dataset.kind = kind || '';
}

/** Tampilkan galat validasi di dekat kolom terkait. */
function showErrors(errors) {
  FIELDS.forEach((name) => {
    const input = document.getElementById(name);
    const slot = document.getElementById(`err-${name}`);
    const message = errors[name] || '';
    if (slot) slot.textContent = message;
    if (input) {
      if (message) input.setAttribute('aria-invalid', 'true');
      else input.removeAttribute('aria-invalid');
    }
  });
}

function clearErrors() {
  showErrors({});
}

/** Render ulang pratinjau dari isi form. */
function refresh() {
  renderCard(readForm());
  updateDownloadState();
}

/** Tombol unduh hanya aktif bila data wajib sudah sah. */
function updateDownloadState() {
  const result = validate(readForm());
  ['downloadFrontJpgBtn', 'downloadBackJpgBtn', 'downloadPdfBtn'].forEach((id) => {
    const button = document.getElementById(id);
    if (button) button.disabled = !result.ok;
  });
  if (!result.ok) {
    showErrors(result.errors);
  } else {
    clearErrors();
  }
}

/** Isi form dari teks base64 (dari kotak tempel, QR, atau URL). */
function fillFromBase64(text, source) {
  const result = parsePayload(text);
  if (!result.ok) {
    const messages = {
      EMPTY_INPUT: 'Kode kosong. Tempel atau pindai kode terlebih dahulu.',
      INVALID_BASE64: 'Kode tidak dapat dibaca. Pastikan salinan lengkap.',
      INVALID_JSON: 'Isi kode tidak dikenali sebagai data peserta.',
      NOT_AN_OBJECT: 'Isi kode tidak dikenali sebagai data peserta.',
      NO_KNOWN_FIELDS: 'Tidak ada data peserta pada kode ini.'
    };
    setExportStatus(messages[result.error] || 'Kode tidak dapat dibaca.', 'error');
    return false;
  }
  writeForm(dataToFormValues(result.data));
  setExportStatus(source === 'url' ? 'Data dimuat dari URL.' : 'Data terisi dari kode.', 'success');
  return true;
}

/** Simpan hasil ekspor ke riwayat dan unduh berkasnya. */
async function saveAndDownload(job, label) {
  setExportStatus(`Menyiapkan ${label}…`, 'busy');
  const result = await job();
  const dataUrl = await blobToDataUrl(result.blob);
  addEntry({ filename: result.filename, dataUrl });
  downloadBlob(result.blob, result.filename);
  renderHistory();
  setExportStatus(`${label} selesai diunduh.`, 'success');
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Gambar gagal disimpan ke riwayat.'));
    reader.readAsDataURL(blob);
  });
}

/** Gambar daftar riwayat. */
function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  list.innerHTML = '';

  const entries = getEntries();
  if (!entries.length) {
    const empty = document.createElement('li');
    empty.className = 'history-empty';
    empty.textContent = 'Belum ada kartu yang diunduh.';
    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement('li');
    item.className = 'history-item';

    const img = document.createElement('img');
    img.src = entry.dataUrl;
    img.alt = `Pratinjau ${entry.filename}`;
    img.width = 110;

    const link = document.createElement('a');
    link.href = entry.dataUrl;
    link.download = entry.filename;
    link.textContent = 'Unduh lagi';

    item.append(img, link);
    list.appendChild(item);
  });
}

/** Baca ?data= dari URL dan isi form bila ada. */
function loadFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('data');
  if (!raw) return false;
  return fillFromBase64(raw, 'url');
}

/** Pasang seluruh pengikat ke elemen halaman. */
function bind() {
  document.querySelectorAll('.dynamic-input, #pesertaForm input, #pesertaForm textarea').forEach((el) => {
    el.addEventListener('input', refresh);
  });

  document.getElementById('fillFromB64Btn')?.addEventListener('click', () => {
    const box = document.getElementById('b64Input');
    fillFromBase64(box ? box.value : '', 'manual');
  });

  document.getElementById('clearB64Btn')?.addEventListener('click', () => {
    const box = document.getElementById('b64Input');
    if (box) box.value = '';
  });

  const fileInput = document.getElementById('qrImageInput');
  document.getElementById('scanImageBtn')?.addEventListener('click', () => fileInput?.click());
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) await scanImageFile(file, (text) => fillFromBase64(text, 'scan'));
    fileInput.value = '';
  });

  document.getElementById('scanCameraBtn')?.addEventListener('click', () => {
    startCameraScan((text) => fillFromBase64(text, 'scan'));
  });

  document.getElementById('downloadFrontJpgBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) return;
    saveAndDownload(() => exportSideJpg(0), 'JPG sisi depan').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('downloadBackJpgBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) return;
    saveAndDownload(() => exportSideJpg(1), 'JPG sisi belakang').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) return;
    saveAndDownload(() => exportPdfAll(), 'PDF depan dan belakang').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });
}

/** Skalakan pratinjau agar muat di lebar kontainer. */
function fitPreviews() {
  SCHEMA.sides.forEach((side, index) => {
    const canvas = document.getElementById(`cardCanvas${index}`);
    const stage = canvas && canvas.parentElement;
    if (!canvas || !stage) return;

    const style = getComputedStyle(stage);
    const available = stage.clientWidth
      - parseFloat(style.paddingLeft || '0')
      - parseFloat(style.paddingRight || '0');

    const scale = Math.min(1, Math.max(0.1, available / SCHEMA.width));
    canvas.style.transform = `scale(${scale})`;
    stage.style.height = `${SCHEMA.height * scale}px`;
  });
}

window.addEventListener('resize', fitPreviews, { passive: true });

/** Jalankan seluruh inisialisasi halaman. */
function boot() {
  bind();
  loadFromUrl();
  refresh();
  fitPreviews();
  renderHistory();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
