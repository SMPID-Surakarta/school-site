---
applyTo: 'src/routes/(admin)/**'
---

# Admin Dashboard Routes

Konteks lengkap: PRD §5 (routing) dan §6 (matriks RBAC).

- Setiap route admin baru harus dicek terhadap matriks RBAC di PRD §6 sebelum
  diimplementasikan. Role: `ADMIN`, `EDITOR`, `STAFF`.
- Proteksi role dilakukan di **server** (`+page.server.ts` `load`/`actions`, atau hooks) —
  jangan hanya sembunyikan menu/tombol di client. Client-side hiding boleh sebagai UX
  tambahan, bukan pengganti.
- Keputusan yang sudah final (jangan tanya ulang / jangan tambahkan approval flow):
  - EDITOR boleh publish post langsung, **tanpa approval ADMIN**.
  - `/admin/users` (manajemen akun) hanya bisa diakses ADMIN.
  - `/admin/contacts` bisa diakses ADMIN dan EDITOR (read/reply).
- CRUD content (Berita, Guru, Prestasi, Galeri, Agenda, Download, FAQ, Pages) untuk role
  STAFF adalah **read-only** — jangan expose form create/edit/delete untuk STAFF di route
  ini.
- Semua write action (create/update/delete) lewat form actions + superforms + service layer,
  bukan langsung manipulasi DB dari komponen.
- Delete pada tabel dengan soft delete (`posts`, `achievements`, `galleries`, `banners`)
  harus soft-delete (set `deletedAt`), bukan `DELETE` permanen dari UI biasa — hard delete
  hanya lewat halaman trash/permanen yang eksplisit kalau ada.
