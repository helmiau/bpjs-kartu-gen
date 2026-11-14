/**
 * Internasionalisasi UI (ID/EN).
 *
 * Kamus dua bahasa; elemen HTML menandai teks via atribut:
 *   data-i18n="kunci"              -> el.textContent
 *   data-i18n-html="kunci"         -> el.innerHTML (teks ber-markup)
 *   data-i18n-placeholder="kunci"  -> el.placeholder
 *   data-i18n-aria="kunci"         -> el aria-label
 *   data-i18n-title="kunci"        -> el title
 * Bahasa aktif disimpan di localStorage (bpjs-lang).
 */
const STORAGE_KEY = 'bpjs-lang';
const FALLBACK = 'id';

const DICT = {
  id: {
    'app.title': 'Generator Kartu BPJS - e-Kartu',
    'header.tagline': 'Generator Kartu Indonesia Sehat — semua diproses di perangkat Anda.',
    'header.badge': '100% di perangkat Anda',
    'header.theme': 'Ganti tema terang/gelap',
    'header.themeTitle': 'Ganti tema',
    'header.github': 'Lihat kode sumber di GitHub',
    'header.lang': 'Pilihan bahasa',
    'input.heading': 'Data Peserta',
    'input.sub': 'Kelola nomor kartu, nama, NIK, faskes — isi manual atau otomatis.',
    'input.tag': 'Wajib Lengkap',
    'input.toggle': 'Lipat/buka panel Data Peserta',
    'mode.single': 'Single',
    'mode.batch': 'Batch',
    'qf.title': 'Isi otomatis data',
    'qf.tag': 'QR & Base64',
    'qf.sub': 'Isi otomatis via kode tertempel, unggah foto kartu, atau kamera.',
    'qf.upload': 'Unggah gambar',
    'qf.camera': 'Kamera',
    'qf.b64label': 'Kode base64 hasil paste / pindai',
    'qf.b64placeholder': 'Tempel kode base64 di sini, atau hasil pindai QR akan muncul otomatis',
    'qf.fill': 'Isi dari Kode',
    'qf.clear': 'Bersihkan',
    'f.nomorKartu': 'No. Kartu',
    'f.nama': 'Nama Peserta',
    'f.alamat': 'Alamat',
    'f.tglLhr': 'Tanggal Lahir',
    'f.nik': 'NIK',
    'f.fktp': 'Faskes 1',
    'f.nomorKartuHtml': 'Nomor Kartu BPJS (13 digit) <span class="req" aria-hidden="true">*</span>',
    'f.namaHtml': 'Nama Lengkap Peserta <span class="req" aria-hidden="true">*</span>',
    'f.alamatHtml': 'Alamat Lengkap <span class="req" aria-hidden="true">*</span>',
    'f.tglLhrHtml': 'Tanggal Lahir (DD-MM-YYYY) <span class="req" aria-hidden="true">*</span>',
    'f.nikHtml': 'NIK (16 digit) <span class="req" aria-hidden="true">*</span>',
    'f.fktpHtml': 'Faskes 1 <span class="req" aria-hidden="true">*</span>',
    'f.fktpGigi': 'Faskes Gigi',
    'f.status': 'Status Peserta',
    'f.qrhint': 'Ikut tersimpan dalam kode QR.',
    'batch.import': 'Impor data peserta (Excel, CSV, atau tempel)',
    'batch.upload': 'Unggah berkas',
    'batch.filename': '.xlsx, .csv, atau .tsv',
    'batch.tabFile': 'Impor file',
    'batch.tabPaste': 'Tempel teks',
    'batch.pasteHelp': 'Tempel data TSV/CSV (satu peserta per baris) atau kode base64 (satu per baris). Format terdeteksi otomatis.',
    'batch.pastePlaceholder': 'Nomor Kartu\tNama\tAlamat\tTanggal Lahir\tNIK\tFaskes\n0000000000000\tNAMA CONTOH\tALAMAT CONTOH\t22-12-1997\t0000000000000000\tFASKES CONTOH',
    'batch.pasteProcess': 'Proses & tambah',
    'batch.pasteClear': 'Bersihkan',
    'batch.template': 'Unduh template:',
    'batch.tplCsv': 'CSV',
    'batch.tplTsv': 'TSV',
    'batch.tplXlsx': 'XLSX',
    'batch.dropAria': 'Seret berkas CSV, Excel, atau gambar QR ke sini, atau klik untuk memilih',
    'batch.dropText': 'Seret berkas ke sini, atau klik untuk memilih',
    'batch.dropHint': 'CSV, TSV, XLSX, atau banyak gambar QR (.png/.jpg) sekaligus',
    'batch.empty': 'Belum ada data. Unggah berkas, tempel, atau tambahkan kode di atas.',
    'batch.queue': 'Antrean kartu',
    'batch.selectAll': 'Pilih semua',
    'batch.remove': 'Hapus terpilih',
    'batch.colNo': 'No',
    'batch.colKartu': 'No. Kartu',
    'batch.colNama': 'Nama',
    'batch.colFaskes': 'Faskes',
    'batch.colStatus': 'Status',
    'batch.export': 'Unduh PDF massal',
    'batch.cancel': 'Batal',
    'batch.exporting': 'Membuat PDF {done}/{total}…',
    'batch.exportDone': 'Selesai: {count} kartu ({pages} halaman).',
    'batch.exportCancelled': 'Ekspor dibatalkan.',
    'batch.exportErr': 'Gagal membuat PDF.',
    'preview.heading': 'Pratinjau & Unduhan',
    'preview.sub': 'Depan & belakang kartu, siap JPG atau PDF.',
    'preview.front': 'Sisi Depan',
    'preview.tabFront': 'Sisi Depan',
    'preview.tabBack': 'Sisi Belakang',
    'preview.tabA4': 'Simulasi A4 Duplex',
    'preview.prev': '◂ Sebelumnya',
    'preview.next': 'Berikutnya ▸',
    'preview.counter': 'Kartu #{n} / {total}',
    'preview.back': 'Sisi Belakang',
    'preview.pdf': 'Unduh PDF',
    'preview.frontJpg': 'JPG Depan',
    'preview.backJpg': 'JPG Belakang',
    'preview.note': 'Lengkapi kolom bertanda * untuk mengunduh kartu.',
    'preview.barcode': 'Tampilkan barcode 1D Code-128 di atas kartu',
    'preview.watermark': 'Watermark teks "COPY" di sisi kanan kartu',
    'preview.autoCaps': 'Huruf kapital otomatis untuk nama',
    'preview.copy': 'Fotokopi hitam-putih (JPG & PDF) — kontras tinggi',
    'preview.raster': 'Rasterisasi PDF 300 DPI (teks tidak bisa diedit)',
    'settings.heading': 'Pengaturan Render & Visual',
    'settings.sub': 'Kustomisasi elemen visual, efek fotokopi, dan proteksi cetak.',
    'settings.toggle': 'Lipat/buka Pengaturan Render & Visual',
    'a4.heading': 'Layout Cetak A4 Bolak-Balik (Duplex)',
    'a4.sub': 'Sisi depan & belakang dalam 1 lembar A4, siap lipat & cetak.',
    'a4.toggle': 'Lipat/buka Layout Cetak A4',
    'a4.modeLabel': 'Format & posisi cetak duplex',
    'a4.modeSide': 'Berdampingan (lipat kiri-kanan)',
    'a4.modeVert': 'Vertikal (lipat atas-bawah)',
    'a4.modeGrid': 'Grid lembar penuh A4 (grid)',
    'a4.crop': 'Tampilkan crop marks (garis potong)',
    'a4.fold': 'Garis putus lipatan tengah (fold line)',
    'a4.size': 'Ukuran kartu: 85,60 × 53,98 mm (ISO/IEC 7810 ID-1).',
    'a4.print': 'Simpan PDF A4 Duplex',
    'a4.printNow': 'Cetak A4 Duplex',
    'a4.printing': 'Menyiapkan cetakan A4…',
    'a4.printed': 'Dialog cetak dibuka.',
    'a4.printErr': 'Gagal membuka cetakan.',
    'history.heading': 'Riwayat Cetak',
    'history.clear': 'Hapus',
    'history.hint': 'Riwayat hanya tersimpan di perangkat ini.',
    'toast.dataLoaded': 'Data peserta berhasil dimuat.',
    'toast.a4Done': 'PDF A4 duplex siap diunduh.',
    'footer.warning': '<strong>Perhatian:</strong> kartu yang dihasilkan adalah tiruan visual untuk keperluan latihan atau pratinjau. Kartu ini <strong>tidak sah secara hukum</strong> dan tidak diverifikasi oleh BPJS Kesehatan.',
    'footer.note': 'Tidak ada data yang dikirim ke server. Semua proses berjalan di peramban Anda.',
    'footer.made': 'Dibuat oleh',
    'footer.source': 'kode sumber'
  },
  en: {
    'app.title': 'BPJS Card Generator - e-Card',
    'header.tagline': 'Indonesia Healthy Card Generator — everything runs on your device.',
    'header.badge': '100% on your device',
    'header.theme': 'Toggle light/dark theme',
    'header.themeTitle': 'Toggle theme',
    'header.github': 'View source code on GitHub',
    'header.lang': 'Language selection',
    'input.heading': 'Participant Data',
    'input.sub': 'Manage card number, name, NIK, facility — manual or automatic input.',
    'input.tag': 'Required',
    'input.toggle': 'Collapse/expand Participant Data panel',
    'mode.single': 'Single',
    'mode.batch': 'Batch',
    'qf.title': 'Auto-fill data',
    'qf.tag': 'QR & Base64',
    'qf.sub': 'Auto-fill via pasted code, uploaded card photo, or camera.',
    'qf.upload': 'Upload image',
    'qf.camera': 'Camera',
    'qf.b64label': 'Base64 code from paste / scan',
    'qf.b64placeholder': 'Paste base64 code here, or QR scan result appears automatically',
    'qf.fill': 'Fill from Code',
    'qf.clear': 'Clear',
    'f.nomorKartu': 'Card No.',
    'f.nama': 'Participant Name',
    'f.alamat': 'Address',
    'f.tglLhr': 'Date of Birth',
    'f.nik': 'NIK',
    'f.fktp': 'Facility 1',
    'f.nomorKartuHtml': 'BPJS Card Number (13 digits) <span class="req" aria-hidden="true">*</span>',
    'f.namaHtml': 'Participant Full Name <span class="req" aria-hidden="true">*</span>',
    'f.alamatHtml': 'Full Address <span class="req" aria-hidden="true">*</span>',
    'f.tglLhrHtml': 'Date of Birth (DD-MM-YYYY) <span class="req" aria-hidden="true">*</span>',
    'f.nikHtml': 'NIK (16 digits) <span class="req" aria-hidden="true">*</span>',
    'f.fktpHtml': 'Facility 1 <span class="req" aria-hidden="true">*</span>',
    'f.fktpGigi': 'Dental Facility',
    'f.status': 'Participant Status',
    'f.qrhint': 'Stored in the QR code.',
    'batch.import': 'Import participant data (Excel, CSV, or paste)',
    'batch.upload': 'Upload file',
    'batch.filename': '.xlsx, .csv, or .tsv',
    'batch.tabFile': 'Import file',
    'batch.tabPaste': 'Paste text',
    'batch.pasteHelp': 'Paste TSV/CSV data (one participant per line) or base64 codes (one per line). Format auto-detected.',
    'batch.pastePlaceholder': 'Card No\tName\tAddress\tDOB\tNIK\tFacility\n0000000000000\tNAMA CONTOH\tALAMAT CONTOH\t22-12-1997\t0000000000000000\tFASKES CONTOH',
    'batch.pasteProcess': 'Process & add',
    'batch.pasteClear': 'Clear',
    'batch.template': 'Download template:',
    'batch.tplCsv': 'CSV',
    'batch.tplTsv': 'TSV',
    'batch.tplXlsx': 'XLSX',
    'batch.dropAria': 'Drop CSV, Excel, or QR images here, or click to choose',
    'batch.dropText': 'Drop files here, or click to choose',
    'batch.dropHint': 'CSV, TSV, XLSX, or many QR images (.png/.jpg) at once',
    'batch.queue': 'Card queue',
    'batch.selectAll': 'Select all',
    'batch.remove': 'Remove selected',
    'batch.colNo': 'No',
    'batch.colKartu': 'Card No.',
    'batch.colNama': 'Name',
    'batch.colFaskes': 'Facility',
    'batch.colStatus': 'Status',
    'batch.empty': 'No data yet. Upload a file, paste, or add a code above.',
    'batch.export': 'Batch download PDF',
    'batch.cancel': 'Cancel',
    'batch.exporting': 'Building PDF {done}/{total}…',
    'batch.exportDone': 'Done: {count} cards ({pages} pages).',
    'batch.exportCancelled': 'Export cancelled.',
    'batch.exportErr': 'Failed to build PDF.',
    'preview.heading': 'Preview & Downloads',
    'preview.sub': 'Front & back cards, ready as JPG or PDF.',
    'preview.front': 'Front Side',
    'preview.tabFront': 'Front Side',
    'preview.tabBack': 'Back Side',
    'preview.tabA4': 'A4 Duplex Sim',
    'preview.prev': '◂ Prev',
    'preview.next': 'Next ▸',
    'preview.counter': 'Card #{n} / {total}',
    'preview.back': 'Back Side',
    'preview.pdf': 'Download PDF',
    'preview.frontJpg': 'JPG Front',
    'preview.backJpg': 'JPG Back',
    'preview.note': 'Fill the columns marked * to download the card.',
    'preview.barcode': 'Show 1D Code-128 barcode on the card',
    'preview.watermark': 'Watermark text "COPY" on the right side',
    'preview.autoCaps': 'Auto uppercase for name',
    'preview.copy': 'Black-and-white copy (JPG & PDF) — high contrast',
    'preview.raster': 'Rasterize PDF at 300 DPI (text not editable)',
    'settings.heading': 'Render & Visual Settings',
    'settings.sub': 'Customize visual elements, photocopy effects, and print protection.',
    'settings.toggle': 'Collapse/expand Render & Visual Settings',
    'a4.heading': 'A4 Duplex Print Layout',
    'a4.sub': 'Front & back in one A4 sheet, ready to fold & print.',
    'a4.toggle': 'Collapse/expand A4 Print Layout',
    'a4.modeLabel': 'Duplex print format & position',
    'a4.modeSide': 'Side-by-side (fold left-right)',
    'a4.modeVert': 'Vertical (fold top-bottom)',
    'a4.modeGrid': 'Full A4 sheet grid',
    'a4.crop': 'Show crop marks',
    'a4.fold': 'Center fold line (dashed)',
    'a4.size': 'Card size: 85.60 × 53.98 mm (ISO/IEC 7810 ID-1).',
    'a4.print': 'Save A4 Duplex PDF',
    'a4.printNow': 'Print A4 Duplex',
    'a4.printing': 'Preparing A4 print…',
    'a4.printed': 'Print dialog opened.',
    'a4.printErr': 'Failed to open print.',
    'history.heading': 'Print History',
    'history.clear': 'Clear',
    'history.hint': 'History is stored on this device only.',
    'toast.dataLoaded': 'Participant data loaded.',
    'toast.a4Done': 'A4 duplex PDF ready.',
    'footer.warning': '<strong>Notice:</strong> the generated card is a visual replica for practice or preview purposes. This card <strong>is not legally valid</strong> and is not verified by BPJS Kesehatan.',
    'footer.note': 'No data is sent to a server. All processing runs in your browser.',
    'footer.made': 'Created by',
    'footer.source': 'source code'
  }
};

