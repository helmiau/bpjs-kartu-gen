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
import { exportSideJpg, exportPdfAll, exportBatchPdf, exportA4Pdf, renderSideToCanvas, downloadBlob } from './exporter.js';
import { composeA4Single } from './a4.js';
import { addEntry, getEntries, clearHistory } from './history.js';
import { readBatchFile, parseDelimited, mapRows, validateBatch, classifyBatchLines } from './batch.js';
import { initI18n, setLang, currentLang, t } from './i18n.js';
import { downloadTemplate } from './templates.js';
import { APP_VERSION } from './version.js';

const FIELDS = ['nomorKartu', 'nama', 'alamat', 'tglLhr', 'nik', 'fktp', 'fktpGigi', 'statusPeserta'];

/** Ambil nilai form saat ini sebagai objek data peserta. */
function readForm() {
  const data = {};
  FIELDS.forEach((name) => {
    const el = document.getElementById(name);
    data[name] = el ? el.value : '';
  });
  if (document.getElementById('autoCapsToggle')?.checked && data.nama) data.nama = data.nama.toUpperCase();
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

/** Apakah barcode ditampilkan. Default: aktif, seperti kartu resmi BPJS. */
function barcodeEnabled() {
  const toggle = document.getElementById('barcodeToggle');
  return toggle ? toggle.checked : false;
}

/** Apakah watermark COPY ditampilkan. Default: aktif. */
function copyMarkEnabled() {
  const toggle = document.getElementById('copyMarkToggle');
  return toggle ? toggle.checked : false;
}

/** Opsi ekspor dari toggle: fotokopi (grayscale), PDF raster, watermark, auto-kapital. */
function exportOptions() {
  const photo = document.getElementById('photoCopyToggle');
  const raster = document.getElementById('rasterPdfToggle');
  return {
    grayscale: photo ? photo.checked : false,
    raster: raster ? raster.checked : false,
    watermark: copyMarkEnabled()
  };
}

/** Mode layout A4 terpilih. */
function a4Mode() {
  const el = document.querySelector('input[name="a4Mode"]:checked');
  return el ? el.value : 'side-by-side';
}
/** Crop marks A4 aktif? */
function isA4Crop() { return !!document.getElementById('a4Crop')?.checked; }
/** Fold line A4 aktif? */
function isA4Fold() { return !!document.getElementById('a4Fold')?.checked; }

/* ---------------- Pratinjau: tab + navigasi kartu ---------------- */
let previewTab = 'front';        // 'front' | 'back' | 'a4'
let previewIndex = 0;            // indeks kartu aktif (batch queue) atau 0

/** Daftar kartu yang bisa dinavigasi: antrean batch valid, atau form tunggal. */
function previewCards() {
  const valid = batchRows.filter((r) => r.ok).map((r) => r.peserta);
  if (valid.length) return valid;
  return [readForm()];
}

/** Data peserta untuk pratinjau kartu aktif. */
function previewData() {
  const autoCaps = !!document.getElementById('autoCapsToggle')?.checked;
  const cards = previewCards();
  if (previewIndex >= cards.length) previewIndex = 0;
  const p = { ...cards[previewIndex] };
  if (autoCaps && p.nama) p.nama = String(p.nama).toUpperCase();
  return p;
}

/** Render ulang pratinjau dari isi form / kartu aktif. */
function refresh() {
  const cards = previewCards();
  if (previewIndex >= cards.length) previewIndex = 0;
  renderCard(previewData(), { showBarcode: barcodeEnabled(), showWatermark: copyMarkEnabled() });
  updatePreviewCounter(cards.length);
  if (previewTab === 'a4') scheduleA4Preview();
  updateDownloadState();
}

/** Perbarui teks & status tombol navigasi kartu. */
function updatePreviewCounter(total) {
  const counter = document.getElementById('previewCounter');
  const prev = document.getElementById('prevCardBtn');
  const next = document.getElementById('nextCardBtn');
  if (counter) counter.textContent = t('preview.counter', { n: previewIndex + 1, total });
  const multi = total > 1;
  if (prev) prev.disabled = !multi || previewIndex <= 0;
  if (next) next.disabled = !multi || previewIndex >= total - 1;
}

/** Pindah tab pratinjau. */
function setPreviewTab(tab) {
  previewTab = tab;
  const map = { front: 'previewFront', back: 'previewBack', a4: 'previewA4' };
  Object.entries(map).forEach(([key, id]) => {
    const panel = document.getElementById(id);
    if (panel) panel.hidden = key !== tab;
    const btn = document.getElementById(`previewTab${key[0].toUpperCase()}${key.slice(1)}`);
    if (btn) {
      btn.classList.toggle('is-active', key === tab);
      btn.setAttribute('aria-selected', String(key === tab));
    }
  });
  if (tab === 'a4') scheduleA4Preview();
  else requestAnimationFrame(fitPreviews);
}

/** Jadwalkan render simulasi A4 (async, debounce ringan). */
let a4PreviewTimer = null;
function scheduleA4Preview() {
  clearTimeout(a4PreviewTimer);
  a4PreviewTimer = setTimeout(renderA4Preview, 60);
}

/** Render simulasi lembar A4 (depan+belakang) ke kanvas kecil. */
async function renderA4Preview() {
  const host = document.getElementById('a4PreviewCanvas');
  if (!host || previewTab !== 'a4') return;
  try {
    const data = previewData();
    const front = await renderSideToCanvas(0, data, { grayscale: !!document.getElementById('photoCopyToggle')?.checked, watermark: copyMarkEnabled() });
    const back = await renderSideToCanvas(1, data, { grayscale: !!document.getElementById('photoCopyToggle')?.checked, watermark: copyMarkEnabled() });
    const sheet = composeA4Single(front, back, { mode: a4Mode(), crop: isA4Crop(), fold: isA4Fold() });
    // Tampilkan sebagai gambar di dalam kanvas host.
    const shown = document.createElement('img');
    shown.alt = 'Simulasi lembar A4 duplex';
    shown.src = sheet.toDataURL('image/jpeg', 0.85);
    shown.style.width = '100%';
    shown.style.height = 'auto';
    shown.style.display = 'block';
    host.replaceChildren(shown);
    applyA4PreviewFit(host, sheet);
  } catch {
    /* lewati bila gagal; tab lain tetap jalan */
  }
}

/** Sesuaikan tinggi stage A4 agar gambar muat tanpa terpotong. */
function applyA4PreviewFit(host, sheet) {
  const stage = host.parentElement;
  if (!stage || !sheet) return;
  const style = getComputedStyle(stage);
  const padY = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0');
  const innerW = stage.clientWidth - parseFloat(style.paddingLeft || '0') - parseFloat(style.paddingRight || '0');
  const h = Math.round((innerW * sheet.height) / sheet.width);
  stage.style.height = `${h + padY}px`;
}

/** Keadaan unduhan: tombol selalu bisa diklik; bila data belum lengkap,
 * klik akan menandai "touched" dan menampilkan galat per kolom.
 * Halaman dibuka bersih - galat baru muncul setelah pengguna mencoba
 * mengunduh atau setelah touched, agar kolom tidak merah sebelum pengguna
 * sempat menulis apa pun (RX-FM-03). */
function updateDownloadState() {
  const result = validate(readForm());
  const note = document.getElementById('downloadNote');
  if (note) note.hidden = result.ok;
  if (result.ok) {
    clearErrors();
  } else if (touched) {
    showErrors(result.errors);
  }
}
/** Tandai pengguna sudah mencoba mengunduh: dari sinilah galat per kolom boleh tampil. */
let touched = false;
function markTouched() {
  touched = true;
  updateDownloadState();
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
  showToast(t('toast.dataLoaded'));
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
  showToast(`${label} ✓`);
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
    el.addEventListener('input', () => { refresh(); persistState(); });
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
    if (file) {
      await scanImageFile(file, (text) => {
        const box = document.getElementById('b64Input');
        if (box) box.value = text;
        fillFromBase64(text, 'scan');
      });
    }
    fileInput.value = '';
  });

  document.getElementById('scanCameraBtn')?.addEventListener('click', () => {
    startCameraScan((text) => {
      const box = document.getElementById('b64Input');
      if (box) box.value = text;
      fillFromBase64(text, 'scan');
    });
  });

  document.getElementById('downloadFrontJpgBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) { markTouched(); return; }
    saveAndDownload(() => exportSideJpg(0, readForm(), exportOptions()), 'JPG sisi depan').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('downloadBackJpgBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) { markTouched(); return; }
    saveAndDownload(() => exportSideJpg(1, readForm(), exportOptions()), 'JPG sisi belakang').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('downloadPdfBtn')?.addEventListener('click', () => {
    if (!validate(readForm()).ok) { markTouched(); return; }
    saveAndDownload(() => exportPdfAll(readForm(), exportOptions()), 'PDF depan dan belakang').catch((error) => {
      setExportStatus(error.message || 'Gagal membuat berkas.', 'error');
    });
  });

  document.getElementById('a4PrintBtn')?.addEventListener('click', async () => {
    const form = readForm();
    if (!validate(form).ok) { markTouched(); return; }
    const status = document.getElementById('a4Status');
    const btn = document.getElementById('a4PrintBtn');
    if (btn) btn.disabled = true;
    if (status) { status.textContent = 'Menyiapkan PDF A4...'; status.dataset.kind = 'busy'; }
    try {
      const opts = { mode: a4Mode(), crop: isA4Crop(), fold: isA4Fold(), grayscale: !!document.getElementById('photoCopyToggle')?.checked, watermark: copyMarkEnabled() };
      const { blob, filename } = await exportA4Pdf(form, opts);
      downloadBlob(blob, filename);
      if (status) { status.textContent = 'PDF A4 duplex siap diunduh.'; status.dataset.kind = 'success'; }
      showToast(t('toast.a4Done'));
    } catch (error) {
      if (status) { status.textContent = error.message || 'Gagal membuat PDF A4.'; status.dataset.kind = 'error'; }
    } finally {
      if (btn) btn.disabled = false;
    }
  });
  document.getElementById('a4PrintNowBtn')?.addEventListener('click', async () => {
    const form = readForm();
    if (!validate(form).ok) { markTouched(); return; }
    const status = document.getElementById('a4Status');
    const btn = document.getElementById('a4PrintNowBtn');
    if (btn) btn.disabled = true;
    if (status) { status.textContent = t('a4.printing'); status.dataset.kind = 'busy'; }
    try {
      const opts = { mode: a4Mode(), crop: isA4Crop(), fold: isA4Fold(), grayscale: !!document.getElementById('photoCopyToggle')?.checked, watermark: copyMarkEnabled() };
      const { blob } = await exportA4Pdf(form, opts);
      const url = URL.createObjectURL(blob);
      const frame = document.createElement('iframe');
      frame.style.position = 'fixed';
      frame.style.right = '100%';
      frame.style.width = '0';
      frame.style.height = '0';
      frame.style.border = '0';
      frame.src = url;
      document.body.appendChild(frame);
      frame.onload = () => {
        frame.contentWindow.focus();
        frame.contentWindow.print();
        setTimeout(() => { URL.revokeObjectURL(url); frame.remove(); if (btn) btn.disabled = false; if (status) { status.textContent = t('a4.printed'); status.dataset.kind = 'success'; } }, 2000);
      };
    } catch (error) {
      if (status) { status.textContent = error.message || t('a4.printErr'); status.dataset.kind = 'error'; if (btn) btn.disabled = false; }
    }
  });

  // Tab pratinjau + navigasi kartu.
  document.getElementById('previewTabFront')?.addEventListener('click', () => setPreviewTab('front'));
  document.getElementById('previewTabBack')?.addEventListener('click', () => setPreviewTab('back'));
  document.getElementById('previewTabA4')?.addEventListener('click', () => setPreviewTab('a4'));
  document.getElementById('prevCardBtn')?.addEventListener('click', () => {
    if (previewIndex > 0) { previewIndex -= 1; refresh(); }
  });
  document.getElementById('nextCardBtn')?.addEventListener('click', () => {
    const total = previewCards().length;
    if (previewIndex < total - 1) { previewIndex += 1; refresh(); }
  });
  // Opsi A4 mengubah simulasi pratinjau.
  document.querySelectorAll('input[name="a4Mode"], #a4Crop, #a4Fold').forEach((el) => {
    el.addEventListener('change', () => { if (previewTab === 'a4') scheduleA4Preview(); });
  });

  document.getElementById('clearHistoryBtn')?.addEventListener('click', () => {
    clearHistory();
    renderHistory();
  });
  document.getElementById('barcodeToggle')?.addEventListener('change', refresh);
  document.getElementById('copyMarkToggle')?.addEventListener('change', refresh);
  document.getElementById('autoCapsToggle')?.addEventListener('change', refresh);
  document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
  bindBatch();
  bindLangButtons();
  bindCollapse();
}
/* ---------------- Batch processing ---------------- */
/** Antrean peserta: [{ peseta, ok, errors, selected }]. */
let batchRows = [];

/* ---------------- Persistensi lokal ---------------- */
const STORE_KEY = 'bpjs-card-gen/v1';

/** Simpan form single + antrean batch ke localStorage. */
function persistState() {
  try {
    const single = {};
    FIELDS.forEach((name) => {
      const el = document.getElementById(name);
      if (el) single[name] = el.value;
    });
    localStorage.setItem(STORE_KEY, JSON.stringify({
      single,
      batch: batchRows.map((r) => ({ peserta: r.peserta, ok: r.ok, errors: r.errors, selected: r.selected }))
    }));
  } catch { /* localStorage penuh/di-block: abaikan */ }
}

/** Pulihkan form single + antrean batch dari localStorage. */
function restoreState() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch { return; }
  if (!raw) return;
  try {
    const state = JSON.parse(raw);
    if (state.single) {
      FIELDS.forEach((name) => {
        if (typeof state.single[name] === 'string') {
          const el = document.getElementById(name);
          if (el) el.value = state.single[name];
        }
      });
    }
    if (Array.isArray(state.batch)) {
      batchRows = state.batch.map((r) => ({ ...r, peserta: r.peserta || {} }));
      if (batchRows.length) renderBatch();
    }
  } catch { /* data korup: mulai kosong */ }
}

