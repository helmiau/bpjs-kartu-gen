/**
 * Tata letak kartu BPJS. Koordinat mengikuti situs sumber agar hasil mirip.
 *
 * Kanvas: 350 x 244 piksel.
 * Sisi depan: latar PNG + blok teks berprefiks + blok syarat + kode QR.
 * Sisi belakang: latar JPG saja, tanpa elemen.
 *
 * Kolom fktpGigi dan statusPeserta tidak dicetak (sesuai sumber).
 */

export const CARD_WIDTH = 350;
export const CARD_HEIGHT = 244;

/** Teks tetap yang muncul di sisi depan. */
export const TERMS_TEXT =
  'Syarat dan Ketentuan :\n' +
  '1. Kartu Peserta harap dibawa Ketika berobat\n' +
  '2. Apabila kartu ini disalahgunakan akan dikenakan saksi\n' +
  '3. apabila ada perubahan atau kehilangan Kartu segera lapor ke kantor BPJS Kesehatan setempat\n' +
  'BPJS Kesehatan Care Center 165\n' +
  'www.bpjs-kesehatan.go.id';

/**
 * Ukuran blok QR. Sumber memakai 151 x 23 piksel untuk barcode Code 39,
 * tetapi pilihan produk di sini adalah QR berisi base64 JSON lengkap
 * (~350 karakter), sehingga butuh blok yang jauh lebih besar agar bisa dibaca.
 */
export const QR_BLOCK = { x: 218, y: 55, width: 112, height: 112 };

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
          id: 'bpjs_qr',
          type: 'qrcode',
          field: 'nomorKartu',
          label: 'QR',
          prefix: '',
          x: QR_BLOCK.x, y: QR_BLOCK.y,
          width: QR_BLOCK.width, height: QR_BLOCK.height,
          fontSize: 9, fontFamily: 'Arial',
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
