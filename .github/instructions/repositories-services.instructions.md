---
applyTo: 'src/lib/server/repositories/**/*.ts,src/lib/server/services/**/*.ts'
---

# Repository & Service Layer

## Repository (`src/lib/server/repositories/`)

- Satu-satunya tempat yang boleh memanggil Drizzle query builder langsung.
- Fungsi repository murni CRUD/query — tanpa business logic, tanpa permission check.
- Query list untuk tabel dengan soft delete WAJIB filter `deletedAt IS NULL` secara default;
  buat parameter eksplisit (mis. `includeDeleted?: boolean`) kalau butuh kecualian (halaman
  trash admin).
- Satu file per domain, mirror dari `src/lib/db/schema/` (mis. `posts.repository.ts`,
  `media.repository.ts`).

## Service (`src/lib/server/services/`)

- Semua business logic ada di sini: validasi lintas-entitas, permission/RBAC check,
  orchestration antar repository (mis. hapus post → hapus media terkait).
- Rujuk matriks RBAC di PRD §6 sebelum menulis service admin baru. Cek role di server-side
  service, JANGAN hanya di UI/client.
- Error handling: lempar custom `AppError` (dengan `code`/`status` yang jelas) — jangan
  generic `throw new Error(...)`. Ikuti pola error class yang sudah ada di codebase.
- Service TIDAK memanggil Drizzle langsung — selalu lewat repository.
- Route handlers (`+page.server.ts`, `+server.ts`) hanya memanggil service, tidak memuat
  logic sendiri di dalamnya.

## Testing

Setiap service function baru → unit test Vitest di `tests/unit/`, dengan repository
di-mock (jangan hit database asli di unit test).