/** Ganti tab Single/Batch. */
function setMode(mode) {
  const single = mode === 'single';
  const sBtn = document.getElementById('modeSingleBtn');
  const bBtn = document.getElementById('modeBatchBtn');
  const sPanel = document.getElementById('singleMode');
  const bPanel = document.getElementById('batchMode');
  if (sBtn) { sBtn.classList.toggle('is-active', single); sBtn.setAttribute('aria-selected', String(single)); }
  if (bBtn) { bBtn.classList.toggle('is-active', !single); bBtn.setAttribute('aria-selected', String(!single)); }
  if (sPanel) sPanel.hidden = !single;
  if (bPanel) bPanel.hidden = single;
}

/** Status teks di area batch. */
function setBatchStatus(message, kind) {
  const el = document.getElementById('batchStatus');
  if (!el) return;
  el.textContent = message || '';
  el.dataset.kind = kind || '';
}

/** Tambah hasil validasi (array rows) ke antrean. */
function appendBatch(result) {
  const rows = (result && result.rows) || [];
  if (!rows.length) { setBatchStatus('Tidak ada baris terbaca.', 'error'); return; }
  rows.forEach((r) => batchRows.push({ ...r, selected: r.ok }));
  renderBatch();
  setBatchStatus(
    `${rows.length} baris ditambahkan (${result.validCount} valid, ${result.invalidCount} bermasalah).`,
    result.invalidCount ? 'error' : 'success'
  );
}

