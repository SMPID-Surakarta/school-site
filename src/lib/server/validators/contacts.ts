import { z } from 'zod';

/** Public contact form submission (PRD §4 contacts). */
export const contactMessageSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi').max(120),
	email: z
		.string()
		.trim()
		.toLowerCase()
		.email('Format email tidak valid')
		.max(200)
		.optional()
		.or(z.literal('')),
	phone: z
		.string()
		.trim()
		.min(8, 'Nomor telepon wajib diisi')
		.max(60)
		.regex(/^[+\d][\d\s().-]+$/, 'Format nomor telepon tidak valid'),
	message: z.string().trim().min(10, 'Pesan minimal 10 karakter').max(3000)
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
