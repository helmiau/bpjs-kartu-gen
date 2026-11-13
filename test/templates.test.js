import { describe, it, expect } from 'vitest';
import { TEMPLATE_ROWS, templateCsv, templateTsv, templateXlsx } from '../js/templates.js';
import { readXlsxRows } from '../js/xlsx.js';
import { parseDelimited, mapRows, validateBatch } from '../js/batch.js';

describe('templates', () => {
  it('header mengenali semua kolom yang dipetakan batch', () => {
    const rows = mapRows([TEMPLATE_ROWS[0], TEMPLATE_ROWS[1]]);
    expect(rows[0].nomorKartu).toBe('0000000000000');
    expect(rows[0].nik).toBe('0000000000000000');
  });

  it('baris contoh valid (lolos validasi)', () => {
    const rows = mapRows(TEMPLATE_ROWS);
    const v = validateBatch(rows);
    expect(v.validCount).toBe(1);
  });

  it('CSV diproses parseDelimited menjadi baris contoh', () => {
    const rows = mapRows(parseDelimited(templateCsv()));
    expect(rows[0].nama).toBe('NAMA CONTOH');
  });

  it('TSV diproses parseDelimited', () => {
    const rows = mapRows(parseDelimited(templateTsv()));
    expect(rows[0].nomorKartu).toBe('0000000000000');
  });

  it('XLSX terbaca ulang berisi baris contoh', async () => {
    const buf = await templateXlsx();
    const rows = mapRows(await readXlsxRows(buf));
    expect(rows[0].fktp).toBe('FASKES CONTOH');
  });
});
