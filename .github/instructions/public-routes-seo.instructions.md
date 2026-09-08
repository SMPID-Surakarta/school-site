---
applyTo: 'src/routes/(public)/**,src/lib/seo/**'
---

# Public Site & SEO

Konteks lengkap: PRD §5, §8 (SEO), §10 (performance).

- SSR untuk halaman dinamis (`/berita/[slug]`, `/search`, dll), prerender untuk halaman
  statis (`/profil/*`, `/faq`, dll) — set lewat `export const prerender` sesuai kebutuhan
  masing-masing route.
- Setiap halaman publik menyertakan meta SEO (title, description, canonical, Open Graph,
  Twitter Card, JSON-LD terkait) lewat helper di `src/lib/seo/`. Jangan hardcode `<svelte:head>`
  meta tags per halaman tanpa lewat helper ini.
- `/search` menggunakan Postgres full-text search lewat kolom `search_vector` (tsvector) di
  tabel `posts` — jangan implementasi search dengan `LIKE '%query%'`.
- `/galeri` **flat**, tidak dikelompokkan per album — jangan tambahkan route
  `/galeri/[album]` tanpa perubahan skema yang eksplisit diminta.
- Gambar dari `media` (dengan `width`/`height`/`altText` yang sudah tersimpan) harus render
  dengan `width`/`height` eksplisit dan lazy loading, untuk menjaga skor Lighthouse
  Performance/Accessibility sesuai target di PRD §8.
- Sitemap (`sitemap.xml`), `robots.txt`, dan RSS feed digenerate dari data yang sama dengan
  query publik (status `PUBLISHED`, `deletedAt IS NULL`) — jangan buat sumber data terpisah
  yang bisa out-of-sync.
