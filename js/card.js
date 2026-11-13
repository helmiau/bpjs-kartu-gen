/**
 * Perender kartu BPJS dua sisi.
 *
 * Memakai tata letak dari schema.js. Semua nilai dimasukkan lewat textContent,
 * tidak pernah innerHTML, agar payload yang berisi HTML tidak jadi XSS.
 *
 * Tata letak mengikuti kartu resmi BPJS: label, posisi titik dua, posisi nilai,
 * dan barcode Code 128 berisi nomor kartu. Lihat schema.js untuk rinciannya.
 */

import { SCHEMA, BARCODE_BLOCK } from './schema.js';
import { fromFormDate } from './date.js';
import { fitFontSize } from './pdf-text.js';

export { SCHEMA };

/**
 * Gambar barcode Code 128 berisi nomor kartu.
 *
 * Barcode di kartu resmi BPJS memakai Code 128 (terverifikasi lewat decoder
 * ZXing pada KARTU_0001701425046.pdf), berisi 13 digit nomor kartu. Dihasilkan
 * sebagai SVG supaya hasil ekspor tetap tajam pada skala besar.
 *
 * Barcode ini opsional: hanya digambar bila showBarcode bernilai benar.
 * Bila pustaka JsBarcode tidak dimuat, blok dibiarkan kosong tanpa galat.
 *
 * @param {object} formData data peserta
 * @param {boolean} showBarcode apakah barcode ditampilkan
 */
function drawBarcode(formData, showBarcode) {
  document.querySelectorAll('.card-barcode').forEach((box) => {
    box.innerHTML = '';
    if (!showBarcode) return;

    const nomor = formData && formData.nomorKartu ? String(formData.nomorKartu) : '';
    if (!nomor) return;

    if (typeof window.JsBarcode !== 'function') return;

    try {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `Barcode nomor kartu ${nomor}`);
      box.appendChild(svg);

      window.JsBarcode(svg, nomor, {
        format: 'CODE128',
        width: 1,
        height: BARCODE_BLOCK.height,
        displayValue: false,
        margin: 0,
        lineColor: '#000000',
        background: '#ffffff'
      });
    } catch {
      box.textContent = '';
    }
  });
}

/**
 * Nilai kolom untuk satu field, dikembalikan sebagai teks bersih.
 *
 * Tanggal lahir dibaca dari input date (YYYY-MM-DD) tetapi dicetak sebagai
 * DD-MM-YYYY, sama seperti kartu resmi.
 */
function fieldValue(formData, fieldName) {
  if (!fieldName) return '';
  const value = formData ? formData[fieldName] : '';
  if (fieldName === 'tglLhr') return fromFormDate(value || '');
  return value === undefined || value === null ? '' : String(value);
}

/**
 * Buat satu elemen blok kartu sesuai tipe.
 * @param {object} element deskripsi blok dari schema
 * @param {object} formData data peserta
 */
function createElement(element, formData) {
  const box = document.createElement('div');
  box.className = `card-el card-${element.type}`;
  box.dataset.elementId = element.id;

  Object.assign(box.style, {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    // height tetap, sesuai sumber: tata letak memakai posisi absolut, sehingga
    // blok yang membesar ke bawah akan menimpa baris berikutnya. Nilai lebih
    // panjang dari blok dipotong oleh overflow: hidden pada .card-el.
    height: `${element.height}px`,
    width: `${element.width}px`,
    fontSize: `${element.fontSize}px`,
    color: element.color,
    fontFamily: element.fontFamily || 'Arial',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textAlign: element.textAlign || 'left'
  });
  if (element.type === 'multiline') {
    box.classList.add('card-multiline');
    box.textContent = element.label || '';
    return box;
  }
  // type === 'text'
  box.classList.add('card-text');
  const label = document.createElement('span');
  label.className = 'card-label';
  label.textContent = String(element.prefix || '').replace(/\s*:\s*$/, '').trim();
  const separator = document.createElement('span');
  separator.className = 'card-separator';
  separator.textContent = ':';
  const value = document.createElement('span');
  value.className = 'card-value';
  value.textContent = fieldValue(formData, element.field);
  // Shrink-to-fit: kecilkan font agar nilai panjang (mis. alamat 3 baris)
  // tetap muat dalam tinggi blok, konsisten dengan PDF (pdf-text.js).
  const valueX = element.x + 67 + 2 + 9 + 2;
  const valueWidth = Math.max(element.fontSize, element.x + element.width - valueX);
  const fontSize = fitFontSize(value.textContent, element.fontSize, valueWidth, element.height);
  if (fontSize !== element.fontSize) box.style.fontSize = `${fontSize}px`;
  box.append(label, separator, value);
  return box;
}

/**
 * Render satu sisi kartu ke dalam elemen kontainer.
 * @param {number} sideIndex 0 = depan, 1 = belakang
 * @param {HTMLElement} container elemen .card-canvas
 * @param {object} formData data peserta
 * @param {object|boolean} opts {showBarcode, showWatermark} atau boolean (barcode)
 */
export function renderSide(sideIndex, container, formData, opts = {}) {
  const options = typeof opts === 'boolean' ? { showBarcode: opts } : opts;
  const side = SCHEMA.sides[sideIndex];
  if (!side || !container) return;

  container.style.width = `${SCHEMA.width}px`;
  container.style.height = `${SCHEMA.height}px`;
  container.style.backgroundImage = side.background ? `url('${side.background}')` : 'none';
  container.innerHTML = '';

  side.elements.forEach((element) => {
    container.appendChild(createElement(element, formData));
  });

  // Barcode hanya ada di sisi depan.
  if (sideIndex === 0) {
    const barcode = document.createElement('div');
    barcode.className = 'card-barcode';
    barcode.style.left = `${BARCODE_BLOCK.x}px`;
    barcode.style.top = `${BARCODE_BLOCK.y}px`;
    barcode.style.width = `${BARCODE_BLOCK.width}px`;
    barcode.style.height = `${BARCODE_BLOCK.height}px`;
    container.appendChild(barcode);
    drawBarcode(formData, options.showBarcode);
  }

  // Watermark "COPY" di sisi kanan (sisi depan saja), di atas semua elemen.
  if (sideIndex === 0 && options.showWatermark) {
    const mark = document.createElement('div');
    mark.className = 'card-watermark';
    mark.textContent = 'COPY';
    mark.setAttribute('aria-hidden', 'true');
    container.appendChild(mark);
  }
}

/**
 * Render semua sisi yang punya kontainer di halaman.
 * @param {object} formData data peserta
 * @param {object|boolean} opts {showBarcode, showWatermark} atau boolean (barcode)
 */
export function renderCard(formData, opts = {}) {
  SCHEMA.sides.forEach((side, index) => {
    const container = document.getElementById(`cardCanvas${index}`);
    if (container) renderSide(index, container, formData, opts);
  });
}
