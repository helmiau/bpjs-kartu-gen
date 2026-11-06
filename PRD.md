# PRD — Generator Kartu BPJS (e-Kartu Clone)

> Sumber rujukan: `https://e-kartu.exsacomputer.id/?pg=bpjs`
> Target: situs statis GitHub Pages, 100% sisi-klien (tanpa server, tanpa PHP).
> Pemilik proyek: Cak Helmi · Tanggal: 2026-11-06

---

## 1. Project Overview

Aplikasi web satu-halaman yang membuat kartu peserta BPJS Kesehatan (Kartu Indonesia Sehat) yang bisa diunduh sebagai JPG dan PDF. Semua proses berjalan di perangkat pengguna: pengisian data, pembuatan kode QR, perenderan kartu, dan ekspor berkas. Tidak ada pengiriman data ke mana pun.

Produk ini mereplikasi alur kerja situs `e-kartu.exsacomputer.id` halaman Kartu BPJS, tetapi menghapus gerbang donasi dan mengganti mesin sisi-server (PHP) dengan padanan sisi-klien.

**Pencapaian utama dari replikasi:** input data yang lebih kaya (kolom manual + pemindai QR + pengurai URL), kartu dua sisi, ekspor JPG & PDF berukuran fisik 85,6 mm.

---

## 2. Problem Statement

Situs sumber mensyaratkan donasi Rp5.000 sebelum berkas kartu bisa diunduh, dan barcode/QR dihasilkan oleh PHP sisi-server sehingga tidak bisa berjalan di hosting statis. Pengguna yang hanya perlu mengisi data peserta dari sebuah kode QR dan langsung mendapat kartu jadi tidak punya jalan pintas.

Selain itu payload data peserta sering sudah tersedia sebagai string base64 (misal dari aplikasi pihak ketiga), tetapi harus diketik ulang satu per satu.

---

## 3. Product Goals

| # | Goal |
|---|---|
| G1 | Mengisi seluruh kolom kartu otomatis dari satu kode QR berisi base64 JSON |
| G2 | Membaca kode QR dari gambar yang diunggah atau dari kamera perangkat |
| G3 | Menyediakan kolom manual lengkap untuk semua field peserta |
| G4 | Merender kartu depan dan belakang sesuai template asli |
| G5 | Mengekspor JPG dan PDF tanpa perlu server |
| G6 | Berjalan penuh di GitHub Pages tanpa backend |

---

## 4. Target Users

| User | Kebutuhan |
|---|---|
| Operator/panitia | Mencetak banyak kartu peserta dari daftar data |
| Individu | Mencetak ulang kartunya sendiri dari data yang dimiliki |
| Pengembang | Mengulangi alur untuk jenis kartu lain (NUPTK, NISN, NRG) |

Tidak ada hierarki akun: aplikasi ini tanpa login, tanpa peran, tanpa data pengguna yang tersimpan di server.

---

## 5. Application Scope

**Full functional, sisi-klien sepenuhnya.** Semua fitur berjalan nyata di browser. Tidak ada UI-only, tidak ada mock data.

---

## 6. In Scope

- Form manual untuk 8 kolom peserta
- Perekam kode QR dari berkas gambar
- Perekam kode QR dari kamera perangkat
- Pengurai URL yang membawa payload base64 di query string
- Perenderan pratinjau kartu sisi depan dan sisi belakang
- Pembuatan QR Code berisi base64 JSON lengkap
- Ekspor JPG per sisi
- Ekspor PDF gabungan (depan + belakang) dengan ukuran fisik 85,6 mm
- Tampilan responsif (desktop dan ponsel)
- Pencatatan riwayat cetak di perangkat (localStorage) — tanpa data sensitif

---

## 7. Out of Scope / Non-Goals

- Login, registrasi, akun pengguna
- Penyimpanan data di server atau basis data
- Gerbang donasi / pembayaran
- Jenis kartu lain (NUPTK, NISN, NRG, BUMN, BPJS Ketenagakerjaan)
- Unggah foto profil peserta (sumber memakainya, kita tidak)
- Penerjemahan barcode Code 39 menjadi data
- Verifikasi keabsahan data ke server BPJS

---

## 8. Future Considerations

- Dukungan banyak jenis kartu lewat satu berkas schema per jenis
- Impor CSV untuk cetak massal
- Kustomisasi warna/tema
- Mode cetak batch beberapa kartu dalam satu PDF

---

## 9. Platform

Web-based. Responsif: desktop, tablet, ponsel. Diperlukan HTTPS untuk akses kamera (GitHub Pages menyediakan ini secara bawaan).

---

## 10. Delivery Level

MVP fungsional: alur inti lengkap dan bisa dipakai, dengan keamanan dasar, tetapi tanpa skala organisasi.

---

## 11. User Roles & Permissions

Satu peran implisit: **Pengunjung**. Semua fitur tersedia untuk siapa pun yang membuka halaman. Tidak ada endpoint yang dibatasi peran karena tidak ada server.

