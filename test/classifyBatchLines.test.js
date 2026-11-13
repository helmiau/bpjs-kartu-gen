import { describe, it, expect } from 'vitest';
import { classifyBatchLines } from '../js/batch.js';

describe('classifyBatchLines (auto-detect per baris)', () => {
  it('baris TSV/CSV masuk tableLines', () => {
    const text = 'Nomor Kartu\tNama\tAlamat\tTanggal Lahir\tNIK\tFaskes\n0000000000000\tBUDI\tALAMAT CONTOH\t22-12-1997\t0000000000000000\tFASKES CONTOH';
    const { payloadLines, tableLines } = classifyBatchLines(text);
    expect(payloadLines).toHaveLength(0);
    expect(tableLines).toHaveLength(2);
  });

  it('kode base64 payload valid masuk payloadLines', () => {
    // payload valid: btoa(JSON.stringify({nomorKartu:'0000000000000',nama:'BUDI'}))
    const code = btoa(JSON.stringify({ nomorKartu: '0000000000000', nama: 'BUDI' }));
    const { payloadLines, tableLines } = classifyBatchLines(code);
    expect(payloadLines).toHaveLength(1);
    expect(tableLines).toHaveLength(0);
  });

  it('campuran base64 + TSV dipisah dengan benar', () => {
    const code = btoa(JSON.stringify({ nomorKartu: '0000000000000', nama: 'BUDI' }));
    const tsv = '0000000000000\tBUDI\tALAMAT CONTOH\t22-12-1997\t0000000000000000\tFASKES CONTOH';
    const { payloadLines, tableLines } = classifyBatchLines(`${code}\n${tsv}`);
    expect(payloadLines).toHaveLength(1);
    expect(tableLines).toHaveLength(1);
  });

  it('teks acak tanpa spasi yang bukan payload jadi tableLines', () => {
    const { payloadLines, tableLines } = classifyBatchLines('abcdefghijklmnopqrstuvwx');
    expect(payloadLines).toHaveLength(0);
    expect(tableLines).toHaveLength(1);
  });
});