/**
 * Decode satu/lebih teks base64 lalu tambahkan ke antrean sebagai baris valid.
 * Lewati kode kosong/rusak; kembalikan ringkasan {added, skipped}.
 */
function appendFromPayloads(texts) {
  let added = 0;
  let skipped = 0;
  texts.forEach((raw) => {
    const code = String(raw || '').trim();
    if (!code) return;
    const result = parsePayload(code);
    if (!result.ok) { skipped += 1; return; }
    const v = validate(result.data);
    batchRows.push({ index: batchRows.length, peserta: result.data, ok: v.ok, errors: v.errors, selected: v.ok });
    added += 1;
  });
  if (added) renderBatch();
  if (added || skipped) {
    const parts = [`${added} kode ditambahkan`];
    if (skipped) parts.push(`${skipped} tidak terbaca`);
    setBatchStatus(parts.join(', ') + '.', skipped ? 'error' : 'success');
    showToast(parts.join(', ') + '.');
  } else {
    setBatchStatus('Tidak ada kode untuk diproses.', 'error');
  }
  return { added, skipped };
}

/** Gambar ulang tabel antrean + hitungan. */
function renderBatch() {
  const body = document.getElementById('batchTableBody');
  const countEl = document.getElementById('batchCount');
  if (!body) return;
  if (countEl) countEl.textContent = String(batchRows.length);
  if (!batchRows.length) {
    body.innerHTML = `<tr class="batch-empty"><td colspan="6">${escapeHtml(t('batch.empty'))}</td></tr>`;
    syncPreviewAfterBatch();
    return;
  }
  body.innerHTML = '';
  batchRows.forEach((row, i) => {
    const tr = document.createElement('tr');
    const p = row.peserta || {};
    tr.innerHTML =
      `<td><input type="checkbox" data-i="${i}" ${row.selected ? 'checked' : ''}></td>` +
      `<td>${i + 1}</td>` +
      `<td>${escapeHtml(p.nomorKartu || '')}</td>` +
      `<td class="col-name">${escapeHtml(p.nama || '')}</td>` +
      `<td>${escapeHtml(p.fktp || '')}</td>` +
      `<td class="${row.ok ? 'status-ok' : 'status-bad'}">${row.ok ? 'Valid' : 'Cek'}</td>`;
    body.appendChild(tr);
  });
  body.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const idx = Number(cb.dataset.i);
      if (batchRows[idx]) batchRows[idx].selected = cb.checked;
    });
  });
  syncPreviewAfterBatch();
  persistState();
}

