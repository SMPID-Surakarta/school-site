import { z } from 'zod';

const downloadBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	url: z
		.string()
		.trim()
		.max(300)
		.refine(
			(value) => value === '' || value.startsWith('/') || /^https?:\/\//i.test(value),
			'Gunakan path internal (/halaman) atau URL http(s)'
		)
		.optional()
		.or(z.literal('')),
	category: z.string().trim().max(100).optional().or(z.literal('')),
	size: z.string().trim().max(50).optional().or(z.literal('')),
	fileMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined))
};

export const createDownloadSchema = z.object(downloadBase);
export type CreateDownloadInput = z.infer<typeof createDownloadSchema>;

export const updateDownloadSchema = z.object(downloadBase);
export type UpdateDownloadInput = z.infer<typeof updateDownloadSchema>;
