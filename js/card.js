/**
 * Perender kartu BPJS dua sisi.
 *
 * Memakai tata letak dari schema.js. Semua nilai dimasukkan lewat textContent,
 * tidak pernah innerHTML, agar payload yang berisi HTML tidak jadi XSS.
 */

import { SCHEMA } from './schema.js';
import { qrContent } from './qr-content.js';
import { fromFormDate } from './date.js';

export { SCHEMA };

/**
 * Nilai kolom untuk satu field, dikembalikan sebagai teks bersih.
 *
 * Tanggal lahir dibaca dari input date (YYYY-MM-DD) tetapi dicetak sebagai
 * DD-MM-YYYY, sama seperti situs sumber. Tanpa konversi ini kartu akan
 * menampilkan format ISO dan validasi akan menolak tanggal yang sah.
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
 * @param {string} qrText isi kode QR yang sudah jadi base64
 */
function createElement(element, formData, qrText) {
  const box = document.createElement('div');
  box.className = `card-el card-${element.type}`;
  box.dataset.elementId = element.id;

  Object.assign(box.style, {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    fontSize: `${element.fontSize}px`,
    color: element.color,
    fontFamily: element.fontFamily || 'Arial',
    fontWeight: element.fontWeight || 'normal',
    fontStyle: element.fontStyle || 'normal',
    textAlign: element.textAlign || 'left'
  });

  if (element.type === 'qrcode') {
    box.classList.add('card-qr');
    const holder = document.createElement('div');
    holder.className = 'card-qr-holder';
    box.appendChild(holder);
    box.__qrText = qrText;
    return box;
  }

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

  box.append(label, separator, value);
  return box;
}

/**
 * Render satu sisi kartu ke dalam elemen kontainer.
 * @param {number} sideIndex 0 = depan, 1 = belakang
 * @param {HTMLElement} container elemen .card-canvas
 * @param {object} formData data peserta
 */
export function renderSide(sideIndex, container, formData) {
  const side = SCHEMA.sides[sideIndex];
  if (!side || !container) return;

  container.style.width = `${SCHEMA.width}px`;
  container.style.height = `${SCHEMA.height}px`;
  container.style.backgroundImage = side.background ? `url('${side.background}')` : 'none';
  container.innerHTML = '';

  const qrText = qrContent(formData);
  side.elements.forEach((element) => {
    container.appendChild(createElement(element, formData, qrText));
  });
}

/** Render semua sisi yang punya kontainer di halaman. */
export function renderCard(formData) {
  SCHEMA.sides.forEach((side, index) => {
    const container = document.getElementById(`cardCanvas${index}`);
    if (container) renderSide(index, container, formData);
  });
  drawQrCodes(formData);
}

/**
 * Gambar QR ke setiap blok kode.
 *
 * QR dihasilkan lewat pustaka qrcode-generator yang di-vendor. Karena data
 * base64 panjang, versi QR dipilih otomatis oleh pustaka; bila data terlalu
 * panjang untuk versi maksimum, blok menampilkan pesan alih-alih gagal diam.
 */
export function drawQrCodes(formData) {
  const qrText = qrContent(formData);
  document.querySelectorAll('.card-qr').forEach((box) => {
    const holder = box.querySelector('.card-qr-holder');
    if (!holder) return;
    holder.innerHTML = '';

    if (!qrText) {
      holder.textContent = 'QR';
      return;
    }

    try {
      const qr = window.qrcode(0, 'M');
      qr.addData(qrText);
      qr.make();

      const count = qr.getModuleCount();
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', `0 0 ${count} ${count}`);
      svg.setAttribute('shape-rendering', 'crispEdges');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Kode QR data peserta');

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', buildQrPath(qr, count));
      path.setAttribute('fill', '#000000');
      svg.appendChild(path);
      holder.appendChild(svg);
    } catch (error) {
      holder.textContent = 'QR terlalu panjang';
      holder.classList.add('card-qr-error');
    }
  });
}

/** Susun satu path SVG dari modul-modul gelap QR. */
function buildQrPath(qr, count) {
  let d = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (qr.isDark(row, col)) {
        d += `M${col} ${row}h1v1h-1z`;
      }
    }
  }
  return d;
}