/** Setelah antrean batch berubah: segarkan pratinjau + navigasi kartu. */
function syncPreviewAfterBatch() {
  const cards = previewCards();
  if (previewIndex >= cards.length) previewIndex = 0;
  renderCard(previewData(), { showBarcode: barcodeEnabled(), showWatermark: copyMarkEnabled() });
  updatePreviewCounter(cards.length);
  if (previewTab === 'a4') scheduleA4Preview();
}

/** Escape HTML untuk teks sel. */
function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

/** Tampilkan notifikasi mikro (toast) selama ~2,4 detik. */
let toastTimer = null;
function showToast(message) {
  const el = document.getElementById('toast');
  const msg = document.getElementById('toastMsg');
  if (!el || !msg) return;
  msg.textContent = message;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add('is-show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('is-show');
    setTimeout(() => { el.hidden = true; }, 250);
  }, 2400);
}

 /** Apakah berkas berupa gambar (sumber QR)? */
 function isImageFile(file) {
  const type = (file.type || '').toLowerCase();
  const name = (file.name || '').toLowerCase();
  return type.startsWith('image/') || /\.(png|jpe?g|webp|bmp|gif)$/.test(name);
 }

/**
 * Proses satu/lebih berkas impor: gambar -> pindai QR -> base64 -> antrean;
 * berkas data (csv/tsv/xlsx/txt) -> tabel -> antrean. Urutan diproses
 * berurutan agar status tidak saling menimpa.
 */
