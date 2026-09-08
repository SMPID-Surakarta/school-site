---
applyTo: 'src/lib/db/**/*.ts'
---

# DB Schema — Drizzle ORM

Konteks lengkap: lihat `PRD-Website-Sekolah-SvelteKit-v2.md` §4.

## Konvensi wajib

- Satu file per domain: `users.ts`, `posts.ts`, `media.ts`, `teachers.ts`, dst. Jangan
  gabungkan semua tabel di satu file besar.
- Primary key selalu `uuid` dengan `defaultRandom()` — jangan pakai `serial`/auto-increment.
  Ini keputusan keamanan (ID tidak boleh bisa ditebak/enumerate lewat public API).
- Tabel konten (`posts`, `achievements`, `galleries`, `banners`) wajib punya kolom
  `deletedAt: timestamp("deleted_at")` (nullable) untuk soft delete.
- Field gambar/file (`thumbnail`, `photo`, `image`, dll) adalah **foreign key ke `media.id`**,
  bukan kolom string URL bebas. Nama kolom: `xxxMediaId`.
- `posts` punya kolom `searchVector` (tsvector, generated) untuk full-text search — buat
  dengan raw SQL migration (`sql` custom type), bukan lewat Drizzle schema builder biasa.
- Auth.js butuh tabel `sessions`, `accounts`, `verificationTokens` — generate skema ini
  persis sesuai kontrak `@auth/drizzle-adapter`, jangan tulis manual dari nol atau ubah nama
  kolomnya.
- `settings` adalah tabel single-row config. Jangan buat query yang mengasumsikan banyak
  rows; kalau perlu, tegakkan lewat check constraint atau selalu query `WHERE id = 1`.
- `galleries` **flat** — tidak ada `album_id`/`gallery_albums`. Jangan tambahkan grouping
  tanpa diminta eksplisit.
- Many-to-many `posts` ↔ `tags` lewat tabel junction `post_tags` (composite PK
  `post_id, tag_id`), bukan array kolom.

## Setelah ubah schema

Selalu jalankan `drizzle-kit generate` untuk membuat file migrasi — jangan edit tabel
production secara manual atau lewat query mentah di luar migration.
