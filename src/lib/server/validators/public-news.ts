import { z } from 'zod';

export const publicNewsFiltersSchema = z.object({
	categoryId: z.uuid().optional().catch(undefined)
});

export const publicNewsSearchSchema = z.object({
	q: z.string().trim().max(200, 'Kata kunci maksimal 200 karakter.').default('')
});