async function handleBatchFiles(files) {
  const list = Array.from(files || []);
  if (!list.length) return;
  const nameEl = document.getElementById('batchFileName');
  if (nameEl) nameEl.textContent = list.length > 1 ? `${list.length} berkas` : list[0].name;
  setBatchStatus(`Memproses ${list.length} berkas...`, 'busy');
  let dataAdded = 0;
  let qrAdded = 0;
  let qrMiss = 0;
  try {
    for (let i = 0; i < list.length; i += 1) {
      const file = list[i];
      setBatchStatus(`Memproses ${i + 1}/${list.length}: ${file.name}...`, 'busy');
      if (isImageFile(file)) {
        const found = [];
        await scanImageFile(file, (text) => found.push(text));
        if (!found.length) { qrMiss += 1; continue; }
        const res = appendFromPayloads(found);
        qrAdded += res.added;
      } else {
        const result = await readBatchFile(file);
        appendBatch(result);
        dataAdded += result.rows.length;
      }
    }
    if (dataAdded || qrAdded) {
      const parts = [];
      if (qrAdded) parts.push(`${qrAdded} dari QR`);
      if (dataAdded) parts.push(`${dataAdded} dari tabel`);
      if (qrMiss) parts.push(`${qrMiss} gambar tanpa QR`);
      setBatchStatus(`Selesai: ${parts.join(', ')}.`, qrMiss ? 'error' : 'success');
    } else if (qrMiss) {
      setBatchStatus(`Tidak ada QR terbaca pada ${qrMiss} gambar.`, 'error');
    }
  } catch (error) {
    setBatchStatus(error.message || 'Gagal membaca berkas.', 'error');
  }
}

