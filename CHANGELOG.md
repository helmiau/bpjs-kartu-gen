# Changelog

Semua perubahan penting dicatat di sini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/id/1.0.0/), versi mengikuti
[SemVer](https://semver.org/lang/id/).

## [1.7.4] - 2026-11-14

### Ditambah
- **Cetak A4 Duplex langsung**: tombol baru membuka dialog cetak peramban
  tanpa perlu menyimpan PDF dulu.
- **Persistensi lokal**: form single dan antrean batch tersimpan di
  perangkat; tidak hilang saat peramban dimuat ulang.
- **Progress ekspor batch**: bilah kemajuan + tombol **Batal** saat
  membuat PDF massal.
- **Tempel langsung ke dropzone**: paste gambar QR langsung dipindai;
  paste teks langsung diproses sebagai TSV/CSV/base64.
- **PWA offline**: aplikasi dapat dipasang dan dibuka tanpa jaringan
  setelah pertama kali dimuat (manifest + service worker).
- **Pemulihan QR**: nama berkas yang QR-nya gagal terbaca ditampilkan
  secara eksplisit di status.
- **Modal changelog**: tekan nomor versi di footer untuk melihat catatan
  versi ini.

### Diperbaiki
- Alamat 3 baris: font mengecil otomatis agar tidak terpotong dan tidak
  menimpa baris di bawahnya (preview dan PDF konsisten).
- Tombol "Bersihkan" kini jelas terlihat (outline merah + ikon), kontras
  lulus AA pada tema terang dan gelap.

## [1.7.0] - 2026-11-13

### Ditambah
- **Layout Cetak A4 Bolak-Balik (Duplex)**: tiga mode (berdampingan,
  vertikal, grid lembar penuh), crop marks, garis lipat, ekspor PDF A4
  duplex, ekspor batch A4.
- **Tab pratinjau**: Sisi Depan / Sisi Belakang / Simulasi A4 Duplex;
  navigasi prev/next kartu untuk antrean batch.
- **Watermark COPY** + **huruf kapital otomatis** pada nama (toggle di
  Pengaturan Render & Visual).
- **Toast notifikasi** mikro; **label eksplisit** digit (13/16) pada
  kolom form.
- **Batch**: tab Impor file / Tempel teks dengan auto-detect per baris
  (TSV/CSV atau base64).

## [1.6.0] - 2026-11-12

### Ditambah
- Pengaturan Render & Visual sebagai panel berdiri sendiri (fotokopi
  hitam-putih, PDF raster, watermark, auto-kapital).
- Terjemahan antarmuka Indonesia/Inggris dengan tombol ganti bahasa.
- Template unduhan CSV/TSV/XLSX; tambah dari kode base64 atau gambar QR
  berulang.

## [1.5.0] - 2026-11-12

### Ditambah
- Pemrosesan batch: impor CSV/TSV/XLSX, tabel antrean, pilih/hapus,
  ekspor PDF massal, pratinjau dua tumpuk.
- Rombak UI mengikuti desain (dua kolom, panel bisa dilipat).

## [1.4.0] - 2026-11-11

### Ditambah
- Ekspor 300 dpi; PDF teks vektor yang bisa diedit.
- Nama berkas ekspor terstandar: `KARTU_<nomor>-BPJS[_DEPAN|_BELAKANG].<ext>`.
- Toggle ekspor fotokopi hitam-putih & PDF raster.
- Logo & ikon web diganti logo BPJS Kesehatan.

## [1.3.0] - 2026-11-10

### Ditambah
- Versi web ditampil di footer; cache-bust aset.
- Tema gelap dengan saklar header, tersimpan di perangkat.
- Redesain UI satu kolom kartu-di-atas, satu aksi primer, validasi
  tertunda.

## [1.2.0] - 2026-11-09

### Ditambah
- Upgrade kedua sisi template ke resolusi tinggi.
- Pindai QR dari gambar / kamera; isi form dari kode base64.

## [1.1.0] - 2026-11-08

### Ditambah
- Render kartu dua sisi sesuai tata letak resmi (label, titik dua,
  nilai, barcode Code 128).
- Ekspor sisi tunggal JPG / PDF.

## [1.0.0] - 2026-11-08

### Ditambah
- Rilis pertama: form data peserta, pratinjau kartu, ekspor JPG/PDF.
  Semua proses berjalan di peramban, tanpa server.
