import { describe, it, expect } from 'vitest';
import { writeXlsxRows, readXlsxRows } from '../js/xlsx.js';

const rows = [
  ['Nomor Kartu', 'Nama', 'Alamat', 'Tanggal Lahir', 'NIK', 'Faskes'],
  ['0000000000000', 'NAMA CONTOH', 'ALAMAT CONTOH', '22-12-1997', '0000000000000000', 'FASKES CONTOH'],
  ['0004407614187', 'BUDI & SANTOSO <X>', 'JL. "MERDEKA"', '1990-01-05', '3011021204900003', 'RS UDANGAN']
];

describe('writeXlsxRows', () => {
  it('menghasilkan berkas yang terbaca ulang (roundtrip)', async () => {
    const bytes = await writeXlsxRows(rows);
    expect(bytes.length).toBeGreaterThan(0);
    const back = await readXlsxRows(bytes);
    expect(back).toEqual(rows);
  });

  it('mempertahankan karakter khusus XML', async () => {
    const bytes = await writeXlsxRows([['a&b<c>"d"', "e'f"]]);
    const back = await readXlsxRows(bytes);
    expect(back[0]).toEqual(['a&b<c>"d"', "e'f"]);
  });

  it('menangani baris kosong', async () => {
    const bytes = await writeXlsxRows([['h1', 'h2'], ['', '']]);
    const back = await readXlsxRows(bytes);
    expect(back).toEqual([['h1', 'h2'], ['', '']]);
  });
});