Konsekuensi keamanan: karena tidak ada server, setiap pengguna dapat mengubah data kartu sesuka hati. Ini diterima secara sadar — kartu yang dihasilkan tidak memiliki kekuatan hukum dan tidak diverifikasi.

---

## 12. Functional Requirements

### FR-1 — Form manual

| Field | Label | Tipe | Wajib |
|---|---|---|---|
| `nomorKartu` | No. Kartu | teks, 13 digit | ya |
| `nama` | Nama Peserta | teks | ya |
| `alamat` | Alamat | teks | ya |
| `tglLhr` | Tanggal Lahir | tanggal | ya |
| `nik` | NIK | teks, 16 digit | ya |
| `fktp` | Faskes 1 | teks | ya |
| `fktpGigi` | Faskes Gigi | teks | tidak |
| `statusPeserta` | Status Peserta | teks | tidak |

### FR-2 — Pengisian otomatis dari base64

Dua jalur masuk:
1. **Tempel manual** — pengguna menempel string base64 ke kotak teks.
2. **Pindai QR** — pengguna memindai kode yang memuat base64.

Parser harus menerima variasi nama kunci karena sumber aslinya tidak konsisten (lihat §23.6).

### FR-3 — Pemindai QR dari gambar

Pengguna memilih berkas gambar; aplikasi membaca kode QR di dalamnya dan mengisi form.

### FR-4 — Pemindai QR dari kamera

Pengguna mengaktifkan kamera; aplikasi membaca kode secara langsung dan mengisi form sekali berhasil.

### FR-5 — Pengurai URL

Jika halaman dibuka dengan `?data=<base64>`, form terisi otomatis saat muat.

### FR-6 — Pratinjau kartu

Dua sisi, skala menyesuaikan lebar layar.

### FR-7 — Pembuatan QR isi base64

QR di sisi depan memuat base64 JSON lengkap, agar kartu hasil cetak bisa dipindai kembali untuk mengisi ulang form.

### FR-8 — Ekspor JPG

Satu berkas per sisi.

### FR-9 — Ekspor PDF gabungan

Dua halaman, ukuran fisik sisi terpanjang 85,6 mm, sisi lain mengikuti rasio template.

### FR-10 — Riwayat lokal

Menyimpan beberapa cetakan terakhir di `localStorage` untuk diunduh ulang. Tidak menyimpan NIK/nomor kartu dalam bentuk terbaca bila riwayat dibaca orang lain — lihat §28.7.

---

## 13. Feature Priority

| Priority | Feature |
|---|---|
| P0 | Form manual 8 kolom |
| P0 | Pratinjau kartu 2 sisi |
| P0 | Ekspor JPG |
| P0 | Ekspor PDF gabungan |
| P0 | Pengisian otomatis dari base64 (tempel + URL) |
| P1 | Pemindai QR dari gambar |
| P1 | Pemindai QR dari kamera |
| P1 | QR di kartu berisi base64 JSON |
| P2 | Riwayat cetak lokal |

---

## 14. Requirement Traceability

| ID | Requirement | Implementasi | Verifikasi |
|---|---|---|---|
| REQ-FORM-001 | Form 8 kolom dengan validasi wajib | `js/form.js` | TEST-FORM-001 |
| REQ-B64-001 | Dekode base64 → isi form | `js/payload.js` | TEST-B64-001..004 |
| REQ-B64-002 | Terima variasi nama kunci | `js/payload.js` | TEST-B64-003 |
| REQ-B64-003 | Encode data → base64 untuk QR | `js/payload.js` | TEST-B64-005 |
| REQ-URL-001 | Baca `?data=` saat muat | `js/app.js` | TEST-URL-001 |
| REQ-QRIMG-001 | Pindai QR dari berkas gambar | `js/scanner.js` | TEST-QRIMG-001 |
| REQ-QRCAM-001 | Pindai QR dari kamera | `js/scanner.js` | TEST-QRCAM-001 |
| REQ-CARD-001 | Render sisi depan 350×244 | `js/card.js` | TEST-CARD-001 |
| REQ-CARD-002 | Render sisi belakang 350×244 | `js/card.js` | TEST-CARD-002 |
| REQ-QRGEN-001 | QR memuat base64 JSON lengkap | `js/card.js` | TEST-QRGEN-001 |
| REQ-EXP-001 | Ekspor JPG per sisi | `js/exporter.js` | TEST-EXP-001 |
| REQ-EXP-002 | Ekspor PDF 85,6 mm | `js/exporter.js` | TEST-EXP-002 |
| REQ-HIST-001 | Riwayat lokal tersimpan | `js/history.js` | TEST-HIST-001 |

---

## 15. User Flows

### Alur utama — tempel base64

```
Buka halaman
  → Tempel base64 ke kotak "Isi otomatis"
  → Parser validasi & dekode
  → Semua kolom terisi
  → Pratinjau kartu diperbarui
  → Klik "Unduh JPG Depan" / "Unduh PDF"
  → Berkas terunduh
```

