import { z } from 'zod';
import type { Role } from '$lib/rbac';
import { passwordSchema } from './auth';

const roleValues = ['ADMIN', 'EDITOR', 'STAFF'] as const satisfies readonly Role[];

export const createUserSchema = z.object({
	name: z.string().trim().min(1, 'Nama wajib diisi').max(120),
	email: z.string().trim().toLowerCase().email('Format email tidak valid'),
	password: passwordSchema,
	role: z.enum(roleValues),
	isActive: z.boolean().default(true)
});
export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
	name: z.string().trim().min(1).max(120),
	role: z.enum(roleValues),
	isActive: z.boolean(),
	// Optional: only set when the admin wants to reset the password.
	password: passwordSchema.optional()
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
