/**
 * Tata letak kartu BPJS. Koordinat mengikuti situs sumber.
 *
 * Kanvas: 350 x 244 piksel.
 * Sisi depan: latar PNG + blok teks berprefiks + blok syarat-ketentuan.
 * Sisi belakang: latar JPG saja, tanpa elemen.
 *
 * Kolom fktpGigi dan statusPeserta tidak dicetak (sesuai sumber).
 *
 * Tidak ada blok kode QR/barcode di kartu. Alasannya: QR yang memuat base64
 * JSON lengkap (~324 karakter) membutuhkan 65 modul, dan agar bisa dipindai
 * balik bloknya harus 260 piksel — ukuran itu menutupi hampir seluruh teks
 * kartu. Karena kebutuhan memindai balik kartu cetak dilepas, tata letak teks
 * dikembalikan persis seperti sumber. Data tetap masuk lewat tempel base64,
 * unggah gambar QR, kamera, atau parameter URL ?data=.
 */

export const CARD_WIDTH = 350;
export const CARD_HEIGHT = 244;

/** Teks tetap yang muncul di sisi depan. */
export const TERMS_TEXT =
  'Syarat dan Ketentuan :\n' +
  '1. Kartu Peserta harap dibawa Ketika berobat\n' +
  '2. Apabila kartu ini disalahgunakan akan dikenakan sakni\n' +
  '3. apabila ada perubahan atau kehilangan Kartu segera lapor ke kantor BPJS Kesehatan setempat\n' +
  'BPJS Kesehatan Care Center 165\n' +
  'www.bpjs-kesehatan.go.id';

export const SCHEMA = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  sides: [
    {
      id: 'front',
      label: 'Sisi Depan',
      background: 'assets/img/template-bpjs-front.png',
      elements: [
        {
          id: 'bpjs_no',
          type: 'text',
          field: 'nomorKartu',
          label: 'No Kartu',
          prefix: 'No Kartu:',
          x: 25, y: 83, width: 275, height: 25,
          fontSize: 15, fontFamily: 'Arial',
          fontWeight: 'bold', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_nama',
          type: 'text',
          field: 'nama',
          label: 'Nama',
          prefix: 'Nama:',
          x: 25, y: 107, width: 313, height: 20,
          fontSize: 11, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_alamat',
          type: 'text',
          field: 'alamat',
          label: 'Alamat',
          prefix: 'Alamat:',
          x: 25, y: 123, width: 313, height: 31,
          fontSize: 11, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_tanggal',
          type: 'text',
          field: 'tglLhr',
          label: 'Tgl Lahir',
          prefix: 'Tgl Lahir:',
          x: 25, y: 153, width: 275, height: 20,
          fontSize: 11, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_nik',
          type: 'text',
          field: 'nik',
          label: 'NIK',
          prefix: 'NIK:',
          x: 25, y: 169, width: 275, height: 20,
          fontSize: 11, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_faskes',
          type: 'text',
          field: 'fktp',
          label: 'Faskes 1',
          prefix: 'Faskes 1:',
          x: 25, y: 184, width: 275, height: 20,
          fontSize: 11, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_syarat',
          type: 'multiline',
          field: '',
          label: TERMS_TEXT,
          prefix: '',
          x: 26, y: 199, width: 286, height: 38,
          fontSize: 6, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        }
      ]
    },
    {
      id: 'back',
      label: 'Sisi Belakang',
      background: 'assets/img/template-bpjs-back.jpg',
      elements: []
    }
  ]
};