### Alur pemindai QR

```
Buka halaman
  → Pilih "Pindai dari Gambar" atau "Aktifkan Kamera"
  → Pilih berkas / izinkan kamera
  → jsQR menemukan kode
  → Teks base64 diparse
  → Kolom terisi
```

### Alur URL

```
Buka https://<user>.github.io/<repo>/?data=eyJub21v...
  → app.js membaca query param
  → Kolom terisi otomatis
```

### Alur gagal

```
Base64 tidak valid
  → Pesan: "Kode tidak dapat dibaca. Pastikan salinan lengkap."
  → Form dibiarkan apa adanya

Gambar tanpa QR
  → Pesan: "Tidak ada kode QR pada gambar."

Kamera ditolak
  → Pesan: "Akses kamera ditolak. Gunakan pilihan dari gambar."

Kolom wajib kosong saat unduh
  → Tombol unduh menonaktifkan diri / pesan jelas
```

---

## 16. Pages & Navigation

Satu halaman saja: `index.html`.

| Wilayah | Isi |
|---|---|
| Header | Judul + catatan singkat |
| Panel kiri | Form 8 kolom + kotak isi otomatis + tombol pemindai |
| Panel kanan | Pratinjau sisi depan + sisi belakang + tombol unduh |
| Bawah | Riwayat cetak lokal |

---

## 17. Route Inventory

| Route ID | Path | Tipe | Akses | Hasil yang diharapkan | Verifikasi |
|---|---|---|---|---|---|
| ROUTE-WEB-001 | `/index.html` | Halaman | Publik | Form + pratinjau tampil, tanpa galat konsol | TEST-ROUTE-001 |
| ROUTE-WEB-002 | `/?data=<base64>` | Halaman + query | Publik | Form terisi otomatis | TEST-ROUTE-002 |
| ROUTE-WEB-003 | `/404.html` | Halaman | Publik | Halaman tidak ditemuhan ramah | TEST-ROUTE-003 |
| ROUTE-ASSET-001 | `/assets/img/template-bpjs-front.png` | Aset | Publik | 200, `image/png` | TEST-ROUTE-004 |
| ROUTE-ASSET-002 | `/assets/img/template-bpjs-back.jpg` | Aset | Publik | 200, `image/jpeg` | TEST-ROUTE-005 |
| ROUTE-ASSET-003 | `/assets/vendor/*.js` | Aset | Publik | 200, muat tanpa galat | TEST-ROUTE-006 |

Tidak ada rute API: tidak ada server.

---

## 18. Route Access Matrix

| Route | Pengunjung | Hasil yang diharapkan | Test ID | Status |
|---|---|---|---|---|
| `/index.html` | — | 200, halaman render penuh | TEST-ROUTE-001 | Terencana |
| `/?data=` | — | 200, form terisi | TEST-ROUTE-002 | Terencana |
| `/404.html` | — | 404 ramah | TEST-ROUTE-003 | Terencana |
| Aset template | — | 200 tipe benar | TEST-ROUTE-004/005 | Terencana |
| Aset vendor | — | 200, tanpa galat konsol | TEST-ROUTE-006 | Terencana |

---

## 19. Route Exceptions

| Pengecualian | Alasan | Verifikasi alternatif |
|---|---|---|
| Kamera butuh HTTPS | `getUserMedia` menolak origin tidak aman | Uji di `localhost` atau GitHub Pages; diuji manual |
| `localStorage` bisa diblokir mode privat | Menyimpan riwayat adalah P2 | Tangkap galat, aplikasi tetap jalan tanpa riwayat |

---

## 20. UI Requirements

- Bersih, minimal, hierarki jelas.
- Dua kolom di layar lebar; satu kolom bertumpuk di ponsel.
- Tombol unduh mudah dijangkau, tinggi minimal 44px.
- Label setiap kolom, pesan galat di dekat kolom terkait.
- Kontras memenuhi WCAG AA.
- Status pemindaian terlihat jelas (menunggu / berhasil / gagal).
- Pratinjau kartu punya skala responsif dan rasio terkunci.

---

## 21. Technology Stack

| Lapisan | Pilihan | Alasan |
|---|---|---|
| Halaman | HTML + CSS + JavaScript murni | Tanpa build step, langsung jalan di GitHub Pages |
| QR (buat) | `qrcode-generator` (di-vendor) | Murni JS, menghasilkan SVG/kanvas |
| QR (baca) | `jsQR` (di-vendor) | Pembaca QR murni JS untuk gambar & kamera |
| Ekspor render | `html2canvas` (di-vendor) | Padanan langsung mesin ekspor situs sumber |
| PDF | Perakitan PDF manual di JS | Menghindari dependensi berat; ukuran presisi |
| Hosting | GitHub Pages | Statis, HTTPS gratis |
| Kamera | `getUserMedia` API | Bawaan browser |

