/*
 * Tata letak sisi depan.
 *
 * Kanvas 350 x 244 piksel. Header template memakan ~80 piksel, sehingga ruang
 * teks tersedia 83-244 = 161 piksel.
 *
 * Titik dua setiap baris sejajar di x = 97 (kolom label 70 piksel; lihat
 * assets/css/style.css).
 *
 * Keterbatasan yang diterima: blok syarat-ketentuan berisi 6 baris teks 6px
 * yang butuh 38 piksel, tetapi ruang yang tersisa setelah enam baris data
 * hanya cukup untuk menampilkannya sebagian. Karena syarat-ketentuan adalah
 * teks tetap yang tidak berubah, blok ini diberi tinggi penuh 38 piksel dan
 * diletakkan di dasar kartu; bila baris data memanjang, syarat terpotong lebih
 * dulu daripada data peserta.
 *
 * Tinggi blok Nama dan Alamat diperbesar dari spesifikasi sumber (20 dan 31
 * piksel) menjadi 32 dan 44 piksel supaya nilai panjang bungkas utuh. Imbalnya
 * blok Tanggal, NIK, dan Faskes digeser ke bawah, dan ruang antar baris mengecil.
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
          label: 'No. Kartu',
          prefix: 'No. Kartu:',
          x: 25, y: 82, width: 300, height: 22,
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
          x: 25, y: 104, width: 313, height: 16,
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
          x: 25, y: 120, width: 313, height: 28,
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
          x: 25, y: 148, width: 275, height: 14,
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
          x: 25, y: 162, width: 275, height: 14,
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
          x: 25, y: 176, width: 275, height: 14,
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
          x: 26, y: 190, width: 286, height: 38,
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
