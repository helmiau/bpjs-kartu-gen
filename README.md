# Generator Kartu BPJS

Aplikasi web satu-halaman untuk membuat kartu peserta BPJS Kesehatan
(Kartu Indonesia Sehat) langsung di perangkat. Tidak ada server, tidak ada
pengiriman data — semua proses berjalan di peramban.

> **Perhatian:** kartu yang dihasilkan adalah tiruan visual untuk latihan atau
> pratinjau. Kartu ini **tidak sah secara hukum** dan tidak diverifikasi oleh
> BPJS Kesehatan.

## Fitur

- **Tiga jalur pengisian data**
  - Tempel string base64 secara manual
  - Pindai kode QR dari berkas gambar
  - Pindai kode QR dari kamera perangkat
  - Buka halaman dengan `?data=<base64>` untuk pengisian otomatis
- **Form manual** 8 kolom peserta dengan validasi
- **Pratinjau kartu** sisi depan dan sisi belakang
- **Ekspor** JPG per sisi dan PDF gabungan (ukuran fisik 85,6 mm), 300 dpi
  - **Fotokopi hitam-putih**: JPG & PDF dicetak monokrom (grayscale)
  - **PDF raster**: teks dibakar ke gambar (tidak bisa diedit); default PDF
    menyimpan teks vektor yang bisa diseleksi/diedit
- **Riwayat cetak lokal** (localStorage), bisa dihapus

Kartu sisi depan memuat **barcode Code 128** berisi 13 digit nomor kartu
(seperti kartu resmi BPJS), opsional lewat kotak centang, default aktif.
Kode QR sengaja tidak dipakai di kartu: QR yang memuat base64 JSON lengkap
(~324 karakter) butuh 65 modul dan blok ±260 piksel agar bisa dipindai
balik — menutupi hampir seluruh teks kartu. Data tetap masuk lewat jalur
tempel, gambar, kamera, atau URL; `jsQR` dipakai untuk membacanya.

## Cara pakai

Buka `index.html` lewat server statis apa pun:

```bash
npx http-server . -p 8080 -c-1
# lalu buka http://127.0.0.1:8080/
```

Atau langsung buka berkas `index.html` di peramban (pemindaian kamera
memerlukan HTTPS atau `localhost`).

Contoh pengisian dari URL:

```
http://127.0.0.1:8080/?data=eyJub21vckthcnR1IjoiMDAwMDAwMDAwMDAwMCIs...
```

## Struktur berkas

```
index.html              halaman utama
404.html                halaman tidak ditemukan
.nojekyll               mencegah pemrosesan Jekyll di GitHub Pages
assets/
  css/style.css         gaya antarmuka (lihat DESIGN.md)
  img/                  template kartu depan & belakang (PNG) + logo
                        BPJS (bpjs-logo.svg, bpjs-mark.svg, icon favicon)
js/
  app.js                orkestrasi: form, tombol, URL, riwayat
  card.js               render kartu dua sisi
  scanner.js            pemindai QR dari gambar & kamera
  exporter.js           ekspor JPG dan perakitan PDF
  pdf-text.js           lapisan teks vektor PDF (label/nilai bisa diedit)
  payload.js            base64 <-> JSON (tahan variasi nama kunci)
  date.js               konversi tanggal DD-MM-YYYY <-> YYYY-MM-DD
  validate.js           validasi kolom form
  pdf-size.js           ukuran halaman PDF + skala 300 dpi
  schema.js             tata letak kartu (koordinat piksel)
  version.js            versi aplikasi (sumber tunggal untuk UI + cache-bust)
  history.js            riwayat localStorage
```

## Pengujian

```bash
npm install
npm test
```

65 unit test mencakup konversi base64, tahan variasi nama kunci, konversi
tanggal, validasi kolom, skala DPI, dan tata letak teks PDF.

## Deploy ke GitHub Pages