/** Ekspor antrean terpilih menjadi satu PDF massal. */
async function exportBatch() {
  const autoCaps = !!document.getElementById('autoCapsToggle')?.checked;
  const selected = batchRows.filter((r) => r.selected && r.ok).map((r) => {
    const p = { ...r.peserta };
    if (autoCaps && p.nama) p.nama = String(p.nama).toUpperCase();
    return p;
  });
  const status = document.getElementById('batchExportStatus');
  const btn = document.getElementById('batchExportPdfBtn');
  if (!selected.length) {
    if (status) { status.textContent = 'Pilih minimal satu baris valid.'; status.dataset.kind = 'error'; }
    return;
  }
  if (btn) btn.disabled = true;
  try {
    const opts = { grayscale: !!document.getElementById('photoCopyToggle')?.checked, raster: !!document.getElementById('rasterPdfToggle')?.checked, watermark: copyMarkEnabled() };
    const { blob, filename } = await exportBatchPdf(selected, opts, (done, total) => {
      if (status) { status.textContent = `Membuat PDF ${done}/${total}...`; status.dataset.kind = 'busy'; }
    });
    downloadBlob(blob, filename);
    if (status) { status.textContent = `Selesai: ${selected.length} kartu (${selected.length * 2} halaman).`; status.dataset.kind = 'success'; }
  } catch (error) {
    if (status) { status.textContent = error.message || 'Gagal membuat PDF.'; status.dataset.kind = 'error'; }
  } finally {
    if (btn) btn.disabled = false;
  }
}

