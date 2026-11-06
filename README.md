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
- **Ekspor** JPG per sisi dan PDF gabungan (ukuran fisik 85,6 mm)
- **Kode QR di kartu memuat base64 JSON lengkap**, sehingga kartu hasil cetak
  bisa dipindai kembali untuk mengisi ulang seluruh form
- **Riwayat cetak lokal** (localStorage), bisa dihapus

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
  css/style.css         gaya antarmuka (tema terang & gelap)
  img/                  template kartu depan (PNG) & belakang (JPG)
  vendor/               qrcode.js, jsQR.js, html2canvas.min.js (di-vendor)
js/
  app.js                orkestrasi: form, tombol, URL, riwayat
  card.js               render kartu dua sisi + gambar QR
  scanner.js            pemindai QR dari gambar & kamera
  exporter.js           ekspor JPG dan perakitan PDF
  payload.js            base64 <-> JSON (tahan variasi nama kunci)
  qr-content.js         susun isi kode QR
  date.js               konversi tanggal DD-MM-YYYY <-> YYYY-MM-DD
  validate.js           validasi kolom form
  pdf-size.js           ukuran halaman PDF
  schema.js             tata letak kartu (koordinat piksel)
  history.js            riwayat localStorage
test/                   unit test Vitest
PRD.md                  dokumen kebutuhan produk
```

## Pengujian

```bash
npm install
npm test
```

48 unit test mencakup konversi base64, tahan variasi nama kunci, konversi
tanggal, validasi kolom, ukuran halaman PDF, dan isi kode QR.

## Deploy ke GitHub Pages

1. Dorong repo ini ke GitHub.
2. Buka **Settings → Pages**.
3. Pilih **Source: Deploy from a branch**, cabang `main`, folder `/ (root)`.
4. Tunggu beberapa saat, lalu buka `https://<user>.github.io/<repo>/`.

Tidak ada langkah build. Pustaka sudah di-*vendor*, sehingga halaman tidak
memuat skrip dari CDN pihak ketiga saat runtime.

## Catatan teknis

- **Tanpa backend.** Tidak ada `fetch` ke luar; satu-satunya permintaan adalah
  aset dari repo itu sendiri.
- **Aman terhadap XSS.** Semua nilai dimasukkan lewat `textContent`, tidak
  pernah `innerHTML`.
- **Barcode Code 39 diganti QR.** Situs sumber membuat barcode lewat PHP
  (`dynamic_barcode.php`). GitHub Pages tidak menjalankan PHP, dan keputusan
  produk di sini adalah QR berisi base64 JSON lengkap agar kartu bisa dipindai
  balik. Pustaka `qrcode-generator` di-*vendor* dipakai untuk membuatnya.
- **Ukuran kartu 350 × 244 piksel**, sama dengan sumber. Ekspor memakai skala
  4× dengan batas 36 juta piksel agar peramban ponsel tidak kehabisan memori.
- **Template depan berukuran 1,3 MB** dan dipakai apa adanya; rasio kanvas
  mengikuti sumber.