Tidak ada basis data, tidak ada framework, tidak ada proses build. Semua pustaka di-*vendor* ke repo supaya situs tidak bergantung pada CDN pihak ketiga saat runtime.

---

## 22. System Architecture

```
┌─────────────────────────────────────────────┐
│  index.html                                 │
├─────────────────────────────────────────────┤
│  app.js         — pengikat & orkestrasi     │
│  payload.js     — base64 ↔ JSON             │
│  scanner.js     — baca QR (gambar & kamera) │
│  card.js        — render kartu + QR         │
│  exporter.js    — JPG & PDF                 │
│  history.js     — riwayat localStorage      │
├─────────────────────────────────────────────┤
│  schema.js      — tata letak kartu (JSON)   │
├─────────────────────────────────────────────┤
│  vendor/ — qrcode, jsQR, html2canvas        │
│  assets/img/ — template depan & belakang    │
└─────────────────────────────────────────────┘
```

Tidak ada komunikasi jaringan ke luar setelah halaman dimuat. Satu-satunya pengecualian: pemuatan berkas vendor dari repo itu sendiri.

---

## 23. Database Design

Tidak ada basis data. Data hanya hidup di memori halaman.

### 23.1 Bentuk data dalam memori

```js
{
  nomorKartu: "0000000000000",
  nama: "NAMA ORANG PESERTA BPJS",
  alamat: "ALAMAT, RT, RW, KELURAHAN, KECAMATAN, KOTA/KABUPATEN",
  tglLhr: "30-12-2026",
  nik: "30000000000000001",
  fktp: "NAMA FASILITAS KESEHATAN",
  fktpGigi: "-",
  statusPeserta: "0"
}
```

### 23.2 Bentuk base64 (produk)

```json
{"nomorKartu":"0000000000000","nama":"...","alamat":"...","tglLhr":"30-12-2026","nik":"...","fktp":"...","fktpGigi":"-","statusPeserta":"0"}
```

### 23.3 Bentuk base64 (sumber — tidak valid)

Payload yang dikirim pengguna pada 2026-11-06 bukan base64 yang sah:

- Panjang karakter data 329, sedangkan base64 wajib kelipatan 4.
- Saat dipaksa dekode sebagian, kunci yang muncul adalah `nomor-Kartu` (memakai tanda hubung) dan nilai nomor kartu berisi **14 digit**, bukan 13 seperti pada keterangan tertulis.

Kesimpulan: string tersebut rusak saat penyalinan, **dan** sumber aslinya memakai penamaan kunci yang berbeda dari yang tertulis pada permintaan.

### 23.4 Aturan tahan-rusak untuk parser

Parser harus menerima, untuk setiap konsep, semua variasi penulisan yang ditemukan dan yang wajar:

| Konsep | Nama kunci yang diterima |
|---|---|
| Nomor kartu | `nomorKartu`, `nomor-kartu`, `nomorKartuBPJS`, `noKartu`, `nokartu` |
| Nama | `nama`, `namaPeserta`, `name` |
| Alamat | `alamat` |
| Tanggal lahir | `tglLhr`, `tglLahir`, `tanggalLahir`, `tgl_lahir` |
| NIK | `nik`, `NIK` |
| Faskes 1 | `fktp`, `faskes`, `fktp1` |
| Faskes gigi | `fktpGigi`, `fktp_gigi`, `faskesGigi` |
| Status | `statusPeserta`, `status`, `status_peserta` |

Pencocokan dilakukan secara **tidak peka huruf besar-kecil** dan mengabaikan tanda hubung/garis bawah, sehingga `nomor-Kartu` dan `nomorKartu` dianggap sama.

### 23.5 Nomor kartu: 13 atau 14 digit

Kartu BPJS resmi memakai 13 digit. Nilai contoh pada sumber memuat 14 digit. Parser menerima keduanya; form tidak menolak salah satunya. Tidak ada klaim validasi checksum terhadap algoritma BPJS yang tidak dapat diverifikasi di sini.

### 23.6 Tata letak kartu (schema)

Ukuran kanvas: **350 × 244 piksel**, sama dengan sumber.

Sisi depan — blok teks berprefiks, koordinat piksel mengikuti sumber:

| id | Field | Prefiks | x | y | lebar | tinggi | ukuran font | gaya |
|---|---|---|---|---|---|---|---|---|
| `bpjs_no` | nomorKartu | `No Kartu:` | 25 | 83 | 275 | 25 | 15 | bold |
| `bpjs_nama` | nama | `Nama:` | 25 | 107 | 313 | 20 | 11 | normal |
| `bpjs_alamat` | alamat | `Alamat:` | 25 | 123 | 313 | 31 | 11 | normal |
| `bpjs_tanggal` | tglLhr | `Tgl Lahir:` | 25 | 153 | 275 | 20 | 11 | normal |
| `bpjs_nik` | nik | `NIK:` | 25 | 169 | 275 | 20 | 11 | normal |
| `bpjs_faskes` | fktp | `Faskes 1:` | 25 | 184 | 275 | 20 | 11 | normal |
| `bpjs_syarat` | tetap | — | 26 | 199 | 286 | 38 | 6 | normal |

