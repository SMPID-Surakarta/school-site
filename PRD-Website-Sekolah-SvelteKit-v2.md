# Product Requirements Document (PRD)

## Website Sekolah CMS — v2 (Revised)

> Perubahan dari v1 ditandai dengan **[REVISI]**. Alasan tiap revisi dijelaskan singkat agar bisa didiskusikan sebelum development dimulai.

---

## 1. Project Overview

Membangun website profil sekolah yang ringan, SEO-friendly, responsif, dan mudah dikelola melalui CMS internal.

Website terdiri dari dua area utama:

- **Public Site**: Website yang dapat diakses oleh masyarakat.
- **Admin Dashboard**: Area terproteksi untuk mengelola seluruh konten.

**[KEPUTUSAN]** Project ini berdiri sendiri — tidak ada modul keuangan atau data siswa. `users`/auth tidak perlu dirancang untuk sharing lintas sistem; database dan session boleh sepenuhnya lokal ke project ini.

---

## 2. Tech Stack

| Layer                      | Choice                                     | **[REVISI]** Catatan versi (per Jul 2026)                                                                                                                                                                                                             |
| -------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework                  | SvelteKit                                  | Gunakan SvelteKit 2.x dengan Svelte 5 (runes: `$state`, `$derived`, `$effect`)                                                                                                                                                                        |
| Language                   | TypeScript (Strict Mode)                   | —                                                                                                                                                                                                                                                     |
| Styling                    | Tailwind CSS + Skeleton UI                 | Cek kompatibilitas Skeleton UI versi terbaru dengan Tailwind v4 sebelum init                                                                                                                                                                          |
| Database                   | PostgreSQL                                 | 16+ disarankan untuk native `tsvector`/GIN index performance                                                                                                                                                                                          |
| ORM                        | Drizzle ORM + drizzle-kit                  | —                                                                                                                                                                                                                                                     |
| Authentication             | Auth.js (`@auth/sveltekit`)                | Perlu tabel tambahan (lihat §4.1)                                                                                                                                                                                                                     |
| Validation                 | Zod + sveltekit-superforms                 | —                                                                                                                                                                                                                                                     |
| Storage                    | Cloudflare R2 (AWS SDK v3)                 | **[REVISI]** Tambahkan `sharp` untuk resize/convert WebP/AVIF sebelum upload ke R2                                                                                                                                                                    |
| Testing                    | Vitest + Playwright                        | —                                                                                                                                                                                                                                                     |
| **[KEPUTUSAN]** Deployment | `@sveltejs/adapter-node` (VPS/self-hosted) | R2 diakses lewat AWS SDK v3 REST API (bukan Cloudflare Workers binding, karena bukan Workers runtime). Sitemap/RSS regen dan cron job (mis. expired announcements/banners) bisa pakai `node-cron` atau OS-level cron yang memanggil endpoint internal |

---

## 3. Engineering Standards

- Repository Pattern
- Service Layer
- Zod untuk seluruh validasi
- sveltekit-superforms untuk seluruh form
- Hindari penggunaan `any`
- Environment variable menggunakan `$env/static/private` atau `$env/dynamic/private`
- ESLint + Prettier
- TypeScript Strict Mode
- **[REVISI]** Conventional Commits (`feat:`, `fix:`, `chore:`...) — dibutuhkan agar Copilot/agent bisa menulis commit message konsisten
- **[REVISI]** Setiap `service` function mengembalikan `Result<T, AppError>` (atau melempar `AppError` custom class), bukan raw throw — memudahkan error handling konsisten di route handlers

---

## 4. Database Schema

**[REVISI]** Tambahkan konvensi global:

- Semua PK: `uuid` (`defaultRandom()`), bukan auto-increment — lebih aman untuk API publik (tidak bisa ditebak/enumerate).
- Semua tabel konten (posts, achievements, galleries, banners) sebaiknya punya `deleted_at` (soft delete) supaya arsip tidak hilang permanen dan bisa dipulihkan dari admin.
- Semua `image_url`/`thumbnail_url`/`photo_url` sebaiknya jadi **FK ke `media.id`** (bukan string bebas), agar file tidak jadi orphan saat dihapus. Tambahkan `alt_text` di `media` untuk accessibility & SEO image.

### users

- id (uuid, pk)
- name
- email (unique)
- password_hash
- role (ADMIN, EDITOR, STAFF)
- **[REVISI]** email_verified_at (nullable) — Auth.js perlu ini untuk email verification flow
- **[REVISI]** is_active (boolean, default true) — untuk nonaktifkan akun tanpa hapus
- created_at
- updated_at

### **[REVISI 一 BARU]** sessions, accounts, verification_tokens

Auth.js (`@auth/sveltekit`) dengan Drizzle adapter **wajib** punya tabel ini persis sesuai skema resmi `@auth/drizzle-adapter`. Tanpa ini, login/session tidak akan berfungsi. Generate lewat adapter, jangan tulis manual dari nol.

