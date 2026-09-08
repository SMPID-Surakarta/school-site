---
applyTo: 'src/routes/(public)/**/*.svelte,src/lib/components/public/**/*.svelte,src/lib/components/ui/**/*.svelte'
---

# UI/UX — Public Site (Light Theme, SMK)

Brief: modern, informatif, ringan (lightweight), untuk **Sekolah Menengah Kejuruan (SMK)**.
Audiens utama: calon siswa & orang tua (PPDB), masyarakat umum. Hindari palet default
"AI-generated" (cream hangat + aksen terracotta, atau tema gelap ber-aksen neon) — arah
visual di bawah ini spesifik untuk identitas sekolah kejuruan, jangan diganti ke tema generik.

## Design tokens

### Warna — arah "blueprint / lembar kerja teknik"

Terinspirasi dari gambar teknik (blueprint) dan penanda keselamatan bengkel — relevan untuk
identitas SMK (siswa bekerja dengan gambar kerja, alat, dan program keahlian teknis).

```css
--color-bg: #ffffff; /* base, bukan off-white krem */
--color-bg-subtle: #f5f8fa; /* tint biru sangat muda, nuansa kertas blueprint */
--color-ink: #14212e; /* teks utama — navy gelap, bukan hitam pekat */
--color-ink-muted: #52697d; /* teks sekunder/caption */
--color-primary: #1d4e89; /* biru blueprint — header, nav, link, elemen institusional */
--color-accent: #f2994a; /* amber/oranye bengkel — dipakai TERBATAS: CTA, badge, hover */
--color-line: #d8e1e8; /* hairline / grid / divider */
--color-success: #2e7d5b; /* status positif (mis. kuota PPDB masih ada) */
```

Aturan pemakaian `--color-accent`: hanya untuk elemen non-teks-kecil (tombol, border aktif,
badge, ikon, garis penanda) karena kontrasnya terhadap putih tidak cukup untuk teks kecil.
Jangan jadikan warna dominan — tetap warna kedua yang jarang muncul, supaya tetap terasa
sengaja saat dipakai.

### Tipografi

- **Heading / display**: `Space Grotesk` — geometric sans, terasa teknikal & modern, cocok
  untuk identitas sekolah teknik tanpa terasa korporat kaku.
- **Body**: `Plus Jakarta Sans` (fallback `Inter`) — humanist sans, keterbacaan tinggi,
  dukungan glyph Indonesia baik, variable font (ringan, satu file untuk banyak weight).
- **Utility / label / data**: `JetBrains Mono`, dipakai kecil-huruf-kapital untuk eyebrow
  label atau kode program keahlian (mis. `TKJ · RPL · TKR · TATA BOGA`) — memberi nuansa
  "spec sheet" yang informatif, bukan dekoratif semata.

Batasi hanya 2 font family + 1 mono, self-host lewat `@fontsource` atau serupa (bukan Google
Fonts CDN langsung) untuk performa & privasi.

### Layout concept

- **Hero**: bukan foto stok besar. Headline + ringkasan singkat + 3–4 angka kunci (jumlah
  program keahlian, tahun berdiri, akreditasi, jumlah alumni terserap kerja/lanjut kuliah)
  disusun seperti "spec sheet", dengan garis grid tipis (`--color-line`) di background —
  ringan secara payload (SVG/CSS, bukan gambar besar) dan langsung informatif.
- **Program Keahlian**: grid card, tiap card punya garis aksen amber tipis yang muncul saat
  hover/focus (bukan selalu tampil) — ikon line-art per jurusan (SVG inline, bukan icon font
  besar).
- **Berita/Agenda**: list/card ringkas dengan thumbnail dari `media` (sudah ada
  `width`/`height` tersimpan → hindari layout shift), lazy-loaded di bawah fold.
- **Footer**: informasi kontak, peta (embed lazy-load), tautan cepat — padat tapi rapi,
  bukan mega-footer berlebihan.

ASCII wireframe hero:

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

### Signature element

Garis "crop mark"/penanda ukur ala gambar teknik (bentuk L kecil di sudut) pada card program
keahlian dan pembatas section — elemen unik yang konsisten dengan dunia gambar
kerja/blueprint SMK, dipakai hemat (bukan di semua elemen) supaya tetap terasa sengaja.

## Aturan teknis (lightweight & aksesibilitas)

- Utamakan SVG line-icon dan CSS untuk ilustrasi/dekorasi, bukan gambar raster besar atau
  library icon berat.
- Foto asli (galeri, foto guru, foto kegiatan) baru dimuat lazy, di bawah fold, dengan
  `width`/`height` dari tabel `media`.
- Kontras warna wajib lolos WCAG AA: `--color-primary` di atas putih aman untuk teks;
  `--color-accent` hanya untuk elemen besar/non-teks (lihat aturan warna di atas).
- Visible focus state di semua elemen interaktif (link, tombol, form) — jangan hilangkan
  outline tanpa pengganti yang jelas terlihat.
- Hormati `prefers-reduced-motion` — animasi/transition di-nonaktifkan atau diperhalus kalau
  user mengaktifkan setting ini.
- Style pakai Tailwind + Skeleton UI utility classes sesuai konvensi umum project; definisikan
  token di atas sebagai CSS variables/Tailwind theme extension, jangan hardcode hex di
  komponen individual.
