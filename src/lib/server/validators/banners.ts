import { z } from 'zod';

const optionalLink = z
	.string()
	.trim()
	.max(300)
	.refine(
		(value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
		'Gunakan path internal (/halaman) atau URL http(s)'
	)
	.optional()
	.or(z.literal(''));

const bannerBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	titleFontSize: z.number().int('Ukuran judul harus bilangan bulat').min(24).max(96).default(60),
	subtitle: z.string().trim().max(300).optional().or(z.literal('')),
	buttonText: z.string().trim().max(60).optional().or(z.literal('')),
	buttonUrl: optionalLink,
	order: z.number().int('Urutan harus bilangan bulat').min(0).default(0),
	published: z.boolean().default(false),
	// datetime-local strings, optional.
	startAt: z
		.string()
		.trim()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	endAt: z
		.string()
		.trim()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	imageMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined))
};

export const createBannerSchema = z.object(bannerBase);
export type CreateBannerInput = z.infer<typeof createBannerSchema>;

export const updateBannerSchema = z.object(bannerBase);
export type UpdateBannerInput = z.infer<typeof updateBannerSchema>;
