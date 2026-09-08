/**
 * Seed dummy content for the public front page (SMK Muhammadiyah 1 Boyolali).
 *
 * Self-contained (does not import `$lib`/`$env`, which only resolve inside Vite) so it can
 * run via `bun run scripts/seed-dummy.ts`. Bun auto-loads `.env`.
 *
 * Idempotent per table: settings is upserted; content tables are only filled when empty.
 */
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(url, { max: 1 });

const DAY = 24 * 60 * 60 * 1000;
const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * DAY);
const daysAhead = (n: number) => new Date(now.getTime() + n * DAY);

try {
	// ── Settings (single row, id = 1) ─────────────────────────────────────────
	await sql`
		insert into settings (id, school_name, tagline, description, address, phone, email, social_media)
		values (
			1,
			'SMK Muhammadiyah 1 Boyolali',
			'Terampil, Mandiri, Berakhlak Mulia',
			'SMK Muhammadiyah 1 Boyolali adalah sekolah menengah kejuruan yang mencetak lulusan siap kerja, siap berwirausaha, dan siap melanjutkan pendidikan — dengan program keahlian teknik dan bisnis yang terhubung langsung dengan dunia industri.',
			'Jl. Perintis Kemerdekaan, Pulisen, Kec. Boyolali, Kab. Boyolali, Jawa Tengah 57316',
			'(0276) 321 456',
			'info@smkmuh1boyolali.sch.id',
			${sql.json({
				instagram: 'https://instagram.com/smkmuh1boyolali',
				youtube: 'https://youtube.com/@smkmuh1boyolali',
				facebook: 'https://facebook.com/smkmuh1boyolali',
				tiktok: 'https://tiktok.com/@smkmuh1boyolali'
			})}
		)
		on conflict (id) do update set
			school_name = excluded.school_name,
			tagline = excluded.tagline,
			description = excluded.description,
			address = excluded.address,
			phone = excluded.phone,
			email = excluded.email,
			social_media = excluded.social_media`;
	console.log('✓ Settings: SMK Muhammadiyah 1 Boyolali');

	// ── Author untuk posts (admin pertama, boleh null) ────────────────────────
	const [admin] = await sql`select id from users where role = 'ADMIN' limit 1`;
	const authorId: string | null = admin?.id ?? null;

	// ── Categories ────────────────────────────────────────────────────────────
	const [{ count: categoryCount }] = await sql`select count(*)::int as count from categories`;
	if (categoryCount === 0) {
		await sql`
			insert into categories (name, slug) values
			('Kegiatan Sekolah', 'kegiatan-sekolah'),
			('Pengumuman', 'pengumuman'),
			('Kerja Sama Industri', 'kerja-sama-industri')`;
		console.log('✓ Categories (3)');
	} else {
		console.log(`- Categories sudah terisi (${categoryCount}), dilewati`);
	}
	const categories =
		await sql`select id, slug from categories where slug in ('kegiatan-sekolah', 'pengumuman', 'kerja-sama-industri')`;
	const catId = (slug: string) => categories.find((c) => c.slug === slug)?.id ?? null;

	// ── Posts (berita) ────────────────────────────────────────────────────────
	const [{ count: postCount }] = await sql`
		select count(*)::int as count from posts
		where status = 'PUBLISHED' and deleted_at is null`;
	if (postCount === 0) {
		const posts = [
			{
				title: 'PPDB Tahun Ajaran 2026/2027 Resmi Dibuka',
				slug: 'ppdb-2026-2027-resmi-dibuka',
				category: 'pengumuman',
				publishedAt: daysAgo(2),
				content: `Penerimaan Peserta Didik Baru (PPDB) SMK Muhammadiyah 1 Boyolali tahun ajaran 2026/2027 resmi dibuka. Pendaftaran dapat dilakukan secara daring maupun langsung di kampus sekolah.\n\nTersedia beberapa program keahlian unggulan: Teknik Komputer dan Jaringan (TKJ), Rekayasa Perangkat Lunak (RPL), Teknik Kendaraan Ringan (TKR), Teknik dan Bisnis Sepeda Motor (TBSM), serta Akuntansi dan Keuangan Lembaga (AKL).\n\nGelombang pertama dibuka hingga akhir bulan dengan kuota terbatas. Calon peserta didik dianjurkan mendaftar lebih awal untuk mendapatkan potongan biaya pendaftaran.`
			},
			{
				title: 'Siswa TKJ Raih Juara 1 LKS Tingkat Kabupaten',
				slug: 'siswa-tkj-juara-1-lks-kabupaten',
				category: 'kegiatan-sekolah',
				publishedAt: daysAgo(5),
				content: `Tim Teknik Komputer dan Jaringan (TKJ) SMK Muhammadiyah 1 Boyolali berhasil meraih Juara 1 Lomba Kompetensi Siswa (LKS) bidang IT Network Systems Administration tingkat Kabupaten Boyolali.\n\nPrestasi ini mengantarkan perwakilan sekolah melaju ke tingkat Provinsi Jawa Tengah. Pembinaan intensif dilakukan bersama guru produktif dan mitra industri sekolah.`
			},
			{
				title: 'Kunjungan Industri ke PT Astra Honda Motor',
				slug: 'kunjungan-industri-astra-honda-motor',
				category: 'kerja-sama-industri',
				publishedAt: daysAgo(9),
				content: `Sebanyak 120 siswa kelas XI program keahlian TKR dan TBSM mengikuti kunjungan industri ke PT Astra Honda Motor. Kegiatan ini bertujuan mengenalkan proses manufaktur dan budaya kerja industri otomotif secara langsung.\n\nSiswa mendapatkan materi tentang standar keselamatan kerja, proses perakitan, serta peluang karier di industri otomotif nasional.`
			},
			{
				title: 'Workshop Digital Marketing untuk Siswa AKL',
				slug: 'workshop-digital-marketing-akl',
				category: 'kegiatan-sekolah',
				publishedAt: daysAgo(14),
				content: `Program keahlian Akuntansi dan Keuangan Lembaga (AKL) menggelar workshop digital marketing bekerja sama dengan pelaku UMKM Boyolali. Siswa belajar mengelola toko daring, membuat konten promosi, dan menyusun laporan keuangan usaha digital.\n\nWorkshop ini merupakan bagian dari penguatan jiwa kewirausahaan siswa SMK.`
			},
			{
				title: 'Penandatanganan MoU Kelas Industri dengan Mitra Baru',
				slug: 'mou-kelas-industri-mitra-baru',
				category: 'kerja-sama-industri',
				publishedAt: daysAgo(20),
				content: `SMK Muhammadiyah 1 Boyolali menandatangani nota kesepahaman (MoU) kelas industri dengan dua mitra baru di bidang teknologi informasi dan otomotif. Kerja sama meliputi sinkronisasi kurikulum, guru tamu dari industri, magang siswa, dan rekrutmen lulusan.\n\nDengan tambahan ini, sekolah kini memiliki 12 mitra industri aktif yang mendukung pembelajaran berbasis dunia kerja.`
			},
			{
				title: 'Pelepasan Kelas XII: 87% Lulusan Langsung Terserap',
				slug: 'pelepasan-kelas-xii-lulusan-terserap',
				category: 'kegiatan-sekolah',
				publishedAt: daysAgo(30),
				content: `Upacara pelepasan siswa kelas XII berlangsung khidmat di aula sekolah. Tahun ini, 87% lulusan telah terserap bekerja, berwirausaha, atau melanjutkan ke perguruan tinggi sebelum pengumuman kelulusan.\n\nKepala sekolah menyampaikan apresiasi kepada seluruh guru, orang tua, dan mitra industri yang telah mendampingi proses belajar siswa.`
			}
		];
		for (const p of posts) {
			await sql`
				insert into posts (title, slug, content, author_id, category_id, status, published_at)
				values (${p.title}, ${p.slug}, ${p.content}, ${authorId}, ${catId(p.category)}, 'PUBLISHED', ${p.publishedAt})`;
		}
		console.log(`✓ Posts (${posts.length})`);
	} else {
		console.log(`- Posts sudah terisi (${postCount}), dilewati`);
	}

	// ── Achievements (prestasi) ───────────────────────────────────────────────
	const [{ count: achievementCount }] = await sql`select count(*)::int as count from achievements`;
	if (achievementCount === 0) {
		const achievements = [
			{
				title: 'Juara 1 LKS IT Network Systems Administration',
				description: 'Lomba Kompetensi Siswa tingkat Kabupaten Boyolali.',
				date: daysAgo(6),
				level: 'kota'
			},
			{
				title: 'Juara 2 LKS Web Technologies',
				description: 'Lomba Kompetensi Siswa tingkat Provinsi Jawa Tengah.',
				date: daysAgo(45),
				level: 'provinsi'
			},
			{
				title: 'Juara 1 Musabaqah Tilawatil Quran Pelajar',
				description: 'MTQ Pelajar se-Kabupaten Boyolali.',
				date: daysAgo(60),
				level: 'kota'
			},
			{
				title: 'Juara 3 Kontes Robot Line Follower',
				description: 'Kompetisi robotika antar-SMK tingkat nasional.',
				date: daysAgo(90),
				level: 'nasional'
			},
			{
				title: 'Juara 1 Futsal Piala Pelajar Muhammadiyah',
				description: 'Turnamen olahraga pelajar Muhammadiyah se-Jawa Tengah.',
				date: daysAgo(120),
				level: 'provinsi'
			},
			{
				title: 'Sekolah Adiwiyata Tingkat Kabupaten',
				description: 'Penghargaan sekolah peduli dan berbudaya lingkungan.',
				date: daysAgo(150),
				level: 'kota'
			}
		];
		for (const a of achievements) {
			await sql`
				insert into achievements (title, description, date, level)
				values (${a.title}, ${a.description}, ${a.date}, ${a.level})`;
		}
		console.log(`✓ Achievements (${achievements.length})`);
	} else {
		console.log(`- Achievements sudah terisi (${achievementCount}), dilewati`);
	}

	// ── Agendas (kegiatan mendatang) ──────────────────────────────────────────
	const [{ count: agendaCount }] = await sql`select count(*)::int as count from agendas`;
	if (agendaCount === 0) {
		const agendas = [
			{
				title: 'Tes Seleksi PPDB Gelombang 1',
				description: 'Tes potensi akademik dan wawancara calon peserta didik baru.',
				start: daysAhead(7),
				location: 'Kampus SMK Muhammadiyah 1 Boyolali'
			},
			{
				title: 'Ujian Sertifikasi Kompetensi TKJ & RPL',
				description: 'Uji kompetensi keahlian bersama LSP dan mitra industri.',
				start: daysAhead(14),
				location: 'Laboratorium Komputer'
			},
			{
				title: 'Pengajian Akbar & Halal Bihalal Keluarga Besar Sekolah',
				description: 'Bersama guru, karyawan, komite, dan wali murid.',
				start: daysAhead(21),
				location: 'Aula Sekolah'
			},
			{
				title: 'Job Fair Mini: Rekrutmen Lulusan oleh Mitra Industri',
				description: 'Diikuti 12 perusahaan mitra kelas industri.',
				start: daysAhead(30),
				location: 'Aula Sekolah'
			},
			{
				title: 'Masa Pengenalan Lingkungan Sekolah (MPLS)',
				description: 'Orientasi peserta didik baru tahun ajaran 2026/2027.',
				start: daysAhead(45),
				location: 'Kampus SMK Muhammadiyah 1 Boyolali'
			}
		];
		for (const a of agendas) {
			await sql`
				insert into agendas (title, description, start_date, location)
				values (${a.title}, ${a.description}, ${a.start}, ${a.location})`;
		}
		console.log(`✓ Agendas (${agendas.length})`);
	} else {
		console.log(`- Agendas sudah terisi (${agendaCount}), dilewati`);
	}

	// ── Teachers (guru & tendik, untuk angka kunci hero) ──────────────────────
	const [{ count: teacherCount }] = await sql`select count(*)::int as count from teachers`;
	if (teacherCount === 0) {
		const teachers = [
			['Drs. H. Ahmad Fauzi, M.Pd.', 'ahmad-fauzi', 'Kepala Sekolah', 'Manajemen'],
			['Siti Nurhaliza, S.Pd.', 'siti-nurhaliza', 'Waka Kurikulum', 'Matematika'],
			['Budi Santoso, S.Kom.', 'budi-santoso', 'Kaprodi TKJ', 'Administrasi Jaringan'],
			['Rina Wulandari, S.Kom.', 'rina-wulandari', 'Kaprodi RPL', 'Pemrograman Web'],
			['Joko Prasetyo, S.T.', 'joko-prasetyo', 'Kaprodi TKR', 'Pemeliharaan Mesin'],
			['Agus Setiawan, S.T.', 'agus-setiawan', 'Kaprodi TBSM', 'Teknik Sepeda Motor'],
			['Dewi Kartika, S.E.', 'dewi-kartika', 'Kaprodi AKL', 'Akuntansi Dasar'],
			['Muhammad Ridwan, S.Pd.I.', 'muhammad-ridwan', 'Guru', 'Pendidikan Agama Islam'],
			['Sri Lestari, S.Pd.', 'sri-lestari', 'Guru', 'Bahasa Indonesia'],
			['Eko Nugroho, S.Pd.', 'eko-nugroho', 'Guru', 'Bahasa Inggris'],
			['Fitri Handayani, S.Pd.', 'fitri-handayani', 'Guru BK', 'Bimbingan Konseling'],
			['Wahyu Hidayat, A.Md.', 'wahyu-hidayat', 'Staf Tata Usaha', null]
		] as const;
		for (const [name, slug, position, subject] of teachers) {
			await sql`
				insert into teachers (name, slug, position, subject, is_active)
				values (${name}, ${slug}, ${position}, ${subject}, true)`;
		}
		console.log(`✓ Teachers (${teachers.length})`);
	} else {
		console.log(`- Teachers sudah terisi (${teacherCount}), dilewati`);
	}

	// ── Banner hero ───────────────────────────────────────────────────────────
	const [{ count: bannerCount }] = await sql`select count(*)::int as count from banners`;
	if (bannerCount === 0) {
		await sql`
			insert into banners (title, subtitle, button_text, button_url, "order", published)
			values (
				'Penerimaan Peserta Didik Baru 2026/2027',
				'Lima program keahlian siap kerja, kelas industri bersama 12 mitra, dan lingkungan belajar Islami. Gelombang 1 dibuka — kuota terbatas.',
				'Daftar PPDB Sekarang',
				'/ppdb',
				0,
				true
			)`;
		console.log('✓ Banner PPDB (1)');
	} else {
		console.log(`- Banners sudah terisi (${bannerCount}), dilewati`);
	}

	// ── Halaman /ppdb (tujuan CTA) ────────────────────────────────────────────
	const [{ count: ppdbCount }] =
		await sql`select count(*)::int as count from pages where slug = 'ppdb'`;
	if (ppdbCount === 0) {
		await sql`
			insert into pages (title, slug, content, published)
			values (
				'PPDB 2026/2027',
				'ppdb',
				${'Penerimaan Peserta Didik Baru SMK Muhammadiyah 1 Boyolali tahun ajaran 2026/2027.\n\nProgram keahlian: Teknik Komputer dan Jaringan (TKJ), Rekayasa Perangkat Lunak (RPL), Teknik Kendaraan Ringan (TKR), Teknik dan Bisnis Sepeda Motor (TBSM), Akuntansi dan Keuangan Lembaga (AKL).\n\nSyarat pendaftaran: fotokopi ijazah/SKL, fotokopi KK dan akta kelahiran, pas foto 3x4 (3 lembar).\n\nInformasi lebih lanjut hubungi panitia PPDB di (0276) 321 456 atau datang langsung ke kampus sekolah.'},
				true
			)`;
		console.log('✓ Halaman /ppdb (1)');
	} else {
		console.log('- Halaman /ppdb sudah ada, dilewati');
	}

	console.log('Selesai.');
} catch (e) {
	console.error('Seed failed:', e instanceof Error ? e.message : e);
	process.exitCode = 1;
} finally {
	await sql.end({ timeout: 1 });
}
