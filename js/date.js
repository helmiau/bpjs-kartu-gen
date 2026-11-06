/**
 * Konversi tanggal antara format payload (DD-MM-YYYY) dan
 * format input HTML date (YYYY-MM-DD).
 */

/** Urai tanggal DD-MM-YYYY atau DD/MM/YYYY menjadi bagian angka. */
function parseDayMonthYear(value) {
  const match = /^(\d{2})[-/](\d{2})[-/](\d{4})$/.exec(String(value).trim());
  if (!match) return null;
  return { day: Number(match[1]), month: Number(match[2]), year: Number(match[3]) };
}

/** Periksa apakah tanggal benar-benar ada pada kalender. */
function isValidDayMonthYear(parts) {
  if (!parts) return false;
  if (parts.month < 1 || parts.month > 12) return false;
  if (parts.year < 1900 || parts.year > 2100) return false;
  const daysInMonth = new Date(parts.year, parts.month, 0).getDate();
  return parts.day >= 1 && parts.day <= daysInMonth;
}

const pad = (n) => String(n).padStart(2, '0');

/**
 * DD-MM-YYYY (payload/QR) -> YYYY-MM-DD (input date).
 * Mengembalikan string kosong bila tidak sah.
 */
export function toFormDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') return '';

  const text = String(value).trim();

  // Sudah dalam format input date.
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const parts = {
      year: Number(text.slice(0, 4)),
      month: Number(text.slice(5, 7)),
      day: Number(text.slice(8, 10))
    };
    return isValidDayMonthYear(parts) ? text : '';
  }

  const parts = parseDayMonthYear(text);
  if (!isValidDayMonthYear(parts)) return '';
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

/**
 * YYYY-MM-DD (input date) -> DD-MM-YYYY (payload/QR).
 */
export function fromFormDate(value) {
  if (value === undefined || value === null || String(value).trim() === '') return '';
  const text = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return '';
  const year = text.slice(0, 4);
  const month = text.slice(5, 7);
  const day = text.slice(8, 10);
  return `${day}-${month}-${year}`;
}
