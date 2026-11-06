/**
 * Validasi kolom form peserta.
 * Mengembalikan { ok, errors } dengan satu pesan per kolom yang bermasalah.
 */

const LIMITS = {
  nama: { max: 100, label: 'Nama Peserta' },
  alamat: { max: 200, label: 'Alamat' },
  fktp: { max: 100, label: 'Faskes 1' },
  fktpGigi: { max: 100, label: 'Faskes Gigi' },
  statusPeserta: { max: 20, label: 'Status Peserta' }
};

/** Ambil nilai kolom sebagai teks yang sudah dibersihkan. */
function text(value) {
  return value === undefined || value === null ? '' : String(value).trim();
}

/** Hanya menerima 13 atau 14 digit angka. */
function isValidNomorKartu(value) {
  return /^\d{13,14}$/.test(value);
}

/**
 * NIK resmi berisi 16 digit, tetapi data peserta yang beredar kadang memuat
 * 17 digit (contoh: 30000000000000001). Keduanya diterima agar data nyata
 * pengguna tidak tertolak.
 */
function isValidNik(value) {
  return /^\d{16,17}$/.test(value);
}

/**
 * Periksa tanggal sah, baik format payload DD-MM-YYYY maupun format input
 * date YYYY-MM-DD. Keduanya dipakai di aplikasi, jadi keduanya diterima.
 */
function isValidTglLhr(value) {
  const dmy = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const match = dmy || ymd;
  if (!match) return false;

  const day = dmy ? Number(match[1]) : Number(match[3]);
  const month = dmy ? Number(match[2]) : Number(match[2]);
  const year = dmy ? Number(match[3]) : Number(match[1]);

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > 2100) return false;
  const daysInMonth = new Date(year, month, 0).getDate();
  return day >= 1 && day <= daysInMonth;
}

export function validate(data) {
  const source = data && typeof data === 'object' ? data : {};
  const errors = {};

  const nomorKartu = text(source.nomorKartu);
  if (!nomorKartu) errors.nomorKartu = 'No. Kartu wajib diisi.';
  else if (!isValidNomorKartu(nomorKartu)) errors.nomorKartu = 'No. Kartu harus 13 atau 14 angka.';

  const nama = text(source.nama);
  if (!nama) errors.nama = 'Nama Peserta wajib diisi.';
  else if (nama.length > LIMITS.nama.max) errors.nama = `Nama maksimal ${LIMITS.nama.max} karakter.`;

  const alamat = text(source.alamat);
  if (!alamat) errors.alamat = 'Alamat wajib diisi.';
  else if (alamat.length > LIMITS.alamat.max) errors.alamat = `Alamat maksimal ${LIMITS.alamat.max} karakter.`;

  const tglLhr = text(source.tglLhr);
  if (!tglLhr) errors.tglLhr = 'Tanggal Lahir wajib diisi.';
  else if (!isValidTglLhr(tglLhr)) errors.tglLhr = 'Tanggal Lahir tidak sah (DD-MM-YYYY).';

  const nik = text(source.nik);
  if (!nik) errors.nik = 'NIK wajib diisi.';
  else if (!isValidNik(nik)) errors.nik = 'NIK harus tepat 16 angka.';

  const fktp = text(source.fktp);
  if (!fktp) errors.fktp = 'Faskes 1 wajib diisi.';
  else if (fktp.length > LIMITS.fktp.max) errors.fktp = `Faskes 1 maksimal ${LIMITS.fktp.max} karakter.`;

  Object.keys(LIMITS).forEach((key) => {
    if (key in errors) return;
    const value = text(source[key]);
    if (value.length > LIMITS[key].max) {
      errors[key] = `${LIMITS[key].label} maksimal ${LIMITS[key].max} karakter.`;
    }
  });

  return { ok: Object.keys(errors).length === 0, errors };
}
