import { z } from 'zod';
import {
	ACHIEVEMENT_CATEGORIES,
	ACHIEVEMENT_LEVELS,
	LEGACY_ACHIEVEMENT_CATEGORIES,
	LEGACY_ACHIEVEMENT_LEVELS
} from '$lib/utils/achievements';

export { ACHIEVEMENT_CATEGORIES, ACHIEVEMENT_LEVELS };

const achievementCategoryValues = [...ACHIEVEMENT_CATEGORIES, ...LEGACY_ACHIEVEMENT_CATEGORIES] as [
	string,
	...string[]
];
const achievementLevelValues = [...ACHIEVEMENT_LEVELS, ...LEGACY_ACHIEVEMENT_LEVELS] as [
	string,
	...string[]
];

const achievementBase = {
	title: z.string().trim().min(1, 'Judul wajib diisi').max(200),
	description: z.string().trim().max(2000).optional().or(z.literal('')),
	studentName: z.string().trim().max(150).optional().or(z.literal('')),
	// ISO date string (YYYY-MM-DD); optional.
	date: z
		.string()
		.trim()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD')
		.optional()
		.or(z.literal('').transform(() => undefined)),
	category: z
		.enum(achievementCategoryValues)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	level: z
		.enum(achievementLevelValues)
		.optional()
		.or(z.literal('').transform(() => undefined)),
	rank: z.string().trim().max(100).optional().or(z.literal('')),
	imageMediaId: z
		.string()
		.uuid()
		.optional()
		.or(z.literal('').transform(() => undefined))
};

export const createAchievementSchema = z.object(achievementBase);
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;

export const updateAchievementSchema = z.object(achievementBase);
export type UpdateAchievementInput = z.infer<typeof updateAchievementSchema>;