let active = FALLBACK;

/** Terjemahan satu kunci untuk bahasa aktif; `params` mengganti {nama}. */
export function t(key, params) {
  let text = (DICT[active] && DICT[active][key]) || (DICT[FALLBACK][key]) || key;
  if (params && typeof params === 'object') {
    text = text.replace(/\{(\w+)\}/g, (m, name) => (name in params ? String(params[name]) : m));
  }
  return text;
}

/** Bahasa aktif saat ini. */
export function currentLang() { return active; }

/** Terjemahkan semua elemen bertanda di dokumen. */
function apply(root) {
  const q = root.querySelectorAll.bind(root);
  q('[data-i18n]').forEach((el) => { el.textContent = t(el.getAttribute('data-i18n')); });
  q('[data-i18n-html]').forEach((el) => { el.innerHTML = t(el.getAttribute('data-i18n-html')); });
  q('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.getAttribute('data-i18n-placeholder')); });
  q('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria'))); });
  q('[data-i18n-title]').forEach((el) => { el.title = t(el.getAttribute('data-i18n-title')); });
  const titleEl = document.querySelector('title[data-i18n]');
  if (titleEl) document.title = t(titleEl.getAttribute('data-i18n'));
}

/** Ganti bahasa, simpan, terjemahkan, lalu beri tahu pemanggil. */
export function setLang(lang, onChange) {
  active = DICT[lang] ? lang : FALLBACK;
  try { localStorage.setItem(STORAGE_KEY, active); } catch (e) { /* tanpa storage */ }
  document.documentElement.setAttribute('lang', active === 'en' ? 'en' : 'id');
  apply(document);
  if (typeof onChange === 'function') onChange(active);
}

/** Inisialisasi: baca preferensi, pasang bahasa awal. */
export function initI18n(onChange) {
  let lang = FALLBACK;
  try { lang = localStorage.getItem(STORAGE_KEY) || FALLBACK; } catch (e) { /* tanpa storage */ }
  active = DICT[lang] ? lang : FALLBACK;
  document.documentElement.setAttribute('lang', active === 'en' ? 'en' : 'id');
  apply(document);
  if (typeof onChange === 'function') onChange(active);
}