### teachers

- id, name, slug
- position
- **[REVISI]** subject (mapel yang diampu) — sering dibutuhkan untuk halaman guru-tendik
- **[REVISI]** nip_nuptk (nullable) — nomor identitas guru, umum di konteks sekolah Indonesia
- **[REVISI]** bio (text, nullable)
- photo_url → **[REVISI]** photo_media_id (fk → media.id)
- **[REVISI]** is_active (boolean) — guru pindah/pensiun tanpa hapus data historis
- created_at, updated_at

### posts

- id, title, slug (unique)
- content
- thumbnail_url → **[REVISI]** thumbnail_media_id (fk → media.id)
- author_id (fk → users.id)
- category_id (fk → categories.id)
- seo_title, seo_description, seo_keywords, og_image
- status (DRAFT, PUBLISHED, ARCHIVED)
- **[REVISI]** published_at (nullable) — beda dari created_at, dibutuhkan untuk sitemap/RSS urut tayang
- **[REVISI]** search_vector (tsvector, generated) — untuk `/search` full-text search dengan GIN index
- created_at, updated_at, **deleted_at**

### **[REVISI — BARU]** post_tags (junction table)

- post_id (fk → posts.id)
- tag_id (fk → tags.id)
- PK gabungan (post_id, tag_id)

`tags` sudah ada di skema asli tapi tidak pernah di-link ke `posts` — many-to-many butuh tabel ini.

### achievements

- id, title, description
- image_url → **[REVISI]** image_media_id (fk → media.id)
- date
- **[REVISI]** level (nullable: sekolah/kecamatan/kota/provinsi/nasional/internasional) — umum untuk data prestasi sekolah, berguna untuk filter
- created_at, updated_at, **deleted_at**

### galleries

- id, title
- image_url → **[REVISI]** image_media_id (fk → media.id)
- category
- created_at, updated_at

**[KEPUTUSAN]** Struktur tetap flat (tidak dikelompokkan per album). `category` cukup untuk filter di UI.

### agendas

- id, title, description
- start_date, end_date, location
- **[REVISI]** created_at, updated_at (hilang di skema asli — semua tabel lain punya ini)

### downloads

- id, title
- file_url → **[REVISI]** file_media_id (fk → media.id)
- size
- **[REVISI]** category (nullable) — mis. "Formulir PPDB", "Kalender Akademik"
- created_at

### faqs

- id, question, answer, order

### pages

- id, title, slug, content, published, updated_at
- **[REVISI]** created_at (hilang)

### settings

**[REVISI]** Ini adalah tabel single-row (config), sebaiknya eksplisit: tambahkan `id` fixed (mis. selalu `1`) atau gunakan key-value pattern agar tidak ada resiko multiple rows tak sengaja.

- school_name, tagline, description
- address, phone, email
- logo_url, favicon_url, hero_image → sebaiknya fk ke `media`
- social_media (jsonb, bukan string tunggal — untuk multi platform: instagram, youtube, facebook, tiktok)
- google_maps_embed, google_analytics_id

### menus

- id, title, url, parent_id, order, visible

### banners

- id, title, subtitle
- image_url → **[REVISI]** image_media_id (fk → media.id)
- button_text, button_url
- order, published
- **[REVISI]** start_at, end_at (nullable) — banner promosi biasanya time-bound (mis. PPDB banner)

### announcements

- id, title, content, priority, expired_at
- **[REVISI]** created_at (hilang)
- **[REVISI]** target_role (nullable: all/guru/siswa) — jika nanti dipakai lintas modul

### categories

- id, name, slug

### tags

- id, name, slug

### media

- id, filename, original_name, mime, size
- r2_key, url
- **[REVISI]** alt_text (nullable) — wajib untuk accessibility + Image SEO
- **[REVISI]** width, height (nullable) — hindari layout shift (CLS), penting untuk skor Lighthouse Performance
- uploaded_by (fk → users.id)
- created_at

### contacts

- id, name, email, phone, message
- read (boolean)
- **[REVISI]** replied_at (nullable) — tracking follow-up dari admin
- created_at

---

## 5. Routing

### Public

- /
- /profil/sambutan, /profil/visi-misi, /profil/sejarah, /profil/guru-tendik
- /berita, /berita/[slug]
- /prestasi
- /galeri
- /ppdb
- /ekstrakurikuler
- /download
- /agenda
- /kontak
- /faq
- /search

### Admin

- /login
- /admin
- /admin/berita, /admin/guru, /admin/prestasi, /admin/galeri, /admin/agenda
- /admin/download, /admin/faq, /admin/settings, /admin/pages
- /admin/menu, /admin/banner, /admin/media
- **[REVISI]** /admin/users — manajemen akun ADMIN/EDITOR/STAFF tidak ada di v1, padahal role sudah didefinisikan
- **[REVISI]** /admin/contacts — untuk membaca/reply pesan dari form kontak