Blok syarat-ketentuan memuat teks tetap:

```
Syarat dan Ketentuan :
1. Kartu Peserta harap dibawa Ketika berobat
2. Apabila kartu ini disalahgunakan akan dikenakan saksi
3. apabila ada perubahan atau kehilangan Kartu segera lapor ke kantor BPJS Kesehatan setempat
BPJS Kesehatan Care Center 165
www.bpjs-kesehatan.go.id
```

Blok kode QR: posisi `x:27, y:60`, ukuran `151 × 23` pada sumber. Karena pilihan pengguna adalah **QR berisi base64 JSON lengkap** (bukan barcode Code 39), ukuran blok ini harus ditambah agar QR cukup padat untuk menampung ~350 karakter base64. Ukuran final ditentukan saat implementasi dengan menguji keterbacaan (lihat §37).

Sisi belakang: hanya latar, tanpa elemen. Kolom `fktpGigi` dan `statusPeserta` ditampilkan di form tetapi **tidak** dicetak di kartu agar selaras dengan sumber yang tidak punya kolom itu.

---

## 24. Data Lifecycle & Operations

| Aspek | Aturan |
|---|---|
| Pemilik data | Pengguna, di perangkatnya sendiri |
| Penyimpanan | Hanya memori halaman + `localStorage` untuk riwayat |
| Retensi | Riwayat dibatasi 10 entri terakhir |
| Penghapusan | Tombol "Hapus riwayat" mengosongkan `localStorage` |
| Cadangan | Tidak ada; tidak ada data di server |
| Audit | Tidak ada; tidak ada server untuk diaudit |
| Data sensitif | NIK & nomor kartu tidak pernah dikirim ke jaringan |

---

## 25. API Specification

Tidak ada API eksternal. Antarmuka internal adalah fungsi JavaScript:

```
parsePayload(base64String)  → { ok: true, data: {...} } | { ok: false, error: "..." }
buildPayload(data)          → base64String
renderCard(side, data)      → void   (memperbarui DOM)
exportSide(index, format)   → Promise<Blob>
exportPdfAll()              → Promise<Blob>
```

---

## 26. Authentication

Tidak ada. Tidak ada akun, tidak ada sesi, tidak ada token.

---

## 27. Authorization

Tidak ada. Satu peran implisit.

---

## 28. Security Requirements

### 28.1 Tanpa transmisi data

Aplikasi tidak boleh mengirim isi form ke jaringan mana pun. Tidak ada `fetch`, `XMLHttpRequest`, atau pengiriman analitik. Ini adalah kontrol keamanan utama dan harus dipertahankan.

### 28.2 Kamera

- Hanya diminta saat pengguna menekan tombol.
- Stream dihentikan segera setelah kode terbaca atau panel ditutup.
- Tidak ada perekaman atau pengiriman frame.

### 28.3 Input

- Semua nilai dimasukkan lewat `textContent`, tidak pernah lewat `innerHTML`, untuk mencegah XSS dari payload base64 yang berisi HTML.
- Batas panjang: nama ≤ 100, alamat ≤ 200, nomor kartu ≤ 20, NIK ≤ 20.
- Nomor kartu dan NIK dibersihkan dari karakter non-digit sebelum dipakai.

### 28.4 Berkas gambar yang diunggah

- Hanya `image/*` yang diterima.
- Batas ukuran 10 MB.
- Diproses lewat `createImageBitmap` di memori, tidak pernah diunggah.

### 28.5 Riwayat `localStorage`

Riwayat hanya menyimpan **gambar hasil ekspor (blob/URL data)** dan nama berkas, tidak menyimpan teks NIK atau nomor kartu. Riwayat harus dapat dihapus penuh oleh pengguna.

### 28.6 Dependensi

Semua pustaka di-vendor ke repo. Tidak ada pemuatan skrip dari CDN saat runtime agar tidak ada pihak ketiga yang dapat mengubah perilaku halaman.

### 28.7 Catatan jujur

Kartu yang dihasilkan adalah tiruan visual. Ia tidak memiliki kekuatan hukum dan tidak diverifikasi oleh BPJS. Halaman harus menyatakan ini agar tidak disalahgunakan.

---

## 29. Validation Rules

| Field | Aturan |
|---|---|
| nomorKartu | wajib, digit saja, 13–14 karakter |
| nama | wajib, 1–100 karakter |
| alamat | wajib, 1–200 karakter |
| tglLhr | wajib, tanggal sah |
| nik | wajib, digit saja, 16 karakter |
| fktp | wajib, 1–100 karakter |
| fktpGigi | opsional |
| statusPeserta | opsional |

