/*
 * Tata letak kartu BPJS.
 *
 * Acuan: kartu resmi BPJS (KARTU_0001701425046.pdf), satu kartu berukuran
 * 473,8 x 300 pt. Kanvas memakai rasio yang sama, yaitu 350 x 222 piksel
 * (350 / 473,8 = 0,7387; 222 / 300 = 0,7400).
 *
 * Yang diikuti dari kartu resmi:
 *   - label    : "Nomor Kartu", "Nama", "Alamat", "Tanggal Lahir", "NIK", "Faskes"
 *   - titik dua: kolom label selebar 90 pt, tanda ":" jatuh di x = 138 pt
 *   - nilai    : mulai di x = 150 pt
 *   - barcode  : Code 128 berisi nomor kartu, x 48..228 pt, y 83..105,7 pt
 *   - font     : 11 pt, nomor kartu bold
 *
 * Tata letak di kanvas 350 x 222:
 *   - Header hijau template berakhir di kanvas y = 56
 *   - Teks syarat pada latar mulai di y = 170
 *   - Ruang data: y 56..170 = 114 px
 *   - Barcode  : y 62..79 (17 px)
 *   - 6 baris data: y 82..162 (80 px)
 *
 * Catatan: teks syarat-ketentuan dan footer TIDAK digambar sebagai elemen.
 * Keduanya sudah menjadi bagian gambar template, sehingga digambar ulang akan
 * membuat teks ganda.
 */

export const CARD_WIDTH = 350;
export const CARD_HEIGHT = 222;

/** Ukuran blok barcode Code 128. Sumber: x 48..228 pt, y 83..105,7 pt. */
export const BARCODE_BLOCK = { x: 35, y: 62, width: 133, height: 17 };

/** Lebar kolom label dalam piksel, dari 90 pt pada kartu resmi. */
export const LABEL_COLUMN = 67;

export const SCHEMA = {
  width: CARD_WIDTH,
  height: CARD_HEIGHT,
  sides: [
    {
      id: 'front',
      label: 'Sisi Depan',
      // Latar sisi depan = sisi KIRI template dasar (syarat + peta). Header
      // hijau hanya setinggi kanvas y = 56, dan teks syarat latar mulai di
      // y = 170. Ruang y 56..170 digunakan untuk barcode + data peserta.
      background: 'assets/img/template-bpjs-front.png',
      elements: [
        {
          id: 'bpjs_no',
          type: 'text',
          field: 'nomorKartu',
          label: 'Nomor Kartu',
          prefix: 'Nomor Kartu:',
          x: 35, y: 82, width: 300, height: 12,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'bold', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_nama',
          type: 'text',
          field: 'nama',
          label: 'Nama',
          prefix: 'Nama:',
          x: 35, y: 94, width: 300, height: 12,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_alamat',
          type: 'text',
          field: 'alamat',
          label: 'Alamat',
          prefix: 'Alamat:',
          x: 35, y: 106, width: 300, height: 24,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_tanggal',
          type: 'text',
          field: 'tglLhr',
          label: 'Tanggal Lahir',
          prefix: 'Tanggal Lahir:',
          x: 35, y: 130, width: 300, height: 12,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_nik',
          type: 'text',
          field: 'nik',
          label: 'NIK',
          prefix: 'NIK:',
          x: 35, y: 142, width: 300, height: 12,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        },
        {
          id: 'bpjs_faskes',
          type: 'text',
          field: 'fktp',
          label: 'Faskes',
          prefix: 'Faskes:',
          x: 35, y: 154, width: 300, height: 12,
          fontSize: 9, fontFamily: 'Arial',
          fontWeight: 'normal', fontStyle: 'normal',
          textAlign: 'left', color: '#000000'
        }
      ]
    },
    {
      id: 'back',
      label: 'Sisi Belakang',
      // Latar sisi belakang = sisi KANAN template dasar (logo BPJS + peta).
      background: 'assets/img/template-bpjs-back.png',
      elements: []
    }
  ]
};
