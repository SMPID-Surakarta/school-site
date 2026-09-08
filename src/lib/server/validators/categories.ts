import { z } from 'zod';

/** Optional slug: empty string is coerced to undefined so the service can auto-generate it. */
const optionalSlug = z
	.string()
	.trim()
	.max(100)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
	.optional()
	.or(z.literal('').transform(() => undefined));

/** Create/rename a category (Blogger-style label). `id` empty = create, filled = rename. */
export const categorySchema = z.object({
	id: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	name: z.string().trim().min(1, 'Nama kategori wajib diisi').max(100),
	slug: optionalSlug
});
export type CategoryInput = z.infer<typeof categorySchema>;