Base64: string harus mendekode menjadi JSON objek; jika gagal, tampilkan galat dan jangan ubah form.

---

## 30. Error Handling

| Kondisi | Pesan |
|---|---|
| Base64 tidak valid | "Kode tidak dapat dibaca. Pastikan salinan lengkap." |
| JSON bukan objek | "Isi kode tidak dikenali sebagai data peserta." |
| Tidak ada kolom yang dikenal | "Tidak ada data peserta pada kode ini." |
| Gambar tanpa QR | "Tidak ada kode QR pada gambar ini." |
| Gambar terlalu besar | "Ukuran gambar maksimal 10 MB." |
| Kamera ditolak | "Akses kamera ditolak. Gunakan pilihan dari gambar." |
| Kamera tidak tersedia | "Perangkat ini tidak mendukung pemindaian kamera." |
| Kolom wajib kosong | Tandai kolom dan sebutkan yang belum terisi |
| Ekspor gagal | "Gagal membuat berkas. Coba lagi." |

---

## 31. Edge Cases

- Base64 memakai `+` dan `/` yang di-encode jadi `%2B`/`%2F` pada URL — harus didekode `encodeURIComponent` lebih dulu.
- Base64 memakai tanda hubung/garis bawah (varian URL-safe) — harus dinormalkan.
- Payload memakai nama kunci berbeda (`nomor-Kartu` vs `nomorKartu`) — ditangani §23.4.
- Nomor kartu 14 digit — diterima.
- Tanggal lahir dalam format `DD-MM-YYYY` pada payload; form memakai input `date` yang butuh `YYYY-MM-DD` — perlu konversi dua arah.
- Pemuatan ulang halaman mengosongkan form (tidak ada penyimpanan form) — perilaku yang diterima.
- Banyak QR dalam satu gambar — ambil yang pertama.
- Gambar buram/beresolusi rendah — laporkan "kode tidak terbaca", jangan menggantung.
- Pengguna menekan unduh dua kali cepat — hasil identik, tidak merusak apa pun.
- `localStorage` penuh atau diblokir — riwayat dimatikan diam-diam, aplikasi tetap jalan.
- Nama sangat panjang — teks membungkus dalam blok, tidak meluber.
- Layar sempit — pratinjau diskalakan, tombol tetap terjangkau.
- Mode gelap — kontras tetap memenuhi WCAG AA.

---

## 32. Non-Functional Requirements

| Aspek | Target |
|---|---|
| Waktu muat | < 2 detik pada koneksi biasa |
| Berkas | Tanpa dependensi CDN saat runtime |
| Peramban | Chrome, Firefox, Safari, Edge versi terkini |
| Ponsel | Android & iOS, Safari & Chrome |
| Aksesibilitas | WCAG AA, navigasi papan ketik, label form |
| Bahasa | Antarmuka Bahasa Indonesia |

---

## 33. Testing Requirements

Pustaka uji: **Vitest** untuk unit, plus uji asap (smoke) peramban manual.

---

## 34. TDD Strategy & Test Seams

| Perilaku | Seam publik |
|---|---|
| Konversi base64 ↔ JSON | `parsePayload` / `buildPayload` |
| Tahan variasi kunci | `parsePayload` |
| Normalisasi base64 (URL-safe, padding) | `parsePayload` |
| Konversi tanggal dua arah | `toFormDate` / `fromFormDate` |
| Validasi field | `validate(data)` |
| Ukuran halaman PDF | `pdfPageSizeMm(width, height)` |
| Isi QR sama dengan payload | `qrContent(data)` |

---

## 35. TDD Vertical Slices

**Irisan 1 — Dekode base64 yang sah**
RED: `parsePayload("<base64 sah>")` harus mengembalikan 8 field.
GREEN: implementasi dekode + pemetaan.

**Irisan 2 — Tahan variasi nama kunci**
RED: `parsePayload` menerima `nomor-Kartu` 14 digit.
GREEN: normalisasi kunci.

**Irisan 3 — Base64 URL-safe dan tanpa padding**
RED: string dengan `-`/`_` dan tanpa `=` berhasil didekode.
GREEN: normalisasi alfabet & padding.

**Irisan 4 — Base64 rusak**
RED: string 329 karakter tidak sah mengembalikan `ok:false`.
GREEN: penanganan galat.

**Irisan 5 — Bulak-balik encode/decode**
RED: `buildPayload(parsePayload(x).data)` menghasilkan base64 yang didekode kembali ke objek sama.
GREEN: implementasi encode.

**Irisan 6 — Konversi tanggal**
RED: `"30-12-2026"` → `"2026-12-30"` dan kembali.
GREEN: fungsi konversi.

**Irisan 7 — Ukuran halaman PDF**
RED: 350×244 → sisi terpanjang 85,6 mm, sisi lain mengikuti rasio.
GREEN: `pdfPageSizeMm`.

