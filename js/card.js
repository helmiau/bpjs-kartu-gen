/**
 * Perender kartu BPJS dua sisi.
 *
 * Memakai tata letak dari schema.js. Semua nilai dimasukkan lewat textContent,
 * tidak pernah innerHTML, agar payload yang berisi HTML tidak jadi XSS.
 *
 * Kartu tidak memuat kode QR/barcode: lihat catatan pada schema.js.
 */

import { SCHEMA } from './schema.js';
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
 */
function createElement(element, formData) {
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

  side.elements.forEach((element) => {
    container.appendChild(createElement(element, formData));
  });
}

/** Render semua sisi yang punya kontainer di halaman. */
export function renderCard(formData) {
  SCHEMA.sides.forEach((side, index) => {
    const container = document.getElementById(`cardCanvas${index}`);
    if (container) renderSide(index, container, formData);
  });
}
