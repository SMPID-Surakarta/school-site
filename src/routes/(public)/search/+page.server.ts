import { error } from '@sveltejs/kit';
import * as publicService from '$lib/server/services/public.service';
import { publicNewsSearchSchema } from '$lib/server/validators/public-news';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	const parsed = publicNewsSearchSchema.safeParse({ q: event.url.searchParams.get('q') ?? '' });
	if (!parsed.success) throw error(400, 'Kata kunci maksimal 200 karakter.');
	const { q } = parsed.data;
	const result = await publicService.searchNews(q, event.url.searchParams.get('page'));
	return { q, ...result };
};