/** Pasang pengikat batch. */
function bindBatch() {
  document.getElementById('modeSingleBtn')?.addEventListener('click', () => setMode('single'));
  document.getElementById('modeBatchBtn')?.addEventListener('click', () => setMode('batch'));

  // Unduh template.
  document.getElementById('tplCsvBtn')?.addEventListener('click', () => downloadTemplate('csv', 'template-peserta').catch((e) => setBatchStatus(e.message || 'Gagal membuat template.', 'error')));
  document.getElementById('tplTsvBtn')?.addEventListener('click', () => downloadTemplate('tsv', 'template-peserta').catch((e) => setBatchStatus(e.message || 'Gagal membuat template.', 'error')));
  document.getElementById('tplXlsxBtn')?.addEventListener('click', () => downloadTemplate('xlsx', 'template-peserta').catch((e) => setBatchStatus(e.message || 'Gagal membuat template.', 'error')));

  document.getElementById('batchPasteBtn')?.addEventListener('click', () => {
    const box = document.getElementById('batchPasteInput');
    const text = box ? box.value : '';
    if (!text.trim()) { setBatchStatus('Kotak tempel masih kosong.', 'error'); return; }
    const { payloadLines, tableLines } = classifyBatchLines(text);
    if (tableLines.length) appendBatch(validateBatch(mapRows(parseDelimited(tableLines.join('\n')))));
    if (payloadLines.length) appendFromPayloads(payloadLines);
    if (!tableLines.length && !payloadLines.length) setBatchStatus('Tidak ada baris terbaca.', 'error');
    if (box) box.value = '';
  });

  // Zona drop + pemilihan berkas (multi: gambar QR dan/atau CSV/XLSX/TSV).
  const fileInput = document.getElementById('batchFileInput');
  const dropzone = document.getElementById('batchDropzone');
  const openPicker = () => fileInput?.click();
  if (dropzone) {
    dropzone.addEventListener('click', openPicker);
    dropzone.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPicker(); }
    });
    dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('is-dragover'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) handleBatchFiles(files);
    });
  }
  fileInput?.addEventListener('change', async () => {
    const files = fileInput.files ? Array.from(fileInput.files) : [];
    if (files.length) await handleBatchFiles(files);
    fileInput.value = '';
  });

  // Tab sumber batch: file vs tempel teks.
  document.querySelectorAll('[data-batch-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const isFile = btn.dataset.batchTab === 'file';
      document.querySelectorAll('[data-batch-tab]').forEach((b) => {
        b.classList.toggle('is-active', b === btn);
        b.setAttribute('aria-selected', b === btn ? 'true' : 'false');
      });
      const filePane = document.getElementById('batchPaneFile');
      const pastePane = document.getElementById('batchPanePaste');
      if (filePane) filePane.hidden = !isFile;
      if (pastePane) pastePane.hidden = isFile;
    });
  });
  document.getElementById('batchPasteClearBtn')?.addEventListener('click', () => {
    const box = document.getElementById('batchPasteInput');
    if (box) box.value = '';
  });

  document.getElementById('batchSelectAllBtn')?.addEventListener('click', () => {
    const allSelected = batchRows.every((r) => r.selected);
    batchRows.forEach((r) => { r.selected = !allSelected; });
    renderBatch();
  });
  document.getElementById('batchRemoveBtn')?.addEventListener('click', () => {
    batchRows = batchRows.filter((r) => !r.selected);
    renderBatch();
  });
  document.getElementById('batchHeadCheck')?.addEventListener('change', (e) => {
    const on = e.target.checked;
    batchRows.forEach((r) => { r.selected = on; });
    renderBatch();
  });

  document.getElementById('batchExportPdfBtn')?.addEventListener('click', exportBatch);
}

