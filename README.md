# sv

Everything you need to build a Svelte project, powered by [`sv`](https://github.com/sveltejs/cli).

## Creating a project

If you're seeing this, you've probably already done this step. Congrats!

```sh
# create a new project
npx sv create my-app
```

To recreate this project with the same configuration:

```sh
# recreate this project
bun x sv@0.16.2 create --template minimal --types ts --install bun .
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Tema Situs

Administrator dapat mengatur tema melalui **Sistem > Tema & Warna**
(`/admin/settings/theme`). Pilih palet atau warna HEX kustom, pilih font teks,
lalu tekan **Simpan Tema**. Tombol **Tema bawaan** mengembalikan nilai formulir;
tekan **Simpan Tema** untuk menerapkannya. Perubahan berlaku pada situs publik,
sedangkan dashboard tetap memakai tampilan standar.

Konfigurasi disimpan di `settings.theme_config`. Untuk database yang menggunakan
riwayat migrasi Drizzle, jalankan `bun run db:migrate` sebelum menjalankan versi ini.
Migrasi `drizzle/0010_eminent_ozymandias.sql` hanya menambahkan kolom tema dan tidak
mengubah data pengaturan lama. Database lama yang dikelola lewat `db:push` perlu
penyelarasan riwayat migrasi sebelum memakai `db:migrate`.

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
