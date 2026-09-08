/**
 * Migrasi postingan WordPress → tabel `posts` proyek ini.
 *
 * - MENGGANTI semua post lama (hard delete, termasuk sampah), lalu impor dari JSON export.
 * - Foto (featured + dalam konten) diunduh dari situs WP, dikompres ala Squoosh
 *   (WebP vs AVIF, pilih yang terkecil — sama seperti src/lib/server/storage/images.ts),
 *   disimpan ke UPLOAD_DIR + baris `media`, dan URL di konten ditulis ulang ke /uploads/...
 * - Self-contained (tanpa import `$lib`/`$env` yang hanya resolve di Vite), jalankan via:
 *     bun run scripts/import-wordpress.ts [path-ke-json]
 */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';
import sharp from 'sharp';

const DEFAULT_JSON =
	'C:/Users/AHA/Documents/ChatGPT/Migrasi Post wordpress/postingan_wordpress.json';
const jsonPath = process.argv[2] ?? DEFAULT_JSON;

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}
const sql = postgres(dbUrl, { max: 1 });

const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads';
const uploadRoot = path.resolve(UPLOAD_DIR);
/** Video dalam konten hanya diunduh jika di bawah batas ini. */
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

// ── Tipe minimal dari file export ────────────────────────────────────────────
type WpImage = { id: number; url: string; title: string | null; mime_type: string };
type WpPost = {
	id: number;
	status: string;
	slug: string;
	title: string;
	excerpt: string;
	content_html: string;
	date: string;
	date_gmt: string;
	modified: string;
	categories: { name: string; slug: string }[];
	tags: { name: string; slug: string }[];
	featured_image: WpImage | null;
};

// ── Util ─────────────────────────────────────────────────────────────────────
function slugify(value: string): string {
	return value
		.toLowerCase()
		.normalize('NFKD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 200);
}

/** '2020-07-19 14:36:54' → Date; nilai kosong/nol WP → null. */
function parseWpDate(value: string | null | undefined, asUtc: boolean): Date | null {
	if (!value || value.startsWith('0000')) return null;
	const d = new Date(value.replace(' ', 'T') + (asUtc ? 'Z' : ''));
	return Number.isNaN(d.getTime()) ? null : d;
}

function postDates(p: WpPost): { published: Date | null; modified: Date | null } {
	return {
		published: parseWpDate(p.date_gmt, true) ?? parseWpDate(p.date, false),
		modified: parseWpDate(p.modified, false)
	};
}

function htmlToText(html: string): string {
	return html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/gi, ' ')
		.replace(/&amp;/gi, '&')
		.replace(/\s+/g, ' ')
		.trim();
}

function buildExcerpt(html: string, max = 160): string | null {
	const text = htmlToText(html);
	if (!text) return null;
	if (text.length <= max) return text;
	const cut = text.slice(0, max + 1);
	const lastSpace = cut.lastIndexOf(' ');
	return `${cut.slice(0, lastSpace > 40 ? lastSpace : max).trimEnd()}…`;
}

// ── Unduh + simpan media ─────────────────────────────────────────────────────
type StoredImage = { id: string; url: string; width: number; height: number };
const imageCache = new Map<string, StoredImage | null>();

async function fetchBuffer(url: string): Promise<Buffer | null> {
	try {
		const res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
		if (!res.ok) return null;
		return Buffer.from(await res.arrayBuffer());
	} catch {
		return null;
	}
}

/** URL thumbnail WP (…-300x200.jpg) → kandidat URL asli resolusi penuh. */
function originalCandidates(url: string): string[] {
	const full = url.replace(/-\d+x\d+(\.[a-z0-9]+)$/i, '$1');
	return full !== url ? [full, url] : [url];
}