/* ---------------- Bahasa (ID/EN) ---------------- */
/** Pasang tombol switch bahasa; sinkronkan aria-pressed. */
function bindLangButtons() {
  const langId = document.getElementById('langIdBtn');
  const langEn = document.getElementById('langEnBtn');
  if (!langId || !langEn) return;
  const apply = (lang) => setLang(lang, () => {
    langId.setAttribute('aria-pressed', String(lang === 'id'));
    langEn.setAttribute('aria-pressed', String(lang === 'en'));
  });
  langId.addEventListener('click', () => apply('id'));
  langEn.addEventListener('click', () => apply('en'));
  const active = currentLang();
  langId.setAttribute('aria-pressed', String(active === 'id'));
  langEn.setAttribute('aria-pressed', String(active === 'en'));
}
 /* ---------------- Panel collapsible ---------------- */
/** Konfigurasi panel yang bisa dilipat. */
const COLLAPSIBLES = [
  { key: 'bpjs-input-collapsed', btn: 'inputToggleBtn', body: 'inputBody' },
  { key: 'bpjs-settings-collapsed', btn: 'settingsToggleBtn', body: 'settingsBody' },
  { key: 'bpjs-a4-collapsed', btn: 'a4ToggleBtn', body: 'a4Body' },
];

/** Pasang toggle collapsible (state tersimpan per panel). */
function bindCollapse() {
  COLLAPSIBLES.forEach(({ key, btn, body }) => {
    const toggle = document.getElementById(btn);
    const panel = document.getElementById(body);
    if (!toggle || !panel) return;
    let collapsed = false;
    try { collapsed = localStorage.getItem(key) === '1'; } catch (e) { /* tanpa storage */ }
    toggle.setAttribute('aria-expanded', String(!collapsed));
    panel.hidden = collapsed;
    const head = toggle.closest('.section-head');
    if (head) head.dataset.collapsed = String(collapsed);
    toggle.addEventListener('click', () => {
      const next = !panel.hidden;
      toggle.setAttribute('aria-expanded', String(!next));
      panel.hidden = next;
      if (head) head.dataset.collapsed = String(next);
      try { localStorage.setItem(key, next ? '1' : '0'); } catch (e) { /* tanpa storage */ }
      if (next) return;
      // Buka panel input: pratinjau baru muat setelah layout jadi.
      if (btn === 'inputToggleBtn') requestAnimationFrame(fitPreviews);
    });
  });
}

/* ---------------- Tema terang/gelap ---------------- */
const THEME_KEY = 'bpjs-theme';
/** Tema aktif saat ini ('light' atau 'dark'). */
function currentTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}
/** Balik tema, simpan, dan sesuaikan label aksesibilitas. */
function toggleTheme() {
  const next = currentTheme() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* tanpa storage */ }
  // Label aksesibilitas tema ikut bahasa aktif; biarkan i18n yang menangani
  // teks statis (data-i18n-aria), cukup pastikan tetap "Ganti tema".
}

/** Skalakan pratinjau agar muat di lebar kontainer. */
function fitPreviews() {
  SCHEMA.sides.forEach((side, index) => {
    const canvas = document.getElementById(`cardCanvas${index}`);
    const stage = canvas && canvas.parentElement;
    if (!canvas || !stage) return;

    const style = getComputedStyle(stage);
    const padX = parseFloat(style.paddingLeft || '0') + parseFloat(style.paddingRight || '0');
    const padY = parseFloat(style.paddingTop || '0') + parseFloat(style.paddingBottom || '0');
    const available = stage.clientWidth - padX;

    const scale = Math.min(1, Math.max(0.1, available / SCHEMA.width));
    canvas.style.transform = `scale(${scale})`;
    stage.style.height = `${SCHEMA.height * scale + padY}px`;
  });
}

window.addEventListener('resize', fitPreviews, { passive: true });

/** Jalankan seluruh inisialisasi halaman. */
function boot() {
  initI18n();
  bind();
  restoreState();
  loadFromUrl();
  refresh();
  fitPreviews();
  renderHistory();
  // Versi web: tampilkan di footer dan catat sekali di konsol.
  const versionEl = document.getElementById('appVersion');
  if (versionEl) versionEl.textContent = `v${APP_VERSION}`;
  console.info(`Generator Kartu BPJS v${APP_VERSION}`);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
