# AGENTS.md — Admin Dashboard UI/UX

Berlaku untuk semua yang dikerjakan di dalam `src/routes/(admin)/` dan komponen yang
dipakai admin (`src/lib/components/admin/`, `src/lib/components/ui/`).

Reuse token warna & tipografi dari `src/routes/(public)/AGENTS.md` supaya identitas tetap
konsisten — tapi kepadatan informasi lebih tinggi dan lebih fungsional/netral. Ini alat kerja
staf sekolah, bukan halaman promosi.

## Layout — sidebar tetap + top bar

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

- Sidebar **fixed di kiri**; collapsible jadi icon-only di tablet, off-canvas (toggle
  hamburger) di mobile. Jangan biarkan sidebar ikut scroll dengan konten utama di desktop.
- Grup menu sidebar per domain: Konten (Berita, Guru, Prestasi, Galeri, Agenda, Download,
  FAQ, Pages, Banner), Sistem (Users, Settings, Menu), Pesan (Contacts).
- Item menu yang tidak diizinkan untuk role user yang login **tidak ditampilkan sama
  sekali** — bukan ditampilkan lalu di-disable. Proteksi sebenarnya tetap di server (lihat
  matriks RBAC di PRD §6); sidebar hanya cerminan UI-nya, jangan andalkan ini sebagai
  satu-satunya lapisan keamanan.
- Topbar: breadcrumb (posisi halaman saat ini) + menu user (nama, role, logout). Bukan search
  bar besar atau elemen promosi.
- Item sidebar aktif di-highlight dengan `--color-primary` sebagai background tipis/left
  border — bukan warna solid penuh yang mendominasi.

## Warna & tone

