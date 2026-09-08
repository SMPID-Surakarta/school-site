import { z } from 'zod';

const optionalSlug = z
	.string()
	.trim()
	.max(200)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
	.optional()
	.or(z.literal('').transform(() => undefined));

const pageBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	slug: optionalSlug,
	content: z.string().trim().min(1, 'Konten wajib diisi'),
	published: z.boolean().default(false)
};

export const createPageSchema = z.object(pageBase);
export type CreatePageInput = z.infer<typeof createPageSchema>;

export const updatePageSchema = z.object(pageBase);
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
