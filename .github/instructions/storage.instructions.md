---
applyTo: 'src/lib/server/storage/**/*.ts'
---

# Storage & Media (Local Disk)

- Semua upload/delete file WAJIB lewat utility di sini — jangan tulis/hapus file di
  direktori upload langsung dari route handler atau service lain.
- File disimpan di disk lokal pada `UPLOAD_DIR` (env, default `uploads/`, di luar output
  build) dan disajikan lewat route `/uploads/[...path]` — hanya key yang terdaftar di
  tabel `media` yang boleh disajikan (tidak ada directory listing / path traversal).
- Sebelum upload gambar: resize + compress ala Squoosh pakai `sharp` — encode ke WebP
  DAN AVIF, simpan yang lebih kecil. Simpan `width` dan `height` hasil akhir ke tabel
  `media` (dipakai untuk mencegah layout shift/CLS di frontend).
- Setiap file yang diupload harus menghasilkan row baru di tabel `media` dengan `altText`
  wajib diisi (accessibility + SEO image) — kosongkan hanya jika benar-benar tidak ada teks
  alternatif yang bermakna, jangan skip field-nya begitu saja.
- Validasi MIME type dan ukuran file di **server**, bukan hanya di client — whitelist
  eksplisit (jangan blacklist).
- Kolom `media.r2_key` (nama historis) sekarang berisi storage key relatif terhadap
  `UPLOAD_DIR` (mis. `images/<uuid>.webp`) — jangan buat migrasi rename tanpa diskusi.
- Saat sebuah entity yang mereferensikan media dihapus, pastikan service memutuskan dengan
  jelas: hapus juga file di disk + row `media`, atau biarkan (orphan) untuk dibersihkan
  lewat cron terpisah. Jangan biarkan perilaku ini implisit/tidak terdefinisi.
- Saat deployment (`adapter-node`), pastikan `UPLOAD_DIR` berada di volume persisten dan
  ikut di-backup bersama database.