- Background halaman: `--color-bg-subtle` (#F5F8FA); card/konten di atasnya pakai
  `--color-bg` (#FFFFFF) — kontras halus antara canvas dan card, khas dashboard.
- `--color-accent` (amber) dipakai **hanya** untuk status "butuh perhatian" (pesan kontak
  belum dibaca, form error) — bukan dekorasi seperti di public site.
- Status badge pakai warna semantik, bukan warna brand:
  - `DRAFT` → abu-abu netral
  - `PUBLISHED` → `--color-success` (#2E7D5B)
  - `ARCHIVED` → abu-abu gelap/muted
- Tipografi sama dengan public site (`Space Grotesk` untuk heading/card title,
  `Plus Jakarta Sans` untuk body/table), tapi lebih kecil & padat — prioritaskan densitas
  informasi yang tetap terbaca, bukan white space besar ala marketing page.

## Komponen umum

- **Data table**: header sortable, pagination, filter status/kategori, bulk action bar yang
  muncul saat ada row terpilih (soft-delete, publish, dsb).
- **Form**: dua kolom di desktop untuk form panjang (mis. Berita: field utama kiri, metadata
  status/SEO/featured image kanan); single column untuk form pendek (FAQ, Menu item).
- **Empty state**: pesan + CTA jelas ("Belum ada berita. Tambah berita pertama →"), bukan
  tabel kosong tanpa konteks.
- **Toast/notifikasi**: konsisten dengan nama tombol — tombol "Publikasikan" → toast
  "Berita dipublikasikan", bukan pesan generik "Berhasil".

## Aksesibilitas & performa

- Sidebar dan semua kontrol interaktif harus full keyboard-navigable, focus state terlihat
  jelas.
- Kontras teks di atas `--color-bg-subtle` tetap dicek AA, terutama `--color-ink-muted`.
- Hindari library dashboard berat (charting/animasi besar) untuk hal yang bisa diselesaikan
  dengan tabel/CSS biasa — prioritas load cepat untuk pekerjaan harian staf, bukan visual
  mewah.

# AGENTS.md — Public Site UI/UX

Berlaku untuk semua yang dikerjakan di dalam `src/routes/(public)/` dan komponen yang
dipakai halaman publik (`src/lib/components/public/`, `src/lib/components/ui/`).

Referensi lengkap: `PRD-Website-Sekolah-SvelteKit-v2.md` §5, §8, §10.

## Brief

Light theme. Modern, informatif, ringan (lightweight). Untuk **Sekolah Menengah Kejuruan
(SMK)** — audiens utama calon siswa/orang tua (PPDB) dan masyarakat umum.

Jangan pakai palet default "AI-generated" (cream hangat + aksen terracotta, atau dark theme
ber-aksen neon). Arah visual di bawah ini spesifik untuk identitas sekolah kejuruan.

## Design tokens

Arah: **"blueprint / lembar kerja teknik"** — terinspirasi gambar kerja teknik dan penanda
keselamatan bengkel, relevan untuk sekolah yang mengajarkan program keahlian teknis.

```css
--color-bg: #ffffff; /* base, bukan off-white krem */
--color-bg-subtle: #f5f8fa; /* tint biru sangat muda, nuansa kertas blueprint */
--color-ink: #14212e; /* teks utama — navy gelap, bukan hitam pekat */
--color-ink-muted: #52697d; /* teks sekunder/caption */
--color-primary: #1d4e89; /* biru blueprint — header, nav, link */
--color-accent: #f2994a; /* amber bengkel — TERBATAS: CTA, badge, hover saja */
--color-line: #d8e1e8; /* hairline / grid / divider */
--color-success: #2e7d5b; /* status positif */
```

`--color-accent` hanya untuk elemen non-teks-kecil (tombol, border, badge, ikon) — kontras
terhadap putih tidak cukup untuk teks kecil, dan supaya tetap terasa sengaja saat muncul,
bukan warna dominan.

### Tipografi

- **Heading/display**: `Space Grotesk` — geometric sans, terasa teknikal, cocok identitas
  sekolah teknik tanpa terasa korporat kaku.
- **Body**: `Plus Jakarta Sans` (fallback `Inter`) — humanist sans, keterbacaan tinggi,
  variable font (ringan), dukungan glyph Indonesia baik.
- **Utility/label/data**: `JetBrains Mono`, kecil-huruf-kapital untuk eyebrow label atau kode
  program keahlian (mis. `TKJ · RPL · TKR · TATA BOGA`).

Maks 2 font family + 1 mono. Self-host lewat `@fontsource` (bukan Google Fonts CDN langsung).

## Layout

- **Hero**: bukan foto stok besar — headline + ringkasan singkat + 3–4 angka kunci (jumlah
  program keahlian, tahun berdiri, akreditasi, alumni terserap kerja/kuliah), disusun seperti
  "spec sheet", garis grid tipis (`--color-line`) di background. Ringan secara payload
  (SVG/CSS, bukan gambar besar).
- **Program Keahlian**: grid card, garis aksen amber tipis muncul saat hover/focus (bukan
  selalu tampil), ikon line-art SVG inline per jurusan.
- **Berita/Agenda**: card ringkas, thumbnail dari `media` (pakai `width`/`height` tersimpan
  untuk cegah layout shift), lazy-load di bawah fold.
- **Footer**: kontak, peta (lazy-load embed), tautan cepat — padat tapi rapi.

```
┌────────────────────────────────────────────┐
│ [logo]      Beranda Profil Berita ... [PPDB]│
├────────────────────────────────────────────┤
│  EYEBROW (mono, kapital kecil)               │
│  Headline besar (Space Grotesk, bold)        │
│  Sub-copy singkat 1–2 baris                  │
│  [12 Program Keahlian] [Akreditasi A] [dst]  │
│  (garis grid tipis di background)            │
└────────────────────────────────────────────┘
```

## Signature element

Garis "crop mark" ala gambar teknik (bentuk L kecil di sudut) pada card program keahlian dan
pembatas section. Dipakai hemat — bukan di semua elemen.

## Aturan teknis

- SVG line-icon + CSS untuk ilustrasi/dekorasi, bukan gambar raster besar atau icon library
  berat.
- Foto asli (galeri, foto guru, kegiatan) lazy-load di bawah fold, dengan `width`/`height`
  dari tabel `media`.
- Kontras wajib lolos WCAG AA. `--color-accent` hanya untuk elemen besar/non-teks.
- Visible focus state di semua elemen interaktif — jangan hilangkan outline tanpa pengganti.
- Hormati `prefers-reduced-motion`.
- Style pakai Tailwind + Skeleton UI; definisikan token di atas sebagai CSS variables/Tailwind
  theme extension, jangan hardcode hex di komponen individual.
  s
