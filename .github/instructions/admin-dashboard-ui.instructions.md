---
applyTo: 'src/routes/(admin)/**/*.svelte,src/lib/components/admin/**/*.svelte,src/lib/components/ui/**/*.svelte'
---

# UI/UX — Admin Dashboard (Sidebar Layout)

Admin dashboard pakai layout **sidebar tetap + top bar**, memakai token warna yang sama
dengan public site (lihat `ui-ux-public.instructions.md`) supaya identitas tetap konsisten,
tapi kepadatan informasi lebih tinggi dan lebih fungsional/netral — ini alat kerja staf
sekolah, bukan halaman promosi.

## Layout structure

```
┌──────────┬─────────────────────────────────────────┐
│          │ Topbar: breadcrumb          [user ▾]     │
│ Sidebar  ├─────────────────────────────────────────┤
│  - Logo  │                                           │
│  - Menu  │  Content area                             │
│    Berita│  (cards / table / form)                   │
│    Guru  │                                           │
│    ...   │                                           │
│  - User  │                                           │
│  role    │                                           │
└──────────┴─────────────────────────────────────────┘
```

- Sidebar **fixed di kiri**, collapsible jadi icon-only di layar sempit (tablet), dan jadi
  off-canvas (toggle hamburger) di mobile. Jangan buat sidebar yang scroll bersama konten
  utama di desktop.
- Menu sidebar dikelompokkan sesuai domain: Konten (Berita, Guru, Prestasi, Galeri, Agenda,
  Download, FAQ, Pages, Banner), Sistem (Users, Settings, Menu), Pesan (Contacts). Item menu
  yang tidak diizinkan untuk role user yang login **tidak ditampilkan sama sekali** — bukan
  ditampilkan lalu di-disable (selaras dengan aturan RBAC di
  `admin-routes.instructions.md`: proteksi tetap ditegakkan di server, sidebar hanya
  cerminan UI-nya).
- Topbar berisi breadcrumb (posisi halaman saat ini) dan menu user (nama, role, logout) —
  bukan search bar besar atau elemen promosi.
- Highlight item sidebar yang aktif dengan `--color-primary` sebagai background tipis/left
  border, bukan warna solid penuh yang mendominasi.

## Warna & tone untuk admin

Reuse token dari public site, tapi dengan penekanan berbeda:

- Background halaman: `--color-bg-subtle` (#F5F8FA), card/konten di atasnya pakai
  `--color-bg` (#FFFFFF) — kontras halus antara canvas dan card, khas dashboard.
- `--color-accent` (amber) dipakai **hanya** untuk status "butuh perhatian" (mis. pesan
  kontak belum dibaca, form error) — bukan dekorasi seperti di public site.
- Status badge pakai warna semantik, bukan warna brand:
  - `DRAFT` → abu-abu netral
  - `PUBLISHED` → `--color-success` (#2E7D5B)
  - `ARCHIVED` → abu-abu gelap/muted
- Tipografi sama (`Space Grotesk` untuk heading halaman/card title, `Plus Jakarta Sans` untuk
  body/table), tapi ukuran lebih kecil & lebih padat dibanding public site — prioritaskan
  densitas informasi yang tetap terbaca, bukan white space besar ala marketing page.

## Komponen umum

- **Data table**: header sortable, pagination, filter by status/kategori, bulk action bar
  yang muncul saat ada row terpilih (soft-delete, publish, dsb).
- **Form**: pakai layout dua kolom di desktop (field utama kiri, sidebar info/metadata kanan
  — mis. status, SEO fields, featured image) untuk form panjang seperti Berita; single column
  untuk form pendek (FAQ, Menu item).
- **Empty state**: tiap halaman list kosong punya pesan + CTA jelas ("Belum ada berita.
  Tambah berita pertama →"), bukan tabel kosong tanpa konteks.
- **Toast/notifikasi**: konsisten dengan nama aksi tombol — tombol "Publikasikan" → toast
  "Berita dipublikasikan", bukan pesan generik "Berhasil".

## Aksesibilitas & performa

- Sidebar dan semua kontrol interaktif harus bisa dinavigasi keyboard penuh (tab order
  logis, focus state terlihat jelas).
- Kontras teks di atas `--color-bg-subtle` tetap dicek AA, terutama untuk teks
  `--color-ink-muted`.
- Hindari library dashboard berat (charting/animasi besar) untuk hal yang bisa diselesaikan
  dengan tabel/CSS biasa — dashboard ini alat kerja harian staf, prioritas load cepat, bukan
  visual mewah.
