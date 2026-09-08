---
applyTo: 'src/lib/server/validators/**/*.ts,src/routes/**/*.svelte'
---

# Forms & Validation

- Semua input dari user (form maupun query param) divalidasi dengan Zod schema di
  `src/lib/server/validators/`. Satu schema per entity, reuse antara client dan server kalau
  memungkinkan (jangan duplikasi rule validasi).
- Semua form pakai `sveltekit-superforms` — jangan tulis handling form manual
  (`FormData` parsing manual, `bind:value` tanpa superforms) untuk form baru.
- Komponen Svelte baru: gunakan **Svelte 5 runes** (`$state`, `$derived`, `$props`,
  `$effect`). Jangan gunakan `export let` untuk props atau `$:` reactive statement — itu
  syntax Svelte 4.
- Styling: Tailwind CSS + Skeleton UI utility classes. Hindari custom CSS kecuali benar-benar
  tidak bisa dicapai dengan utility classes.
- Form upload file → lihat `storage.instructions.md` untuk alur upload media, jangan submit
  file mentah tanpa lewat storage utility.