1. Dorong repo ini ke GitHub.
2. Buka **Settings → Pages**.
3. Pilih **Source: Deploy from a branch**, cabang `master`, folder `/ (root)`.
4. Tunggu beberapa saat, lalu buka `https://<user>.github.io/<repo>/`.

Tidak ada langkah build. Pustaka sudah di-*vendor*, sehingga halaman tidak
memuat skrip dari CDN pihak ketiga saat runtime.

## Versi web

Nomor versi tampil di footer (`v1.1.0`) dan dicatat di konsol peramban. Sumber
tunggalnya `js/version.js` (`APP_VERSION`) dan `package.json`. Untuk merilis
versi baru:

1. Naikkan `APP_VERSION` di `js/version.js` dan `version` di `package.json`.
2. Samakan query `?v=` pada `assets/css/style.css`, pustaka `assets/vendor/*`,
   dan `js/app.js` di `index.html` serta `404.html` dengan nomor baru.
3. Dorong; peramban akan mengambil aset baru karena URL-nya berubah.

Query `?v=` pada aset membuat cache peramban (GitHub Pages/`max-age=600`) tidak
menyajikan berkas lama setelah rilis.

## Catatan teknis

- **Tanpa backend.** Tidak ada `fetch` ke luar; satu-satunya permintaan adalah
  aset dari repo itu sendiri.
- **Aman terhadap XSS.** Semua nilai dimasukkan lewat `textContent`, tidak
  pernah `innerHTML`.
- **Barcode Code 128, bukan QR.** Situs sumber memakai Code 39 hasil PHP
  (`dynamic_barcode.php`) yang mati di GitHub Pages. QR berisi base64 JSON
  lengkap diukur butuh blok ±260 piksel agar bisa dipindai balik —
  menutupi hampir seluruh teks kartu. Karena itu kartu memakai Code 128 berisi
  nomor kartu (dibangkitkan `JsBarcode`, opsional, default aktif), dan `jsQR`
  dipakai untuk membaca QR dari berkas gambar atau kamera.
- **Ukuran kartu 350 × 222 piksel**, rasio 1,579 mengikuti kartu resmi BPJS
  (473,8 × 300 pt). Ekspor (JPG & PDF) dihitung agar raster keluar **tepat
  300 dpi** saat dicetak seukuran kartu (sisi terpanjang 85,6 mm), sekitar
  1011 × 641 piksel, dengan batas 36 juta piksel agar peramban ponsel tidak
  kehabisan memori. Lihat `pdf-size.js` (`exportScaleForDpi`).
- **PDF berlapis dua: latar raster + teks vektor.** Latar (template + barcode)
  digambar sebagai gambar 300 dpi, lalu label dan nilai peserta ditulis
  sebagai objek teks vektor memakai font standar Helvetica (tanpa berkas font
  tertanam). Hasilnya teks kartu **bisa diseleksi dan diedit** di pembaca PDF.
  Lihat `pdf-text.js`.
- **Latar digambar langsung, bukan html2canvas.** Template asli (1516 × 960 px
  per sisi, tanpa metadata DPI) digambar ke kanvas 300 dpi dengan penskalaan
  halus peramban, lalu barcode SVG diraster pada ukuran penuh. html2canvas
  dahulu menurunkan latar ke 350 px lalu memperbesarnya, sehingga teks syarat
  jadi buram; jalur langsung ini menjaga ketajaman. Teks peserta tidak ikut di
  dalam PNG, sehingga tidak ada teks ganda.
- **Logo BPJS.** `assets/img/bpjs-logo.svg` (lockup) dan `bpjs-mark.svg`
  (tanda kotak untuk favicon/header) berasal dari Wikimedia Commons (logo
  BPJS Kesehatan). Logo adalah merek dagang BPJS Kesehatan; dipakai di sini
  hanya untuk konteks alat tiruan/pratinjau, bukan klaim afiliasi.