### **[REVISI — BARU]** API (internal, dipakai oleh form actions / client fetch)

- /api/search — full text search endpoint
- /api/sitemap.xml, /api/rss.xml (atau lewat `+server.ts` di routes)

---

## 6. Role-Based Access Control **[REVISI — BARU, sebelumnya tidak ada]**

Role sudah didefinisikan di skema (`ADMIN`, `EDITOR`, `STAFF`) tapi tidak ada matriks akses. Ini wajib didefinisikan sebelum implementasi Phase 2 (Route Protection), contoh:

| Resource                                             | ADMIN      | EDITOR                                                              | STAFF     |
| ---------------------------------------------------- | ---------- | ------------------------------------------------------------------- | --------- |
| Users                                                | CRUD       | -                                                                   | -         |
| Settings, Menu, Banner                               | CRUD       | -                                                                   | -         |
| Posts (semua)                                        | CRUD       | CRUD milik sendiri, **boleh langsung publish tanpa approval ADMIN** | Read-only |
| Guru, Prestasi, Galeri, Agenda, Download, FAQ, Pages | CRUD       | CRUD                                                                | Read-only |
| Contacts                                             | Read/Reply | Read/Reply                                                          | -         |
| Media Library                                        | CRUD       | Upload + hapus milik sendiri                                        | -         |

---

## 7. Development Phases

### Phase 1 — Foundation

- Inisialisasi SvelteKit (Svelte 5), Tailwind, Skeleton UI
- Drizzle ORM + schema + migrasi
- **[REVISI]** `.env.example` + validasi env dengan Zod di startup

### Phase 2 — Auth & Storage

- Auth.js + Drizzle adapter (sessions/accounts/verification_tokens)
- Route Protection sesuai matriks RBAC (§6)
- Cloudflare R2 + upload/delete utility + resize/convert (sharp)

### Phase 3 — Admin CRUD

- Admin Layout
- CRUD: Berita (+ tags), Guru, Prestasi, Galeri (+ album), Agenda, Download, FAQ, Pages, Banner, Settings
- **[REVISI]** CRUD Users (RBAC), Contacts (read/reply)

### Phase 4 — Public Site

- Public Layout, SSR Data Loading, Responsive Design
- Search (full-text, `tsvector`)
- Sitemap, robots.txt, RSS Feed

### **[REVISI — BARU]** Phase 5 — QA & Launch

- Vitest (unit: services/repositories), Playwright (e2e: login, CRUD, form kontak, search)
- Lighthouse audit terhadap target §8
- Deployment pipeline (CI: lint + test + build; CD: sesuai adapter yang dipilih)

---

## 8. SEO Requirements

- Sitemap otomatis, robots.txt, Canonical URL
- JSON-LD, Open Graph, Twitter Card, Breadcrumb
- RSS Feed, Manifest
- WebP / AVIF, Lazy Loading
- Meta SEO per halaman

Target Lighthouse:

- Performance ≥95, SEO =100, Accessibility ≥95, Best Practices =100

---

## 9. Security

- Argon2id Password Hashing
- CSRF Protection, XSS Sanitization, Content Security Policy
- Secure Cookies, Session Expiration
- Rate Limiting Login
- Server-side Validation
- **[REVISI]** Rate limiting juga untuk form kontak & search (cegah spam/abuse)
- **[REVISI]** File upload validation: whitelist MIME type + max size di server (bukan hanya client)

---

## 10. Performance

- SSR untuk halaman dinamis, Prerender untuk halaman statis
- Cache Header, Responsive Images
- Optimasi Upload Gambar, Cloudflare CDN

---

## 11. Folder Structure

```text
src/
├── lib/
│   ├── auth/
│   ├── db/
│   │   └── schema/          # [REVISI] pisah per domain: users.ts, posts.ts, media.ts, dst.
│   ├── server/
│   │   ├── repositories/
│   │   ├── services/
│   │   ├── storage/
│   │   └── validators/
│   ├── components/
│   ├── seo/
│   └── utils/
├── routes/
│   ├── (public)/
│   ├── (admin)/
│   └── api/
tests/
├── unit/                    # [REVISI] eksplisit untuk Vitest
└── e2e/                     # [REVISI] eksplisit untuk Playwright
```

---

## 12. Decisions Log **[REVISI]**

Keputusan yang sudah difinalkan (menggantikan "Open Questions" di draft sebelumnya):

1. **Deployment**: `adapter-node`, self-hosted/VPS.
2. **Scope**: berdiri sendiri — tidak ada modul Keuangan atau Data Siswa, tidak ada sharing auth lintas sistem.
3. **Publish flow**: EDITOR bisa publish langsung, tanpa approval ADMIN.
4. **Galeri**: flat, tidak pakai album grouping.