**Irisan 8 — Isi QR**
RED: `qrContent(data)` menghasilkan base64 yang didekode ke objek sama.
GREEN: perangkai `buildPayload`.

**Irisan 9 — Validasi**
RED: `nomorKartu` kosong atau berisi huruf ditolak.
GREEN: `validate`.

---

## 36. Route Verification Matrix

| Route | Lapisan | Hasil | Test ID |
|---|---|---|---|
| `/index.html` | Registrasi | PASS | TEST-ROUTE-001 |
| `/index.html` | Render | PASS (tanpa galat konsol) | TEST-ROUTE-001 |
| `/index.html` | Responsif | PASS (360px & 1280px) | TEST-ROUTE-001 |
| `/?data=` | Ketergantungan | Form terisi | TEST-ROUTE-002 |
| `/404.html` | Batas galat | Halaman ramah | TEST-ROUTE-003 |
| Aset template | Ketergantungan | 200 tipe benar | TEST-ROUTE-004/005 |
| Aset vendor | Ketergantungan | 200, tanpa galat | TEST-ROUTE-006 |

---

## 37. Verification Matrix

| Requirement | Verifikasi |
|---|---|
| Dekode base64 sah | TEST-B64-001 |
| Dekode base64 rusak | TEST-B64-002 |
| Variasi nama kunci | TEST-B64-003 |
| Base64 URL-safe | TEST-B64-004 |
| Bulak-balik encode/decode | TEST-B64-005 |
| Konversi tanggal | TEST-DATE-001 |
| Ukuran halaman PDF | TEST-PDF-001 |
| Isi QR | TEST-QRGEN-001 |
| Validasi field | TEST-FORM-001 |
| Pindai QR gambar | TEST-QRIMG-001 (manual, perlu fixture) |
| Pindai QR kamera | TEST-QRCAM-001 (manual, perlu perangkat) |
| Isi dari URL | TEST-URL-001 |
| Ekspor JPG | TEST-EXP-001 (manual, periksa ukuran berkas) |
| Ekspor PDF | TEST-EXP-002 (manual, periksa ukuran halaman) |
| Keterbacaan QR hasil cetak | Uji manual: cetak → pindai balik → form terisi |

Catatan: uji pemindai kamera dan ekspor perlu peramban nyata, dijalankan manual pada tahap verifikasi akhir.

---

## 38. Test Commands

```bash
npm install
npm test              # seluruh unit test Vitest
npm run test:watch    # mode pengawasan
```

---

## 39. Environment Variables

Tidak ada. Situs statis murni, tanpa rahasia sama sekali.

---

## 40. Deployment Requirements

| Item | Nilai |
|---|---|
| Hosting | GitHub Pages |
| Sumber | `main`, akar repo |
| Build | Tidak ada; berkas statis langsung disajikan |
| HTTPS | Bawaan GitHub Pages (wajib untuk kamera) |
| Domain | `<user>.github.io/<repo>` |
| Berkas tambahan | `404.html`, `.nojekyll` (opsional bila ada berkas berawalan garis bawah) |
| Aset besar | Template depan 1,3 MB — pertahankan, tetapi pertimbangkan kompresi WebP bila waktu muat menjadi masalah |

Langkah: dorong ke `main` → Settings → Pages → Source: `main` / root → tunggu deploy.

---

## 41. Development Phases

1. **Fondasi** — struktur repo, HTML, CSS, tata letak responsif
2. **Payload** — base64 ↔ JSON, normalisasi, konversi tanggal, validasi
3. **Form** — pengikatan kolom, pratinjau langsung
4. **Kartu** — schema tata letak, render dua sisi, pembuatan QR
5. **Pemindai** — QR dari gambar, lalu dari kamera
6. **URL** — pembacaan `?data=`
7. **Ekspor** — JPG per sisi, PDF gabungan
8. **Riwayat** — `localStorage`
9. **Verifikasi** — unit test, uji peramban, uji cetak-balik-scan
10. **Deploy** — GitHub Pages

---

## 42. Implementation Tasks

### Fase 1 — Fondasi

- Buat `index.html` dengan struktur dua panel
- Buat `assets/css/style.css`: token warna, tata letak grid, responsif 360/768/1280
- Salin template depan & belakang ke `assets/img/`
- Salin `qrcode.js`, `jsQR.js`, `html2canvas.min.js` ke `assets/vendor/`
- Buat `404.html`
- Buat `.nojekyll`

### Fase 2 — Payload (TDD)

- `js/payload.js`: `parsePayload`, `buildPayload`, normalisasi kunci, normalisasi base64 URL-safe
- `js/date.js`: `toFormDate`, `fromFormDate`
- `js/validate.js`: `validate`
- Tulis test lebih dulu, lihat RED, lalu GREEN

### Fase 3 — Form

- `js/form.js`: baca/tulis nilai, tampilkan galat per kolom, aktifkan/matikan tombol unduh
- Sambungkan `input` event ke perenderan ulang pratinjau

### Fase 4 — Kartu

