---
applyTo: 'tests/**'
---

# Testing

- `tests/unit/` — Vitest. Target: service dan repository functions. Mock repository layer
  saat testing service (jangan hit database asli).
- `tests/e2e/` — Playwright. Setiap flow CRUD admin baru minimal punya satu e2e test:
  create → read/list → update → soft-delete.
- Test wajib untuk auth/session logic: happy path (login sukses, session valid) DAN
  unauthorized-access path (role salah ditolak, session expired ditolak).
- Test RBAC: untuk setiap route admin, pastikan ada test yang membuktikan role yang tidak
  berwenang (mis. STAFF mencoba create/update/delete) ditolak di level server, bukan cuma
  UI-nya disembunyikan.
- Jangan anggap task selesai sebelum `pnpm lint` dan test terkait lulus.