/** Unduh foto WP, kompres (webp/avif pilih terkecil), tulis ke disk + baris media. */
async function importImage(
	sourceUrl: string,
	altText: string,
	uploadedBy: string | null
): Promise<StoredImage | null> {
	if (imageCache.has(sourceUrl)) return imageCache.get(sourceUrl) ?? null;

	const wpFilename = decodeURIComponent(new URL(sourceUrl).pathname.split('/').pop() ?? sourceUrl);

	// Idempoten antar-run: pakai ulang media hasil impor sebelumnya (original_name = nama file WP).
	const [existing] = await sql`
		select id, url, width, height from media where original_name = ${wpFilename} limit 1`;
	if (existing) {
		const reused = existing as unknown as StoredImage;
		imageCache.set(sourceUrl, reused);
		return reused;
	}

	let buffer: Buffer | null = null;
	for (const candidate of originalCandidates(sourceUrl)) {
		buffer = await fetchBuffer(candidate);
		if (buffer) break;
	}
	if (!buffer) {
		console.warn(`  ! gagal mengunduh: ${sourceUrl}`);
		imageCache.set(sourceUrl, null);
		return null;
	}

	// Squoosh-style: WebP q80 vs AVIF q50, simpan yang lebih kecil (paritas dengan images.ts).
	const pipeline = sharp(buffer, { failOn: 'error' })
		.rotate()
		.resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true });
	const [webp, avif] = await Promise.all([
		pipeline.clone().webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
		pipeline.clone().avif({ quality: 50 }).toBuffer({ resolveWithObject: true })
	]);
	const pick = avif.data.byteLength < webp.data.byteLength ? avif : webp;
	const ext = avif.data.byteLength < webp.data.byteLength ? 'avif' : 'webp';

	const key = `images/${randomUUID()}.${ext}`;
	const filePath = path.join(uploadRoot, ...key.split('/'));
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, pick.data);

	const [row] = await sql`
		insert into media (filename, original_name, mime, size, r2_key, url, alt_text, width, height, uploaded_by)
		values (${key.split('/').pop()!}, ${wpFilename}, ${`image/${ext}`}, ${pick.data.byteLength},
			${key}, ${`/uploads/${key}`}, ${altText}, ${pick.info.width}, ${pick.info.height}, ${uploadedBy})
		returning id, url, width, height`;
	const stored = row as unknown as StoredImage;
	imageCache.set(sourceUrl, stored);
	console.log(`  ✓ foto: ${wpFilename} → ${stored.url} (${ext})`);
	return stored;
}

/** Unduh video shortcode [video] apa adanya (tanpa kompresi); null jika gagal/terlalu besar. */
async function importVideo(sourceUrl: string, uploadedBy: string | null): Promise<string | null> {
	const wpFilename = decodeURIComponent(new URL(sourceUrl).pathname.split('/').pop() ?? sourceUrl);
	const [existing] = await sql`select url from media where original_name = ${wpFilename} limit 1`;
	if (existing) return existing.url as string;

	const buffer = await fetchBuffer(sourceUrl);
	if (!buffer || buffer.byteLength > MAX_VIDEO_BYTES) {
		console.warn(`  ! video dilewati (gagal unduh / > 100 MB): ${sourceUrl}`);
		return null;
	}

	const safeName = wpFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
	const key = `files/${randomUUID()}-${safeName}`;
	const filePath = path.join(uploadRoot, ...key.split('/'));
	await mkdir(path.dirname(filePath), { recursive: true });
	await writeFile(filePath, buffer);

	const [row] = await sql`
		insert into media (filename, original_name, mime, size, r2_key, url, alt_text, width, height, uploaded_by)
		values (${safeName}, ${wpFilename}, 'video/mp4', ${buffer.byteLength}, ${key},
			${`/uploads/${key}`}, null, null, null, ${uploadedBy})
		returning url`;
	console.log(`  ✓ video: ${wpFilename} → ${row.url}`);
	return row.url as string;
}

// ── Konversi konten WP → HTML bersih ─────────────────────────────────────────
/** Inline markdown yang diketik manual di WP: **bold** dan *italic*. */
function inlineEmphasis(text: string): string {
	return text
		.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
		.replace(/(^|[\s>(])\*([^*\n]+)\*(?=$|[\s<.,!?:;)])/g, '$1<em>$2</em>');
}

async function convertContent(post: WpPost, uploadedBy: string | null): Promise<string> {
	let content = post.content_html;
	if (!content.trim()) return '';

	// Shortcode [video mp4="…"] → paragraf tautan ke file lokal (sanitizer tidak
	// mengizinkan <video>, jadi tautan adalah bentuk paling aman yang lolos render).
	const videoMatches = [
		...content.matchAll(/\[video[^\]]*mp4="([^"]+)"[^\]]*\](?:\[\/video\])?/gi)
	];
	for (const m of videoMatches) {
		const localUrl = await importVideo(m[1], uploadedBy);
		const replacement = localUrl
			? `<p><a href="${localUrl}" target="_blank" rel="noopener">🎬 Tonton video kegiatan</a></p>`
			: '';
		content = content.replace(m[0], replacement);
	}

	// <img> WP → unduh, lalu tulis ulang jadi tag bersih dengan URL + dimensi lokal.
	const imgMatches = [...content.matchAll(/<img\b[^>]*?src="([^"]+)"[^>]*?\/?>(?:\s*<\/img>)?/gi)];
	for (const m of imgMatches) {
		const stored = await importImage(m[1], post.title, uploadedBy);
		const replacement = stored
			? `<img src="${stored.url}" alt="${post.title.replace(/"/g, '&quot;')}" width="${stored.width}" height="${stored.height}" />`
			: '';
		content = content.replace(m[0], replacement);
	}

	// wpautop: baris kosong = paragraf baru, newline tunggal = <br>. Blok yang murni
	// berisi <img> dibiarkan tanpa pembungkus <p> agar tampil sebagai figure mandiri.
	const blocks = content
		.split(/\n\s*\n/)
		.map((b) => b.trim())
		.filter(Boolean);
	return blocks
		.map((block) => {
			const withEmphasis = inlineEmphasis(block);
			if (/^(?:<img\b[^>]*\/?>\s*)+$/i.test(block)) return withEmphasis;
			if (/^<(p|h[2-4]|ul|ol|blockquote|table|figure)\b/i.test(block)) return withEmphasis;
			return `<p>${withEmphasis.replace(/\n/g, '<br />')}</p>`;
		})
		.join('\n');
}

