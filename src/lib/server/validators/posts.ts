import { z } from 'zod';
import type { PostStatus } from '$lib/db/schema';

const statusValues = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const satisfies readonly PostStatus[];

/** Optional slug: empty string is coerced to undefined so the service can auto-generate it. */
const optionalSlug = z
	.string()
	.trim()
	.max(200)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
	.optional()
	.or(z.literal('').transform(() => undefined));

/** Quill emits `<p><br></p>` for an empty document; require real text or embedded media. */
function hasRealContent(html: string): boolean {
	if (/<(img|iframe|video)\b/i.test(html)) return true;
	return (
		html
			.replace(/<[^>]*>/g, ' ')
			.replace(/&nbsp;/gi, ' ')
			.trim().length > 0
	);
}

const postBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	slug: optionalSlug,
	content: z
		.string()
		.trim()
		.min(1, 'Konten wajib diisi')
		.refine(hasRealContent, 'Konten wajib diisi'),
	// Ringkasan manual; jika kosong, service akan generate otomatis dari konten.
	excerpt: z
		.string()
		.trim()
		.max(300, 'Ringkasan maksimal 300 karakter')
		.optional()
		.or(z.literal('')),
	categoryId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	status: z.enum(statusValues).default('DRAFT'),
	// Disematkan di homepage untuk pengumuman penting.
	isPinned: z.boolean().default(false),
	// Tanggal tayang manual (format datetime-local); kosong = otomatis saat publish.
	publishedAt: z
		.string()
		.trim()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	// Comma-separated tag names, normalized to slugs in the service layer.
	tags: z.string().trim().max(500).default(''),
	seoTitle: z.string().trim().max(200).optional().or(z.literal('')),
	seoDescription: z.string().trim().max(300).optional().or(z.literal('')),
	seoKeywords: z.string().trim().max(300).optional().or(z.literal('')),
	thumbnailMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined))
};

export const createPostSchema = z.object(postBase);
export type CreatePostInput = z.infer<typeof createPostSchema>;

export const updatePostSchema = z.object(postBase);
export type UpdatePostInput = z.infer<typeof updatePostSchema>;

/** Admin list filters (from URL query params). `TRASH` is the soft-deleted (trash) view. */
export const postListQuerySchema = z.object({
	page: z.coerce.number().int().min(1).default(1),
	q: z.string().trim().max(200).optional().default(''),
	status: z
		.enum([...statusValues, 'TRASH'] as const)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	categoryId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined))
});
export type PostListQuery = z.infer<typeof postListQuerySchema>;
