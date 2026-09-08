# GitHub Copilot Instructions — Website Sekolah CMS

> File ini dibaca otomatis oleh GitHub Copilot Chat di VS Code sebagai custom instructions
> untuk repo ini. Simpan di `.github/copilot-instructions.md` (path ini wajib, jangan diganti).

## Project Summary

SvelteKit CMS untuk website sekolah. Dua area: **Public Site** (SSR, SEO-heavy) dan
**Admin Dashboard** (protected, CRUD-heavy). Full spec ada di
`PRD-Website-Sekolah-SvelteKit-v2.md` di root repo — baca file itu untuk konteks skema
database dan RBAC sebelum membuat fitur baru.

## Tech Stack (jangan ganti tanpa diskusi)

- SvelteKit 2 + **Svelte 5** (gunakan runes: `$state`, `$derived`, `$effect` — JANGAN
  gunakan syntax Svelte 4 seperti `export let` untuk props baru, `$:` reactive statements,
  atau stores untuk local component state).
- TypeScript strict mode — never use `any`. Prefer `unknown` + narrowing atau generic types.
- Tailwind CSS + Skeleton UI untuk semua styling. Jangan tulis CSS custom kecuali benar-benar
  tidak bisa dengan utility classes.
- PostgreSQL + Drizzle ORM + drizzle-kit untuk migrasi.
- `@auth/sveltekit` (Auth.js) untuk authentication, dengan Drizzle adapter.
- Zod untuk semua validasi input, `sveltekit-superforms` untuk semua form (server + client).
- Cloudflare R2 sudah DIHAPUS — file storage pakai **disk lokal** (`UPLOAD_DIR`, default
  `uploads/`) lewat utility `src/lib/server/storage/`, dengan `sharp` untuk kompresi ala
  Squoosh (WebP dan AVIF, simpan yang lebih kecil) sebelum disimpan.
- Vitest untuk unit test (services & repositories), Playwright untuk e2e.

## Architecture Rules (wajib diikuti)

1. **Repository Pattern**: semua query database HARUS lewat `src/lib/server/repositories/`.
   Jangan pernah panggil Drizzle langsung dari route file (`+page.server.ts`, `+server.ts`)
   atau dari service layer tanpa lewat repository.
2. **Service Layer**: business logic (validasi lintas-entitas, orchestration, permission
   check) ada di `src/lib/server/services/`. Route handlers hanya memanggil service, tidak
   memuat logic sendiri.
3. **Error handling**: service functions melempar custom `AppError` (bukan generic `Error`)
   atau mengembalikan `Result<T, AppError>` — ikuti pola yang sudah ada di codebase, jangan
   perkenalkan pola baru tanpa alasan.
4. **Validasi**: semua input dari user (form maupun query param) divalidasi dengan Zod schema
   di `src/lib/server/validators/`. Reuse schema yang sama antara client (superforms) dan
   server jika memungkinkan.
5. **Media**: field gambar/file di skema (`*_media_id`) adalah FK ke tabel `media`, bukan
   string URL bebas. Saat generate kode upload, selalu isi `alt_text`, `width`, `height`.
6. **Soft delete**: tabel konten (`posts`, `achievements`, `galleries`, `banners`) pakai
   `deleted_at`. Query list HARUS filter `deleted_at IS NULL` kecuali eksplisit diminta
   include-deleted (mis. halaman trash admin).
7. **RBAC**: cek role (`ADMIN` / `EDITOR` / `STAFF`) di server-side (hooks atau service),
   jangan hanya sembunyikan UI di client. Rujuk matriks RBAC di PRD §6 sebelum menambah
   endpoint admin baru.

## Folder Structure

```
src/
├── lib/
│   ├── auth/
│   ├── db/schema/        # satu file per domain: users.ts, posts.ts, media.ts, dst.
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
├── unit/
└── e2e/
```

Saat generate file baru, taruh di folder yang sesuai konvensi ini. Jangan buat folder baru
di root `src/lib/` tanpa alasan kuat.

## Coding Style

- ESLint + Prettier — jalankan `pnpm lint` sebelum menganggap task selesai.
- Conventional Commits untuk pesan commit: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`,
  `docs:`.
- Env vars diakses lewat `$env/static/private` atau `$env/dynamic/private` — jangan pernah
  `process.env` langsung, dan jangan hardcode secret.
- Nama file/route mengikuti pola SvelteKit standar (`+page.svelte`, `+page.server.ts`,
  `+server.ts`, `+layout.ts`).

## What NOT to do

- Jangan pakai `any` atau `@ts-ignore` untuk menghindari type error — perbaiki tipenya.
- Jangan query Drizzle langsung dari komponen `.svelte` atau dari route handler.
- Jangan buat tabel/kolom baru di schema tanpa migrasi Drizzle (`drizzle-kit generate`).
- Jangan tulis form tanpa superforms + Zod schema.
- Jangan simpan file upload tanpa lewat `src/lib/server/storage/` utility (kompresi +
  disk lokal).
- Jangan asumsikan single-tenant kalau menyentuh `settings` — tabel itu single-row by design,
  jangan buat query yang mengasumsikan banyak rows.

## Testing Expectations

- Setiap service function baru → unit test di `tests/unit/` (Vitest), mock repository layer.
- Setiap flow CRUD admin baru → minimal satu e2e test di `tests/e2e/` (Playwright): create,
  read/list, update, soft-delete.
- Jangan submit perubahan pada auth/session logic tanpa test yang menutupi happy path dan
  unauthorized-access path.

## When Unsure

Kalau requirement tidak jelas dari PRD atau kode yang sudah ada, tanyakan lewat komentar/PR
description daripada menebak. Beberapa keputusan sudah final (jangan tanya ulang, lihat PRD
§12): deployment pakai `adapter-node`, tidak ada modul lain yang perlu di-share auth-nya,
EDITOR bisa publish tanpa approval, dan galeri tetap flat (tanpa album).