// ── Kategori & tag ───────────────────────────────────────────────────────────
const categoryCache = new Map<string, string>();

async function resolveCategoryId(post: WpPost): Promise<string | null> {
	const cat = post.categories.find((c) => c.slug !== 'uncategorized');
	if (!cat) return null;
	const cached = categoryCache.get(cat.slug);
	if (cached) return cached;
	const [row] = await sql`
		insert into categories (name, slug) values (${cat.name}, ${cat.slug})
		on conflict (slug) do update set name = excluded.name
		returning id`;
	categoryCache.set(cat.slug, row.id as string);
	return row.id as string;
}

async function resolveTagIds(post: WpPost): Promise<string[]> {
	const ids: string[] = [];
	for (const tag of post.tags) {
		const slug = tag.slug || slugify(tag.name);
		if (!slug) continue;
		const [row] = await sql`
			insert into tags (name, slug) values (${tag.name}, ${slug})
			on conflict (slug) do update set name = excluded.name
			returning id`;
		ids.push(row.id as string);
	}
	return ids;
}

// ── Main ─────────────────────────────────────────────────────────────────────
try {
	const raw = await readFile(jsonPath, 'utf8');
	const data = JSON.parse(raw) as { posts: WpPost[] };
	const wpPosts = data.posts.filter((p) => p.title.trim());
	console.log(`Sumber: ${jsonPath} (${wpPosts.length} post)`);

	const [admin] = await sql`select id from users where role = 'ADMIN' limit 1`;
	const authorId: string | null = admin?.id ?? null;

	// GANTI TOTAL: hapus semua post lama (post_tags ikut lewat FK cascade).
	const removed = await sql`delete from posts returning id`;
	console.log(`✓ ${removed.length} post lama dihapus`);

	const usedSlugs = new Set<string>();
	let imported = 0;

	for (const post of wpPosts) {
		console.log(`\n[${post.id}] ${post.title}`);

		let slug = post.slug || slugify(post.title) || `post-${post.id}`;
		let n = 2;
		while (usedSlugs.has(slug)) slug = `${post.slug || slugify(post.title)}-${n++}`;
		usedSlugs.add(slug);

		const content = await convertContent(post, authorId);
		const excerpt = post.excerpt.trim() ? htmlToText(post.excerpt) : buildExcerpt(content);

		const featured = post.featured_image
			? await importImage(
					post.featured_image.url,
					post.featured_image.title?.trim() || post.title,
					authorId
				)
			: null;

		const categoryId = await resolveCategoryId(post);
		const tagIds = await resolveTagIds(post);

		const status = post.status === 'publish' ? 'PUBLISHED' : 'DRAFT';
		const { published, modified } = postDates(post);
		const createdAt = published ?? modified ?? new Date();

		const [inserted] = await sql`
			insert into posts (title, slug, content, excerpt, thumbnail_media_id, author_id,
				category_id, status, published_at, created_at, updated_at)
			values (${post.title}, ${slug}, ${content}, ${excerpt}, ${featured?.id ?? null},
				${authorId}, ${categoryId}, ${status},
				${status === 'PUBLISHED' ? createdAt : null}, ${createdAt}, ${modified ?? createdAt})
			returning id`;

		for (const tagId of tagIds) {
			await sql`insert into post_tags (post_id, tag_id) values (${inserted.id}, ${tagId})
				on conflict do nothing`;
		}

		imported += 1;
		console.log(`  ✓ ${status} /berita/${slug}`);
	}

	console.log(`\nSelesai: ${imported} post diimpor.`);
} finally {
	await sql.end();
}
