# DESIGN.md — Generator Kartu BPJS

> Status: **observed** — arah ini dibangun dari kode yang ada (PRD.md, index.html,
> assets/css/style.css) dan disahkan pengguna pada 2026-11-11.
> Sumber: PRD.md (tujuan & alur), render baseline 2026-11-11 (temuan),
> pemilihan arah visual oleh pengguna (3 alternatif disajikan).

## Arah visual: "Desa & Dokumen"

Dipilih pengguna dari tiga alternatif yang disajikan
(Desa & Dokumen, Studio Gelap, Kepulauan). Sifat: **terang, tenang, satu kolom;
kartu sebagai pahlawan; hijau BPJS satu-satunya aksen.**

### Tatabahasa arah (RX-UI-26)

- **Filsafat:** fungsional, tenang — alat kerja, bukan situs pamer
- **Grounding:** dokumen resmi (kartu) sebagai objek; header hijau BPJS sebagai
  jangkar visual
- **Tipografi:** system-ui (stack platform, 0 kB); angka no. kartu/NIK memakai
  `font-variant-numeric: tabular-nums`
- **Perilaku warna:** satu aksen (hijau BPJS) untuk aksi primer; status (error
  merah, sukses hijau gelap) terpisah; netral hijau-abu dingin satu keluarga
- **Bentuk:** radius 12 (panel) / 8 (kontrol) — shape lock
- **Layout:** satu kolom di semua lebar; panel pratinjau di atas (`order: -1`);
  dua kartu berdampingan ≥720px
- **Kepadatan:** balanced untuk tugas sekali-pakai (form) yang diulang operator
- **Material:** flat + bayangan halus; tidak ada glass/gradient

### Palet (peran, RX-UI-31)

| Token | Nilai (terang) | Peran |
|---|---|---|
| `--bg` | `#f0f4f1` | halaman (netral hangat-hijau) |
| `--surface` | `#ffffff` | panel |
| `--surface-alt` | `#f3f7f4` | stage pratinjau, hint code |
| `--border` / `--border-strong` | `#d8e1db` / `#b9c8c0` | tepi panel / tepi input |
| `--text` / `--text-muted` | `#17251f` / `#51635a` | teks utama / sekunder |
| `--accent` / `--accent-hover` | `#0e6b3e` / `#0b5a34` | **aksi primer** (hijau BPJS) |
| `--accent-soft` | `#e1efe7` | badge, status sukses |
| `--error` | `#b3261e` | galat validasi |
| `--success` | `#146c43` | status sukses teks |
| `--focus` | `#1a6fd4` | cincin fokus (biru, beda dari aksen) |

Skema: monokromatik netral + satu aksen; netral diwarnai hijau-merah jambu agar
satu keluarga dengan aksen. Tersedia **dua tema**: terang (default) dan gelap,
dipilih lewat switcher di header (`data-theme` pada `<html>`), persisten di
`localStorage('bpjs-theme')`, fallback mengikuti `prefers-color-scheme`.
Widget native (`color-scheme`) ikut tema; kartu pratinjau selalu putih
(objek yang dicetak — QR/barcode tidak boleh dibalik). Nilai gelap dinaikkan
agar kontras AA pada permukaan gelap (mis. aksen `#4cc38a` vs `#17201b`).

### Keputusan desain (Design Decision Record)

1. **Satu kolom, kartu di atas**
   - Keputusan: kartu = hal pertama yang dilihat di semua lebar
   - Opsi: (a) 2 kolom form|preview sticky, (b) 1 kolom kartu atas
   - Bukti: baseline 2-kolom lama membuat kartu 350px tenggelam di panel 770px
     (observed: render 2026-11-11); kriteria Frame "kartu terlihat <5 detik"
   - Trade-off: desktop lebar terasa kosong → diredam dengan kartu 2-sisi
     berdampingan; mobile: form jauh dari preview → diterima, alur dasar
     aplikasi adalah tempel-kode (P0) yang mengisi keduanya sekaligus
   - Tes: pengguna baru melihat kartu kosong, langsung mengenali tujuannya
2. **Galat validasi ditunda sampai unduhan dicoba**
   - Keputusan: form dibuka bersih; klik unduh dengan data kurang → pesan
     per kolom tampil (`touched` di app.js)
   - Bukti: baseline menampilkan 6 pesan merah sebelum pengguna mengetik
     (observed: render baseline) — RX-FM-03
   - Trade-off: pengguna yang tidak mencoba unduh tidak tahu kolom mana wajib
     → tanda `*` merah di label tetap ada
   - Tes: klik "Unduh PDF" pada form kosong → 6 pesan muncul, tidak ada yang
     hilang/dihapus dari input
3. **Satu tombol primer: Unduh PDF**
   - Keputusan: PDF = deliverable lengkap → `btn-primary`; kedua JPG
     sekunder; "Isi dari Kode" sekunder (jalur input, bukan aksi komit)
   - Bukti: baseline 3 tombol setara (2 primary + 1 accent) — RX-PR-03
   - Trade-off: pengguna yang hanya mau satu sisi JPG mengklik dua langkah
     → diterima; label tombol eksplisit
   - Tes: satu elemen `btn-primary` per layar (diukur di render)
4. **Jalur cepat base64 di atas form manual**
   - Keputusan: P0 PRD (G1) = isi dari kode; diletakkan di puncak form,
     tombol QR menyusut menjadi dua ghost kecil
   - Bukti: prioritas P0 di PRD §13; pengguna utama (operator) punya payload
     dari aplikasi lain
   - Trade-off: pengguna input manual scrolling lebih dulu → diterima
     (jalur cepat hanya 2 baris)
   - Tes: tempel base64 → klik 1 tombol → form + kartu terisi (dilakui di
     verifikasi 2026-11-11)
5. **Font kartu 9px pada kanvas 350×222**
   - Keputusan: mempertahankan skala kartu resmi (11pt × 0,7387)
   - Catatan: `ryux scan` menandai <12px — pengecualian tertulis: ini teks
     pada kanvas yang di-skalakan dan diekspor 4× (~36px hasil cetak), bukan
     teks UI yang dibaca langsung; ukuran juga ditentukan pengguna
   - Tes: hasil ekspor 4× terbaca seperti kartu asli

## Permukaan: aplikasi (task UI)

Arah dibawa lewat lapisan merek saja (RX-UI-33): tipografi, peran warna,
radius, satu motif (kartu hijau + latar netral). Kepadatan, komponen, dan
hierarki diputuskan ulang untuk tugas: form satu kolom, preview dua kartu,
tombol unduh bertingkat.

## Batasan yang dipertahankan dari produk lama (RX-UX-10)

- Semua ID DOM yang dipakai `app.js`/`exporter.js`/`scanner.js`
- `fitPreviews()` menskalakan kanvas 350px ke stage (ekspor melepas skala)
- Aturan CSS `.card-*` (grid 67px + 9px + 1fr, line-clamp) — memengaruhi hasil cetak
- Pustaka di-vendor; tanpa build; 41 unit test Vitest tetap hijau
