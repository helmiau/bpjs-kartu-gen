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
- **Riwayat cetak lokal** (localStorage), bisa dihapus

Kartu tidak memuat kode QR/barcode. Alasannya: QR yang memuat base64 JSON
lengkap (~324 karakter) membutuhkan 65 modul, dan agar bisa dipindai balik
bloknya harus 260 piksel — ukuran itu menutupi hampir seluruh teks kartu. Karena
itu tata letak teks dikembalikan persis seperti situs sumber, dan data masuk
lewat jalur unggah, kamera, tempel, atau URL.

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
  vendor/               jsQR.js, html2canvas.min.js (di-vendor)
js/
  app.js                orkestrasi: form, tombol, URL, riwayat
  card.js               render kartu dua sisi
  scanner.js            pemindai QR dari gambar & kamera
  exporter.js           ekspor JPG dan perakitan PDF
  payload.js            base64 <-> JSON (tahan variasi nama kunci)
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

41 unit test mencakup konversi base64, tahan variasi nama kunci, konversi
tanggal, validasi kolom, dan ukuran halaman PDF.

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
- **Tidak ada kode QR di kartu.** Situs sumber membuat barcode Code 39 lewat
  PHP (`dynamic_barcode.php`), yang mati di GitHub Pages. Alternatif QR berisi
  base64 JSON lengkap diukur butuh blok 260 piksel agar bisa dipindai balik —
  itu menutupi hampir seluruh teks kartu. Karena itu kartu dibiarkan tanpa kode,
  dan tata letak teks mengikuti sumber. Pustaka `jsQR` tetap dipakai untuk
  membaca QR dari berkas gambar dan kamera.
- **Ukuran kartu 350 × 244 piksel**, sama dengan sumber. Ekspor memakai skala
  4× dengan batas 36 juta piksel agar peramban ponsel tidak kehabisan memori.
- **Template depan berukuran 1,3 MB** dan dipakai apa adanya; rasio kanvas
  mengikuti sumber.
