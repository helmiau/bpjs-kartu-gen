import { currentLang } from './i18n.js';

const guides = {
  id: {
    title: 'Cara Penggunaan', close: 'Tutup panduan', button: 'Cara penggunaan',
    input: ['Data Peserta', 'Isi kolom wajib pada mode Single. Gunakan nomor kartu 13 digit dan NIK 16 digit.', 'Untuk mengisi otomatis, tempel kode Base64 atau pindai kode QR melalui unggah gambar atau kamera. Periksa kembali hasilnya.', 'Untuk banyak peserta, buka tab Batch, masukkan data melalui pilihan yang tersedia, lalu periksa hasil validasi sebelum mengunduh.', 'Periksa pratinjau kartu. Setelah data lengkap, pilih Unduh PDF atau JPG depan/belakang.'],
    settings: ['Pengaturan Render & Visual', 'Atur tampilan barcode, watermark COPY, dan huruf kapital otomatis sesuai kebutuhan.', 'Pilih layout PDF: sepasang kartu berdampingan (default) atau satu kartu per halaman.', 'Aktifkan rasterisasi PDF bila teks perlu menyatu dengan gambar. Pilihan ini tidak menjamin berkas tidak dapat diubah.', 'Periksa pratinjau sebelum mengunduh. Pengaturan PDF tidak mengubah ukuran lembar A4.'],
    a4: ['Cetak A4 Bolak-Balik', 'Lengkapi Data Peserta terlebih dahulu.', 'Pilih susunan kartu dan penanda potong atau lipat yang diperlukan.', 'Periksa tab Simulasi A4 Duplex, lalu gunakan tombol unduh atau cetak pada panel A4.', 'Saat mencetak, pilih ukuran kertas A4 dan skala 100% atau ukuran sebenarnya. Periksa orientasi serta arah balik kertas melalui satu cetak percobaan.'],
    overall: ['Panduan Lengkap', 'Isi Data Peserta secara manual atau melalui kode/pemindaian. Gunakan Batch untuk banyak peserta.', 'Periksa nomor kartu, nama, NIK, alamat, tanggal lahir, dan fasilitas kesehatan pada pratinjau.', 'Buka Pengaturan Render & Visual untuk mengatur barcode, watermark, kapitalisasi, serta layout PDF.', 'Unduh PDF untuk kedua sisi kartu atau JPG untuk satu sisi. Untuk lembar A4, gunakan panel Cetak A4 Bolak-Balik.', 'Data diproses di peramban. Riwayat cetak dapat dibersihkan melalui tombol pada bagian Riwayat Cetak. Kartu yang dihasilkan merupakan tiruan visual, bukan kartu resmi terverifikasi.']
  },
  en: {
    title: 'Usage Guide', close: 'Close guide', button: 'How to use',
    input: ['Participant Data', 'Complete the required fields in Single mode. Use a 13-digit card number and a 16-digit national ID number.', 'For automatic entry, paste a Base64 code or scan a QR code using an image upload or camera. Review the results.', 'For multiple participants, open Batch, use the available input methods, then review validation before downloading.', 'Check the card preview. Once complete, download the PDF or front/back JPG.'],
    settings: ['Render & Visual Settings', 'Adjust the barcode, COPY watermark, and automatic uppercase options.', 'Choose the PDF layout: a side-by-side card pair (default), or one card per page.', 'Enable PDF rasterization to merge text into the image. This does not guarantee the file cannot be modified.', 'Review the preview before downloading. PDF layout settings do not change the A4 sheet size.'],
    a4: ['A4 Duplex Printing', 'Complete Participant Data first.', 'Choose the card arrangement and any crop or fold marks needed.', 'Review the A4 Duplex Simulation tab, then use the A4 download or print controls.', 'Print on A4 paper at 100% or actual size. Check orientation and duplex flip direction with one trial print.'],
    overall: ['Complete Guide', 'Enter participant data manually or through code/scanning. Use Batch for multiple participants.', 'Review the card number, name, national ID, address, birth date, and health facility in the preview.', 'Open Render & Visual Settings to adjust the barcode, watermark, uppercase option, and PDF layout.', 'Download a PDF for both card sides or a JPG for one side. Use the A4 Duplex panel for A4 sheets.', 'Data is processed in your browser. Clear print history using its Clear button. Generated cards are visual replicas, not verified official cards.']
  }
};

export function bindHelp() {
  const dialog = document.createElement('dialog');
  dialog.className = 'help-dialog modal-dialog';
  dialog.setAttribute('aria-labelledby', 'helpTitle');
  const head = document.createElement('div');
  head.className = 'modal-head';
  const title = document.createElement('h2');
  title.id = 'helpTitle';
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'btn btn-secondary btn-small';
  const body = document.createElement('ol');
  body.className = 'modal-body';
  head.append(title, close);
  dialog.append(head, body);
  document.body.append(dialog);
  let opener;
  let previousOverflow;
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    opener?.focus();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('keydown', (event) => event.stopPropagation());
  const open = (topic, trigger) => {
    const copy = guides[currentLang()] || guides.id;
    const [heading, ...steps] = copy[topic];
    title.textContent = heading;
    close.textContent = copy.close;
    body.replaceChildren(...steps.map((text) => {
      const item = document.createElement('li');
      item.textContent = text;
      return item;
    }));
    opener = trigger;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    close.focus();
  };
  for (const [topic, toggleId] of [['input', 'inputToggleBtn'], ['settings', 'settingsToggleBtn'], ['a4', 'a4ToggleBtn'], ['overall', 'aboutChangelogBtn']]) {
    const anchor = document.getElementById(toggleId);
    if (!anchor) continue;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-secondary btn-small help-btn';
    button.dataset.help = topic;
    button.setAttribute('aria-haspopup', 'dialog');
    button.dataset.i18nAria = 'help.button';
    button.dataset.i18nTitle = 'help.button';
    const label = (guides[currentLang()] || guides.id).button;
    button.setAttribute('aria-label', label);
    button.title = label;
    button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><line x1="12" y1="11" x2="12" y2="16"></line><line x1="12" y1="8" x2="12" y2="8.01"></line></svg>';
    button.addEventListener('click', (event) => { event.stopPropagation(); open(topic, button); });
    anchor.before(button);
  }
}
