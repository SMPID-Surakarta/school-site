import { z } from 'zod';

export const loginSchema = z.object({
	email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
	password: z.string().min(1, 'Password wajib diisi')
});
export type LoginInput = z.infer<typeof loginSchema>;

/** Shared password policy for account creation / password changes. */
export const passwordSchema = z
	.string()
	.min(8, 'Password minimal 8 karakter')
	.max(128, 'Password terlalu panjang');