- `js/schema.js`: tata letak sesuai §23.6
- `js/card.js`: render dua sisi, prefiks label + nilai, blok syarat tetap, pembuatan QR dari `buildPayload(data)`
- Uji keterbacaan QR pada ukuran blok yang dipilih

### Fase 5 — Pemindai

- `js/scanner.js`: baca berkas → `createImageBitmap` → `jsQR` → `parsePayload`
- Jalur kamera: `getUserMedia`, ambil frame ke kanvas, deteksi, hentikan stream
- Tangani galat izin, tidak ada kamera, kode tidak terbaca

### Fase 6 — URL

- `js/app.js`: baca `URLSearchParams`, dekode, isi form saat muat

### Fase 7 — Ekspor

- `js/exporter.js`: render sisi ke kanvas lewat html2canvas, skala 4×, batas total piksel 36 juta
- Perakitan PDF manual: dua halaman, ukuran `85,6 mm` sisi terpanjang
- Nama berkas: `bpjs-depan.jpg`, `bpjs-belakang.jpg`, `bpjs-depan-belakang.pdf`

### Fase 8 — Riwayat

- `js/history.js`: simpan maksimum 10 entri (gambar + nama berkas) di `localStorage`
- Tombol hapus riwayat

### Fase 9 — Verifikasi

- `npm test` seluruh unit test lulus
- Uji peramban: muat halaman, tempel base64, pindai gambar, ekspor JPG & PDF
- Uji cetak-balik-scan: cetak kartu, pindai QR-nya, pastikan form terisi
- Uji responsif 360px dan 1280px
- Periksa konsol bersih dari galat

### Fase 10 — Deploy

- Dorong ke `main`
- Aktifkan GitHub Pages
- Buka URL hasil, ulangi uji cetak-balik-scan di origin nyata (kamera butuh HTTPS)

---

## 43. Acceptance Criteria

| ID | Kriteria |
|---|---|
| AC-01 | Membuka `/?data=<base64 sah>` mengisi seluruh kolom wajib |
| AC-02 | Menempel base64 sah mengisi seluruh kolom wajib |
| AC-03 | Base64 dengan kunci `nomor-Kartu` tetap terbaca |
| AC-04 | Base64 rusak menampilkan galat jelas dan tidak mengubah form |
| AC-05 | Memindai gambar berisi QR mengisi form |
| AC-06 | Pratinjau sisi depan & belakang tampil benar dengan data terisi |
| AC-07 | Tombol unduh JKG/JPG menghasilkan berkas gambar yang bisa dibuka |
| AC-08 | Tombol unduh PDF menghasilkan berkas dua halaman |
| AC-09 | Halaman PDF sisi terpanjang 85,6 mm |
| AC-10 | QR pada kartu memuat base64 yang dapat dipindai balik untuk mengisi form |
| AC-11 | Tidak ada permintaan jaringan berisi data peserta |
| AC-12 | Halaman responsif di 360px dan 1280px tanpa elemen terpotong |
| AC-13 | Konsol peramban bersih dari galat |
| AC-14 | Riwayat lokal tersimpan dan bisa dihapus |

---

## 44. Definition of Done

- Semua P0 dan P1 terimplementasi
- Seluruh rute dalam §17 terverifikasi sesuai §36
- Semua acceptance criteria AC-01..AC-14 lulus
- Unit test lulus (`npm test`)
- Tidak ada galat konsol
- Tidak ada permintaan jaringan berisi data peserta
- Berkas template & vendor ada di repo, tidak ada ketergantungan CDN saat runtime
- `README.md` menjelaskan cara pakai dan cara deploy
- Disclaimer "tiruan visual, tidak sah secara hukum" tampil di halaman
- Ter-deploy dan berfungsi di GitHub Pages

---

## 45. Assumptions

| # | Asumsi |
|---|---|
| A1 | Situs GitHub Pages dipakai tanpa backend. |
| A2 | Tanpa login dan tanpa peran. |
| A3 | Fokus satu jenis kartu (BPJS) saja. |
| A4 | Tanpa unggah foto profil. |
| A5 | Tanpa gerbang donasi. |
| A6 | Tanpa penyimpanan form saat muat ulang. |
| A7 | `fktpGigi` dan `statusPeserta` ada di form tetapi tidak dicetak di kartu. |
| A8 | Nomor kartu 13 atau 14 digit keduanya diterima; tidak ada validasi checksum. |
| A9 | Base64 pengguna pada 2026-11-06 rusak salin-tempel; parser dirancang tahan kerusakan, dan format kanonik dipakai untuk QR. |
| A10 | Pustaka di-vendor, bukan dari CDN, agar halaman tidak bergantung pihak ketiga. |
| A11 | Template depan 1,3 MB dipertahankan apa adanya; kompresi ditunda kecuali waktu muat menjadi masalah. |
| A12 | Kartu hasil keluaran adalah tiruan visual tanpa kekuatan hukum. |
