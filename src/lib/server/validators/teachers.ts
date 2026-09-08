import { z } from 'zod';

const optionalSlug = z
	.string()
	.trim()
	.max(200)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung')
	.optional()
	.or(z.literal('').transform(() => undefined));

const emptyableText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

const teacherBase = {
	name: z.string().trim().min(1, 'Nama wajib diisi').max(150),
	slug: optionalSlug,
	position: emptyableText(150),
	subject: emptyableText(150),
	nipNuptk: emptyableText(60),
	bio: emptyableText(2000),
	photoMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined)),
	isActive: z.boolean().default(true)
};

export const createTeacherSchema = z.object(teacherBase);
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object(teacherBase);
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
