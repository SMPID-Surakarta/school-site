import { z } from 'zod';

const galleryBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	eventDate: z.string().trim().min(1, 'Tanggal kegiatan wajib diisi'),
	description: z
		.string()
		.trim()
		.max(500, 'Deskripsi maksimal 500 karakter')
		.optional()
		.or(z.literal('')),
	coverMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	photoMediaIds: z.array(z.string().uuid()).default([])
};

export const createGallerySchema = z.object(galleryBase);
export type CreateGalleryInput = z.infer<typeof createGallerySchema>;

export const updateGallerySchema = z.object(galleryBase);
export type UpdateGalleryInput = z.infer<typeof updateGallerySchema>;
